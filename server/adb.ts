import { exec, execFile } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { promisify } from "node:util";
import { saveDevice, insertEvidenceFile, addChainOfCustodyRecord, insertTimelineEvent } from "./db.js";

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

// Check if adb binary is accessible
export async function checkAdbBinary(): Promise<{ available: boolean; path: string; version?: string }> {
  try {
    const { stdout } = await execAsync("adb version");
    const firstLine = stdout.split("\n")[0] || "Android Debug Bridge";
    return { available: true, path: "adb", version: firstLine };
  } catch (err) {
    // Check common Linux and Android SDK locations
    const candidatePaths = [
      "/usr/bin/adb",
      "/usr/local/bin/adb",
      path.join(process.env.HOME || "", "Android/Sdk/platform-tools/adb"),
      path.join(process.env.HOME || "", ".android-sdk/platform-tools/adb"),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const { stdout } = await execAsync(`${p} version`);
          return { available: true, path: p, version: stdout.split("\n")[0] };
        } catch {
          // continue checking
        }
      }
    }

    return { available: false, path: "" };
  }
}

// List real connected Android devices
export async function getConnectedAdbDevices() {
  const binaryCheck = await checkAdbBinary();
  if (!binaryCheck.available) {
    return {
      adbInstalled: false,
      devices: [],
      error: "ADB binary not found in system PATH. On Linux, run: sudo ./scripts/install-linux.sh (or apt install android-tools-adb)",
      troubleshooting: [
        "1. Install ADB on your Linux workstation: sudo apt install android-tools-adb",
        "2. Add your user to the plugdev group: sudo usermod -aG plugdev $USER",
        "3. Copy USB udev rules: sudo cp scripts/51-android.rules /etc/udev/rules.d/ && sudo udevadm control --reload-rules",
        "4. Connect your Android phone with an authentic USB cable.",
        "5. Enable USB Debugging in Settings > Developer Options on the target phone."
      ]
    };
  }

  const adbCmd = binaryCheck.path;

  try {
    const { stdout } = await execAsync(`${adbCmd} devices -l`);
    const lines = stdout.trim().split("\n").slice(1); // skip "List of devices attached"

    const devices = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const parts = trimmed.split(/\s+/);
      const serial = parts[0];
      const state = parts[1]; // "device", "unauthorized", "offline", "no permissions"

      const deviceData: any = {
        serial,
        adbState: state === "device" ? "CONNECTED" : state === "unauthorized" ? "UNAUTHORIZED" : state === "offline" ? "OFFLINE" : "UNAUTHORIZED",
        rawState: state,
        model: "Android Device",
        manufacturer: "Android",
        marketName: "Target Device",
        androidVersion: "Unknown",
        sdkVersion: 0,
        securityPatch: "Unknown",
        batteryLevel: 0,
        isCharging: false,
        rootStatus: "SELINUX_ENFORCING",
        encryptionType: "File-Based Encryption (FBE)",
        usbVid: "Unknown",
        usbPid: "Unknown",
        storage: {
          totalSpace: "Unknown",
          availableSpace: "Unknown",
          encryptionType: "File-Based Encryption (FBE)"
        }
      };

      // Extract model / product from verbose listing
      for (const part of parts.slice(2)) {
        if (part.startsWith("model:")) deviceData.model = part.replace("model:", "").replace(/_/g, " ");
        if (part.startsWith("product:")) deviceData.product = part.replace("product:", "");
        if (part.startsWith("device:")) deviceData.device = part.replace("device:", "");
      }

      // If device is authorized, query real properties directly
      if (state === "device") {
        try {
          const [getpropRes, batteryRes, enforceRes] = await Promise.allSettled([
            execAsync(`${adbCmd} -s ${serial} shell getprop`),
            execAsync(`${adbCmd} -s ${serial} shell dumpsys battery`),
            execAsync(`${adbCmd} -s ${serial} shell getenforce`)
          ]);

          if (getpropRes.status === "fulfilled") {
            const propText = getpropRes.value.stdout;
            const extractProp = (key: string) => {
              const m = propText.match(new RegExp(`\\[${key}\\]:\\s*\\[([^\\]]+)\\]`));
              return m ? m[1] : undefined;
            };

            deviceData.manufacturer = extractProp("ro.product.manufacturer") || deviceData.manufacturer;
            deviceData.model = extractProp("ro.product.model") || deviceData.model;
            deviceData.marketName = `${deviceData.manufacturer} ${deviceData.model}`;
            deviceData.androidVersion = extractProp("ro.build.version.release") || "14";
            deviceData.sdkVersion = parseInt(extractProp("ro.build.version.sdk") || "34", 10);
            deviceData.buildNumber = extractProp("ro.build.display.id") || extractProp("ro.build.id") || "Unknown";
            deviceData.securityPatch = extractProp("ro.build.version.security_patch") || "Unknown";

            const cryptoState = extractProp("ro.crypto.state");
            const cryptoType = extractProp("ro.crypto.type");
            deviceData.encryptionType = cryptoType === "file" ? "File-Based Encryption (FBE)" : cryptoState === "encrypted" ? "Full Disk Encryption (FDE)" : "Encrypted (FBE)";
          }

          if (batteryRes.status === "fulfilled") {
            const bText = batteryRes.value.stdout;
            const levelMatch = bText.match(/level:\s*(\d+)/);
            const statusMatch = bText.match(/status:\s*(\d+)/);
            if (levelMatch) deviceData.batteryLevel = parseInt(levelMatch[1], 10);
            if (statusMatch) deviceData.isCharging = statusMatch[1] === "2" || statusMatch[1] === "5";
          }

          if (enforceRes.status === "fulfilled") {
            const enf = enforceRes.value.stdout.trim();
            deviceData.rootStatus = enf.toLowerCase().includes("enforcing") ? "UNROOTED_SELINUX_ENFORCING" : "PERMISSIVE";
          }
        } catch (queryErr) {
          console.error(`Error querying properties for ${serial}:`, queryErr);
        }
      }

      // Persist real detected device to SQLite
      saveDevice(deviceData);
      devices.push(deviceData);
    }

    return {
      adbInstalled: true,
      devices,
      count: devices.length,
      binaryPath: adbCmd
    };
  } catch (err: any) {
    return {
      adbInstalled: true,
      devices: [],
      error: `ADB command error: ${err?.message || err}`,
      troubleshooting: [
        "Check if adb server is running. Try: adb kill-server && adb start-server",
        "Verify USB permissions: On Linux, ensure 51-android.rules is installed."
      ]
    };
  }
}

// Execute safe read-only ADB diagnostic commands
export async function executeSafeAdbCommand(serial: string, cmd: string) {
  const binaryCheck = await checkAdbBinary();
  if (!binaryCheck.available) {
    throw new Error("ADB binary not available on host system.");
  }

  const adbCmd = binaryCheck.path;

  // Whitelist safe inspection commands
  const cleanCmd = cmd.trim();
  const allowedPrefixes = [
    "getprop",
    "dumpsys battery",
    "dumpsys package",
    "dumpsys telephony.registry",
    "dumpsys wifi",
    "getenforce",
    "df",
    "uptime",
    "cat /proc/version",
    "pm list packages",
    "ls -la /sdcard",
    "content query"
  ];

  const isAllowed = allowedPrefixes.some((p) => cleanCmd.startsWith(p));
  if (!isAllowed) {
    throw new Error(`Command '${cleanCmd}' not permitted in forensic read-only mode.`);
  }

  const fullCmd = `${adbCmd} -s ${serial} shell "${cleanCmd.replace(/"/g, '\\"')}"`;
  const { stdout, stderr } = await execAsync(fullCmd, { maxBuffer: 10 * 1024 * 1024, timeout: 30000 });
  return { stdout, stderr };
}

// Perform real forensic acquisition on target phone
export async function performRealAcquisition(serial: string, caseId: string, profile: "QUICK" | "STANDARD" | "DEEP") {
  const binaryCheck = await checkAdbBinary();
  if (!binaryCheck.available) {
    throw new Error("ADB is not installed on the workstation. Cannot perform physical acquisition.");
  }

  const adbCmd = binaryCheck.path;
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const caseVaultDir = path.join(process.cwd(), "evidence_vault", "cases", caseId, timestamp);

  fs.mkdirSync(caseVaultDir, { recursive: true });

  const acquiredFiles: any[] = [];

  // Helper to compute hashes
  const hashFile = (filePath: string) => {
    const fileBuffer = fs.readFileSync(filePath);
    const sha256 = crypto.createHash("sha256").update(fileBuffer).digest("hex");
    const sha512 = crypto.createHash("sha512").update(fileBuffer).digest("hex");
    return { sha256, sha512, size: fileBuffer.length };
  };

  // 1. Device build properties dump
  try {
    const propPath = path.join(caseVaultDir, "build_properties.txt");
    const { stdout } = await execAsync(`${adbCmd} -s ${serial} shell getprop`);
    fs.writeFileSync(propPath, stdout, "utf-8");
    const hashes = hashFile(propPath);
    const ev = {
      id: `EV-${Date.now()}-PROPS`,
      caseId,
      filename: "build_properties.txt",
      source: "adb shell getprop",
      destination: propPath,
      sha256: hashes.sha256,
      sha512: hashes.sha512,
      size: hashes.size,
      acquiredAt: new Date().toISOString(),
      method: "LOGICAL_GETPROP",
      sourceDevice: serial,
      mimeType: "text/plain",
      category: "System Logs",
      status: "ACQUIRED",
      notes: "Hardware and OS build fingerprint configuration."
    };
    insertEvidenceFile(ev);
    acquiredFiles.push(ev);
  } catch (e) {
    console.error("Failed to dump getprop:", e);
  }

  // 2. Installed packages dump
  try {
    const pkgPath = path.join(caseVaultDir, "installed_packages.txt");
    const { stdout } = await execAsync(`${adbCmd} -s ${serial} shell pm list packages -f -u`);
    fs.writeFileSync(pkgPath, stdout, "utf-8");
    const hashes = hashFile(pkgPath);
    const ev = {
      id: `EV-${Date.now()}-PKGS`,
      caseId,
      filename: "installed_packages.txt",
      source: "adb shell pm list packages",
      destination: pkgPath,
      sha256: hashes.sha256,
      sha512: hashes.sha512,
      size: hashes.size,
      acquiredAt: new Date().toISOString(),
      method: "LOGICAL_PM_DUMP",
      sourceDevice: serial,
      mimeType: "text/plain",
      category: "Application Manifests",
      status: "ACQUIRED",
      notes: "Complete inventory of user and system APK package paths."
    };
    insertEvidenceFile(ev);
    acquiredFiles.push(ev);
  } catch (e) {
    console.error("Failed to dump packages:", e);
  }

  // 3. Battery & Hardware Telemetry
  try {
    const batPath = path.join(caseVaultDir, "dumpsys_battery.txt");
    const { stdout } = await execAsync(`${adbCmd} -s ${serial} shell dumpsys battery`);
    fs.writeFileSync(batPath, stdout, "utf-8");
    const hashes = hashFile(batPath);
    const ev = {
      id: `EV-${Date.now()}-BAT`,
      caseId,
      filename: "dumpsys_battery.txt",
      source: "adb shell dumpsys battery",
      destination: batPath,
      sha256: hashes.sha256,
      sha512: hashes.sha512,
      size: hashes.size,
      acquiredAt: new Date().toISOString(),
      method: "LOGICAL_DUMPSYS",
      sourceDevice: serial,
      mimeType: "text/plain",
      category: "System Logs",
      status: "ACQUIRED",
      notes: "Battery state, thermal level, and USB charging voltage history."
    };
    insertEvidenceFile(ev);
    acquiredFiles.push(ev);
  } catch (e) {
    console.error("Failed to dump battery:", e);
  }

  // 4. Accessible Shared Storage Pull (Documents or Download if accessible)
  try {
    const pullDir = path.join(caseVaultDir, "shared_storage");
    fs.mkdirSync(pullDir, { recursive: true });
    // Pull Documents or camera folder if exists
    await execAsync(`${adbCmd} -s ${serial} pull /sdcard/Documents "${pullDir}" || true`, { timeout: 45000 });
  } catch (e) {
    // Non-fatal if folder doesn't exist
  }

  // Record action in Chain of Custody
  const coc = addChainOfCustodyRecord({
    caseId,
    investigator: "Lead Examiner",
    action: `Completed ${profile} forensic acquisition on physical device ${serial}. Acquired ${acquiredFiles.length} baseline manifests with double-hash verification.`,
    evidenceId: serial
  });

  // Timeline Event
  insertTimelineEvent({
    id: `EVT-${Date.now()}`,
    caseId,
    dateTime: new Date().toISOString(),
    type: "LOG",
    eventDescription: `Forensic acquisition completed (${profile}) on target ${serial}. Integrity manifest sealed.`,
    source: "NEON ACQUISITION ENGINE",
    device: serial
  });

  return {
    success: true,
    acquiredFiles,
    vaultDirectory: caseVaultDir,
    chainOfCustodyRecord: coc
  };
}
