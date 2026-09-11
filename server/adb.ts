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
    const rawLines = stdout.trim().split("\n");

    // Strictly skip daemon start notices like:
    // * daemon not running; starting now at tcp:5037
    // * daemon started successfully
    // List of devices attached
    const listHeaderIdx = rawLines.findIndex((l) => l.includes("List of devices attached"));
    const lines = listHeaderIdx !== -1 ? rawLines.slice(listHeaderIdx + 1) : rawLines;

    const devices = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      // Skip comments or daemon notices
      if (trimmed.startsWith("*") || trimmed.toLowerCase().includes("daemon") || trimmed.toLowerCase().includes("list of devices")) {
        continue;
      }

      const parts = trimmed.split(/\s+/);
      if (parts.length < 2) continue;

      const serial = parts[0];
      const state = parts[1]; // "device", "unauthorized", "offline", "no" (from "no permissions")

      let adbState = "UNAUTHORIZED";
      if (state === "device") adbState = "CONNECTED";
      else if (state === "unauthorized") adbState = "UNAUTHORIZED";
      else if (state === "offline") adbState = "OFFLINE";
      else if (state === "no" || trimmed.includes("no permissions")) adbState = "NO_PERMISSIONS";

      const deviceData: any = {
        serial,
        adbState,
        rawState: trimmed.includes("no permissions") ? "no permissions" : state,
        model: serial.includes(":") ? "Android over Wi-Fi" : "Android Device",
        manufacturer: "Android",
        marketName: serial.includes(":") ? `Wireless Device (${serial})` : "Target Device",
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
            execAsync(`${adbCmd} -s ${serial} shell getprop`, { timeout: 6000 }),
            execAsync(`${adbCmd} -s ${serial} shell dumpsys battery`, { timeout: 4000 }),
            execAsync(`${adbCmd} -s ${serial} shell getenforce`, { timeout: 3000 })
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

    // Check USB physical hardware bus if 0 ADB devices found
    let usbHardware = { detected: false, info: "", vendor: "" };
    if (devices.length === 0) {
      usbHardware = await checkUsbHardwareBus();
    }

    return {
      adbInstalled: true,
      devices,
      count: devices.length,
      binaryPath: adbCmd,
      usbHardware
    };
  } catch (err: any) {
    const usbHardware = await checkUsbHardwareBus();
    return {
      adbInstalled: true,
      devices: [],
      error: `ADB command error: ${err?.message || err}`,
      usbHardware,
      troubleshooting: [
        "Check if adb server is running. Try: adb kill-server && adb start-server",
        "Verify USB permissions: On Linux, ensure 51-android.rules is installed."
      ]
    };
  }
}

// Check if any Android phone is physically plugged into USB via lsusb
export async function checkUsbHardwareBus(): Promise<{ detected: boolean; info: string; vendor: string }> {
  try {
    const { stdout } = await execAsync("lsusb", { timeout: 4000 });
    const lines = stdout.split("\n");

    const phoneVendors = [
      { id: "18d1", name: "Google / Pixel" },
      { id: "04e8", name: "Samsung" },
      { id: "2717", name: "Xiaomi / Redmi / Poco" },
      { id: "22d9", name: "Oppo / Realme" },
      { id: "2a70", name: "OnePlus" },
      { id: "2d95", name: "Vivo / iQOO" },
      { id: "12d1", name: "Huawei / Honor" },
      { id: "22b8", name: "Motorola" },
      { id: "0fce", name: "Sony Xperia" },
      { id: "1004", name: "LG Electronics" },
      { id: "0e8d", name: "MediaTek Device" },
      { id: "05c6", name: "Qualcomm Device" },
      { id: "0b05", name: "ASUS ROG / Zenfone" },
      { id: "1782", name: "Spreadtrum / Unisoc" },
      { id: "2a45", name: "Meizu" }
    ];

    for (const line of lines) {
      for (const vendor of phoneVendors) {
        if (line.toLowerCase().includes(`:${vendor.id.toLowerCase()}`) || line.toLowerCase().includes(vendor.name.toLowerCase())) {
          return {
            detected: true,
            vendor: vendor.name,
            info: line.trim()
          };
        }
      }
      if (line.toLowerCase().includes("android") || line.toLowerCase().includes("phone")) {
        return {
          detected: true,
          vendor: "Android Phone",
          info: line.trim()
        };
      }
    }
  } catch {}
  return { detected: false, info: "", vendor: "" };
}

// 1-Click ADB Server Restart & USB Reconnect Handshake
export async function restartAndFixAdb(): Promise<{ success: boolean; logs: string[]; devices: any[]; count: number }> {
  const binaryCheck = await checkAdbBinary();
  const adbCmd = binaryCheck.available ? binaryCheck.path : "adb";
  const logs: string[] = [];

  try {
    // 1. Kill any hung or zombie adb daemon
    try {
      await execAsync(`${adbCmd} kill-server`, { timeout: 6000 });
      logs.push("Killed existing ADB daemon.");
    } catch {}

    // 2. Start fresh daemon
    try {
      await execAsync(`${adbCmd} start-server`, { timeout: 10000 });
      logs.push("Started fresh ADB daemon.");
    } catch (e: any) {
      logs.push(`ADB start notice: ${e.message}`);
    }

    // 3. Force ADB to re-send RSA authorization challenge to the phone
    try {
      await execAsync(`${adbCmd} reconnect`, { timeout: 6000 });
      logs.push("Sent 'adb reconnect' to trigger RSA approval dialog on phone screen.");
    } catch {}

    try {
      await execAsync(`${adbCmd} reconnect offline`, { timeout: 6000 });
    } catch {}

    // 4. Reload udev rules if available
    try {
      await execAsync("udevadm control --reload-rules || true", { timeout: 4000 });
      logs.push("Reloaded Linux udev subsystem rules.");
    } catch {}

    // Wait a brief moment for USB bus handshake
    await new Promise((r) => setTimeout(r, 1200));

    // 5. Query devices
    const refreshed = await getConnectedAdbDevices();
    logs.push(`Scan complete: Found ${refreshed.devices.length} device(s).`);

    return {
      success: true,
      logs,
      devices: refreshed.devices,
      count: refreshed.devices.length
    };
  } catch (err: any) {
    return {
      success: false,
      logs: [...logs, `Error: ${err?.message || err}`],
      devices: [],
      count: 0
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

// ----------------------------------------------------------------------
// WIRELESS DEBUGGING HELPERS
// ----------------------------------------------------------------------

export async function discoverMdnsServices(): Promise<Array<{ ip: string; port: number; service: string; raw: string }>> {
  const binaryCheck = await checkAdbBinary();
  if (!binaryCheck.available) return [];
  const adbCmd = binaryCheck.path;
  try {
    const { stdout } = await execAsync(`${adbCmd} mdns services`, { timeout: 4000 });
    const lines = stdout.split("\n");
    const discovered: Array<{ ip: string; port: number; service: string; raw: string }> = [];
    for (const line of lines) {
      const match = line.match(/([0-9]+\.[0-9]+\.[0-9]+\.[0-9]+):([0-9]+)/);
      if (match) {
        discovered.push({
          ip: match[1],
          port: parseInt(match[2], 10),
          service: line.includes("_adb-tls-connect") ? "TLS_CONNECT" : line.includes("_adb-tls-pairing") ? "TLS_PAIRING" : "TCP",
          raw: line.trim()
        });
      }
    }
    return discovered;
  } catch {
    return [];
  }
}

export async function wirelessPair(ip: string, pairingPort: string | number, code: string, connectPort?: string | number) {
  const binaryCheck = await checkAdbBinary();
  if (!binaryCheck.available) {
    throw new Error("ADB binary not available on workstation.");
  }
  const adbCmd = binaryCheck.path;
  const cleanIp = ip.trim();
  const endpoint = `${cleanIp}:${pairingPort}`;

  try {
    const { stdout, stderr } = await execAsync(`${adbCmd} pair ${endpoint} ${code.trim()}`, { timeout: 15000 });
    const isSuccess = stdout.toLowerCase().includes("successfully paired") || !stderr;

    if (!isSuccess) {
      return {
        success: false,
        output: stdout || stderr || `Failed to pair with ${endpoint}`,
        endpoint,
        connected: false,
      };
    }

    // Pairing succeeded! Now auto-connect.
    // In Android 11+, the pairing port is different from the connect port.
    let connectOutput = "";
    let isConnected = false;

    // 1. Try explicit connectPort if user provided one
    if (connectPort && String(connectPort) !== String(pairingPort)) {
      const cRes = await wirelessConnect(cleanIp, connectPort);
      connectOutput += `\nConnect to specified port ${connectPort}: ${cRes.output}`;
      if (cRes.success) isConnected = true;
    }

    // 2. Try mDNS discovered connect port
    if (!isConnected) {
      try {
        const mdnsList = await discoverMdnsServices();
        const connectService = mdnsList.find((s) => s.ip === cleanIp && s.service === "TLS_CONNECT");
        if (connectService) {
          const cRes = await wirelessConnect(cleanIp, connectService.port);
          connectOutput += `\nAuto-connected via mDNS port ${connectService.port}: ${cRes.output}`;
          if (cRes.success) isConnected = true;
        }
      } catch {}
    }

    // 3. Try standard port 5555
    if (!isConnected) {
      const c5555 = await wirelessConnect(cleanIp, 5555);
      if (c5555.success) {
        connectOutput += `\nConnected via port 5555: ${c5555.output}`;
        isConnected = true;
      }
    }

    // 4. Try the pairing port as fallback
    if (!isConnected) {
      const cPairPort = await wirelessConnect(cleanIp, pairingPort);
      connectOutput += `\nConnect fallback (${pairingPort}): ${cPairPort.output}`;
      if (cPairPort.success) isConnected = true;
    }

    return {
      success: true,
      paired: true,
      connected: isConnected,
      output: `${stdout || "Successfully paired"}${connectOutput}`,
      endpoint,
    };
  } catch (err: any) {
    return {
      success: false,
      output: err?.message || String(err),
      endpoint,
      connected: false,
    };
  }
}

export async function wirelessConnect(ip: string, port: string | number) {
  const binaryCheck = await checkAdbBinary();
  if (!binaryCheck.available) {
    throw new Error("ADB binary not available on workstation.");
  }
  const adbCmd = binaryCheck.path;
  const endpoint = `${ip.trim()}:${port}`;
  try {
    const { stdout, stderr } = await execAsync(`${adbCmd} connect ${endpoint}`, { timeout: 15000 });
    const isSuccess = stdout.toLowerCase().includes("connected to") && !stdout.toLowerCase().includes("unable");
    return {
      success: isSuccess,
      output: stdout || stderr || `Connect result for ${endpoint}`,
      endpoint,
    };
  } catch (err: any) {
    return {
      success: false,
      output: err?.message || String(err),
      endpoint,
    };
  }
}

export async function wirelessDisconnect(target: string) {
  const binaryCheck = await checkAdbBinary();
  if (!binaryCheck.available) {
    throw new Error("ADB binary not available on workstation.");
  }
  const adbCmd = binaryCheck.path;
  try {
    const { stdout, stderr } = await execAsync(`${adbCmd} disconnect ${target.trim()}`, { timeout: 10000 });
    return { success: true, output: stdout || stderr || "Disconnected" };
  } catch (err: any) {
    return { success: false, output: err?.message || String(err) };
  }
}

export async function switchAdbToTcpip(serial?: string, port: number = 5555) {
  const binaryCheck = await checkAdbBinary();
  if (!binaryCheck.available) {
    throw new Error("ADB binary not available on workstation.");
  }
  const adbCmd = binaryCheck.path;
  const targetPrefix = serial && serial !== "NO_DEVICE" ? `-s ${serial}` : "";
  try {
    const { stdout, stderr } = await execAsync(`${adbCmd} ${targetPrefix} tcpip ${port}`, { timeout: 10000 });
    return {
      success: true,
      port,
      output: stdout || stderr || `Switched device to TCP/IP mode on port ${port}. You can now disconnect the USB cable and connect wirelessly!`,
    };
  } catch (err: any) {
    return {
      success: false,
      port,
      output: err?.message || String(err),
    };
  }
}

// ----------------------------------------------------------------------
// REMOTE CONTROL ENGINE & LIVE SCREEN CAPTURE
// ----------------------------------------------------------------------

export async function getScreenResolution(serial: string): Promise<{ width: number; height: number; density: number }> {
  const binaryCheck = await checkAdbBinary();
  if (!binaryCheck.available || !serial || serial === "NO_DEVICE") {
    return { width: 1080, height: 2400, density: 420 };
  }
  const adbCmd = binaryCheck.path;
  let width = 1080;
  let height = 2400;
  let density = 420;

  try {
    const { stdout: sizeOut } = await execAsync(`${adbCmd} -s ${serial} shell wm size`);
    const match = sizeOut.match(/Physical size:\s*(\d+)x(\d+)/i) || sizeOut.match(/(\d+)x(\d+)/);
    if (match) {
      width = parseInt(match[1], 10);
      height = parseInt(match[2], 10);
    }
  } catch {}

  try {
    const { stdout: densOut } = await execAsync(`${adbCmd} -s ${serial} shell wm density`);
    const densMatch = densOut.match(/Physical density:\s*(\d+)/i) || densOut.match(/(\d+)/);
    if (densMatch) {
      density = parseInt(densMatch[1], 10);
    }
  } catch {}

  return { width, height, density };
}

export async function captureScreenPng(serial: string): Promise<Buffer | null> {
  const binaryCheck = await checkAdbBinary();
  if (!binaryCheck.available || !serial || serial === "NO_DEVICE") {
    return null;
  }
  const adbCmd = binaryCheck.path;

  try {
    // execFile directly with binary buffer avoids shell stdout corruptions
    const { stdout } = await execFileAsync(adbCmd, ["-s", serial, "exec-out", "screencap", "-p"], {
      encoding: "buffer",
      maxBuffer: 25 * 1024 * 1024,
      timeout: 8000,
    });
    if (Buffer.isBuffer(stdout) && stdout.length > 100) {
      return stdout;
    }
    return null;
  } catch (err) {
    return null;
  }
}

export async function sendRemoteTap(serial: string, x: number, y: number) {
  const binaryCheck = await checkAdbBinary();
  if (!binaryCheck.available) throw new Error("ADB unavailable");
  const adbCmd = binaryCheck.path;
  const safeX = Math.max(0, Math.round(x));
  const safeY = Math.max(0, Math.round(y));
  await execAsync(`${adbCmd} -s ${serial} shell input tap ${safeX} ${safeY}`, { timeout: 5000 });
  return { success: true, x: safeX, y: safeY };
}

export async function sendRemoteSwipe(serial: string, x1: number, y1: number, x2: number, y2: number, duration: number = 300) {
  const binaryCheck = await checkAdbBinary();
  if (!binaryCheck.available) throw new Error("ADB unavailable");
  const adbCmd = binaryCheck.path;
  await execAsync(
    `${adbCmd} -s ${serial} shell input swipe ${Math.round(x1)} ${Math.round(y1)} ${Math.round(x2)} ${Math.round(y2)} ${duration}`,
    { timeout: 6000 }
  );
  return { success: true };
}

export async function sendRemoteKey(serial: string, keycode: string | number) {
  const binaryCheck = await checkAdbBinary();
  if (!binaryCheck.available) throw new Error("ADB unavailable");
  const adbCmd = binaryCheck.path;
  await execAsync(`${adbCmd} -s ${serial} shell input keyevent ${keycode}`, { timeout: 5000 });
  return { success: true, keycode };
}

export async function sendRemoteText(serial: string, text: string) {
  const binaryCheck = await checkAdbBinary();
  if (!binaryCheck.available) throw new Error("ADB unavailable");
  const adbCmd = binaryCheck.path;
  // Replace spaces with %s for adb shell input text
  const safeText = text.replace(/ /g, "%s").replace(/["$`\\]/g, "");
  await execAsync(`${adbCmd} -s ${serial} shell input text "${safeText}"`, { timeout: 5000 });
  return { success: true };
}

export async function sendRemoteIntent(serial: string, action: string, uri?: string) {
  const binaryCheck = await checkAdbBinary();
  if (!binaryCheck.available) throw new Error("ADB unavailable");
  const adbCmd = binaryCheck.path;
  const uriArg = uri ? `-d "${uri.replace(/"/g, "")}"` : "";
  await execAsync(`${adbCmd} -s ${serial} shell am start -a ${action} ${uriArg}`, { timeout: 6000 });
  return { success: true };
}
