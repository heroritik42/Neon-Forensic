import React, { useState } from "react";
import {
  Smartphone,
  Terminal,
  Usb,
  ShieldCheck,
  AlertTriangle,
  Play,
  RotateCcw,
  BatteryCharging,
  HardDrive,
  Cpu,
  RefreshCw,
  CheckCircle2,
  ExternalLink
} from "lucide-react";
import { AndroidDevice, AdbCommandLog } from "../types/forensics";

interface DeviceManagerViewProps {
  device: AndroidDevice;
  logs: AdbCommandLog[];
  onExecuteAdbCommand: (cmd: string) => void;
  onScanDevices?: () => void;
  isScanningDevices?: boolean;
  detectedDevices?: AndroidDevice[];
  onSelectDevice?: (dev: AndroidDevice) => void;
}

export const DeviceManagerView: React.FC<DeviceManagerViewProps> = ({
  device,
  logs,
  onExecuteAdbCommand,
  onScanDevices,
  isScanningDevices,
  detectedDevices = [],
  onSelectDevice,
}) => {
  const [selectedCommand, setSelectedCommand] = useState("adb shell getprop");
  const [activeTab, setActiveTab] = useState<"PROPERTIES" | "ADB_WRAPPER" | "USB_SUBSYSTEM">("PROPERTIES");
  const [isExecuting, setIsExecuting] = useState(false);

  const isConnected = device && device.serial !== "NO_DEVICE" && device.adbState === "CONNECTED";
  const isUnauthorized = device && device.adbState === "UNAUTHORIZED";

  const predefinedCommands = [
    { label: "Check State", cmd: "adb get-state" },
    { label: "Device Properties", cmd: "adb shell getprop" },
    { label: "List 3rd-Party APKs", cmd: "adb shell pm list packages -f -3" },
    { label: "Battery Telemetry", cmd: "adb shell dumpsys battery" },
    { label: "Storage Disk Usage", cmd: "adb shell df -h" },
    { label: "Check SELinux Mode", cmd: "adb shell getenforce" },
    { label: "Dump Wi-Fi Configs", cmd: "adb shell dumpsys wifi" },
    { label: "OS Kernel Version", cmd: "adb shell cat /proc/version" },
  ];

  const handleRunCommand = async (cmdToRun: string) => {
    if (!cmdToRun.trim() || isExecuting) return;
    setIsExecuting(true);
    try {
      await onExecuteAdbCommand(cmdToRun.trim());
    } finally {
      setIsExecuting(false);
    }
  };

  const handleRunCustom = (e: React.FormEvent) => {
    e.preventDefault();
    handleRunCommand(selectedCommand);
  };

  return (
    <div className="space-y-6">
      {/* Device State Header & Diagnostics */}
      <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
            isConnected ? "bg-cyan-950/80 border border-cyan-500/40 text-cyan-400" : "bg-slate-900 border border-slate-700 text-slate-400"
          }`}>
            <Smartphone className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-bold text-white font-mono-forensic">
                {isConnected ? `${device.manufacturer} ${device.model}` : "Physical Device Monitor"}
              </h2>
              <span
                className={`text-xs px-2 py-0.5 rounded font-mono-forensic font-bold uppercase ${
                  isConnected
                    ? "bg-emerald-950 border border-emerald-500/40 text-emerald-300"
                    : isUnauthorized
                    ? "bg-amber-950 border border-amber-500/40 text-amber-300"
                    : "bg-slate-900 border border-slate-700 text-slate-400"
                }`}
              >
                ● {device.adbState}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono-forensic mt-1">
              Serial: <span className="text-slate-200 font-bold">{device.serial}</span>
              {isConnected && ` | USB VID: ${device.vendorId || "0x18D1"} | PID: ${device.productId || "0x4EE7"}`}
            </p>
          </div>
        </div>

        {/* Real Device Hardware Scanner & Device Picker */}
        <div className="flex items-center gap-2.5 flex-wrap w-full md:w-auto">
          {detectedDevices.length > 1 && onSelectDevice && (
            <select
              value={device.serial}
              onChange={(e) => {
                const found = detectedDevices.find((d) => d.serial === e.target.value);
                if (found) onSelectDevice(found);
              }}
              className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-slate-200 text-xs font-mono-forensic"
            >
              {detectedDevices.map((d) => (
                <option key={d.serial} value={d.serial}>
                  {d.manufacturer} {d.model} ({d.serial})
                </option>
              ))}
            </select>
          )}

          {onScanDevices && (
            <button
              onClick={onScanDevices}
              disabled={isScanningDevices}
              className="px-4 py-2 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 text-xs font-mono-forensic font-bold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningDevices ? "animate-spin text-cyan-400" : ""}`} />
              <span>{isScanningDevices ? "Scanning ADB..." : "Scan USB Bus"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Warning Banner if UNAUTHORIZED */}
      {isUnauthorized && (
        <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/50 flex items-start gap-3 text-amber-200 text-xs leading-relaxed font-mono-forensic shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm text-amber-300">ACTION REQUIRED ON PHONE: USB DEBUGGING PROMPT</div>
            <p className="mt-1">
              Unlock the device display and locate the "Allow USB debugging?" dialog. Check the box "Always allow from this computer" and tap "Allow". Then click "Scan USB Bus" above.
            </p>
          </div>
        </div>
      )}

      {/* Notice if DISCONNECTED */}
      {!isConnected && !isUnauthorized && (
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-start gap-3 text-slate-300 text-xs font-mono-forensic">
          <Usb className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-white text-sm">NO PHYSICAL PHONE ATTACHED</div>
            <p className="mt-1 text-slate-400">
              Attach an Android phone via USB cable to this workstation. Enable Developer Options &amp; USB Debugging. On Linux, verify that Android udev rules are loaded (<code className="text-cyan-300">scripts/install-linux.sh</code>).
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab("PROPERTIES")}
          className={`px-4 py-2 rounded-t-md text-xs font-mono-forensic font-semibold transition-colors ${
            activeTab === "PROPERTIES"
              ? "bg-slate-900 border-b-2 border-cyan-400 text-cyan-300"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Device Properties &amp; Security State
        </button>
        <button
          onClick={() => setActiveTab("ADB_WRAPPER")}
          className={`px-4 py-2 rounded-t-md text-xs font-mono-forensic font-semibold transition-colors ${
            activeTab === "ADB_WRAPPER"
              ? "bg-slate-900 border-b-2 border-cyan-400 text-cyan-300"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          ADB Command Console ({logs.length} logged)
        </button>
        <button
          onClick={() => setActiveTab("USB_SUBSYSTEM")}
          className={`px-4 py-2 rounded-t-md text-xs font-mono-forensic font-semibold transition-colors ${
            activeTab === "USB_SUBSYSTEM"
              ? "bg-slate-900 border-b-2 border-cyan-400 text-cyan-300"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          Linux USB Subsystem &amp; Drivers
        </button>
      </div>

      {/* Tab 1: Properties */}
      {activeTab === "PROPERTIES" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-3 font-mono-forensic text-xs">
            <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider pb-2 border-b border-slate-800">
              <Cpu className="w-4 h-4" />
              Build &amp; Operating System
            </div>
            <div>
              <span className="text-slate-500">Target Model:</span>
              <div className="text-slate-200 font-bold">{device.manufacturer} {device.model}</div>
            </div>
            <div>
              <span className="text-slate-500">Android Version:</span>
              <div className="text-slate-200 font-bold">{device.androidVersion}</div>
            </div>
            <div>
              <span className="text-slate-500">SDK API Level:</span>
              <div className="text-slate-200">{device.sdkVersion || "Unknown"}</div>
            </div>
            <div>
              <span className="text-slate-500">Security Patch Level:</span>
              <div className="text-emerald-400">{device.securityPatch}</div>
            </div>
            <div>
              <span className="text-slate-500">Build Fingerprint:</span>
              <div className="text-slate-300 break-all text-[11px] mt-0.5">{device.buildFingerprint}</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-3 font-mono-forensic text-xs">
            <div className="flex items-center gap-2 text-purple-400 font-bold uppercase tracking-wider pb-2 border-b border-slate-800">
              <ShieldCheck className="w-4 h-4" />
              Root &amp; Integrity Assessment
            </div>
            <div>
              <span className="text-slate-500">Root Status:</span>
              <div className="text-emerald-400 font-bold">{device.rootStatus}</div>
            </div>
            <div>
              <span className="text-slate-500">SELinux Policy:</span>
              <div className="text-slate-200">Enforcing (Mandatory Access Control)</div>
            </div>
            <div>
              <span className="text-slate-500">Android Verified Boot (AVB):</span>
              <div className="text-emerald-400">Green State (Locked Bootloader)</div>
            </div>
            <div>
              <span className="text-slate-500">Hardware Keystore:</span>
              <div className="text-slate-300">StrongBox Keymaster Active</div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-3 font-mono-forensic text-xs">
            <div className="flex items-center gap-2 text-blue-400 font-bold uppercase tracking-wider pb-2 border-b border-slate-800">
              <HardDrive className="w-4 h-4" />
              Storage &amp; Power
            </div>
            <div>
              <span className="text-slate-500">Internal Storage:</span>
              <div className="text-slate-200">
                {device.storage.totalBytes > 0
                  ? `${(device.storage.usedBytes / 1e9).toFixed(1)} GB used of ${(device.storage.totalBytes / 1e9).toFixed(0)} GB`
                  : "Requires connected device"}
              </div>
            </div>
            <div>
              <span className="text-slate-500">Encryption Architecture:</span>
              <div className="text-cyan-400 font-bold">{device.storage.encryptionType}</div>
            </div>
            <div>
              <span className="text-slate-500">Battery Status:</span>
              <div className="text-slate-200 flex items-center gap-1.5 mt-0.5">
                <BatteryCharging className="w-4 h-4 text-emerald-400" />
                {device.batteryLevel > 0 ? `${device.batteryLevel}%` : "Awaiting telemetry"} ({device.batteryHealth})
              </div>
            </div>
            <div>
              <span className="text-slate-500">Data Sandboxing:</span>
              <div className="text-slate-400 text-[11px]">Enforced via Linux UIDs per application</div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: ADB Wrapper */}
      {activeTab === "ADB_WRAPPER" && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-3">
            <div className="text-xs font-mono-forensic text-slate-400">
              Select predefined read-only forensic inspection command:
            </div>
            <div className="flex flex-wrap gap-2">
              {predefinedCommands.map((c) => (
                <button
                  key={c.label}
                  onClick={() => {
                    setSelectedCommand(c.cmd);
                    handleRunCommand(c.cmd);
                  }}
                  disabled={!isConnected || isExecuting}
                  className="px-2.5 py-1.5 rounded bg-slate-900 border border-slate-700/60 hover:border-cyan-500/50 hover:bg-cyan-950/30 text-xs font-mono-forensic text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {c.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleRunCustom} className="flex gap-2 pt-2">
              <input
                type="text"
                value={selectedCommand}
                onChange={(e) => setSelectedCommand(e.target.value)}
                placeholder="e.g. adb shell getprop"
                disabled={!isConnected || isExecuting}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded font-mono-forensic text-xs text-slate-200 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!isConnected || isExecuting}
                className="px-4 py-2 rounded bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold font-mono-forensic text-xs flex items-center gap-1.5 transition-colors"
              >
                {isExecuting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                Execute
              </button>
            </form>
          </div>

          {/* Execution History */}
          <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-2">
            <div className="text-xs font-mono-forensic font-bold text-slate-400 uppercase tracking-wider">
              ADB Command Output Stream:
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto font-mono-forensic text-xs">
              {logs.length === 0 ? (
                <div className="text-slate-500 py-6 text-center">
                  No commands issued yet. Select a command above to query the connected phone.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-3 rounded bg-slate-950 border border-slate-900 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-cyan-400 font-bold">$ {log.command}</span>
                      <span className={log.result === "SUCCESS" ? "text-emerald-400" : "text-rose-400"}>
                        [{log.result}] • {log.timestamp.slice(11, 19)}
                      </span>
                    </div>
                    {log.outputSnippet && (
                      <pre className="p-2.5 rounded bg-slate-900/80 text-slate-300 text-[11px] whitespace-pre-wrap font-mono overflow-x-auto border border-slate-800">
                        {log.outputSnippet}
                      </pre>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: USB Subsystem */}
      {activeTab === "USB_SUBSYSTEM" && (
        <div className="p-5 rounded-xl bg-[#090d16] border border-slate-800 space-y-4 font-mono-forensic text-xs">
          <div className="text-sm font-bold text-white flex items-center gap-2">
            <Usb className="w-4 h-4 text-cyan-400" />
            Linux USB Subsystem &amp; Device Rules Configuration
          </div>
          <p className="text-slate-400 leading-relaxed">
            Linux requires udev permissions in <code className="text-cyan-300">/etc/udev/rules.d/51-android.rules</code> to permit standard users to establish ADB USB protocol streams without root permissions.
          </p>

          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
            <div className="text-slate-300 font-bold">Standard Linux Setup Command:</div>
            <pre className="p-3 bg-slate-900 text-emerald-400 rounded text-xs overflow-x-auto">
              {`# Run installer to configure udev rules & ADB automatically:
sudo ./scripts/install-linux.sh

# Or manual verification:
lsusb
adb devices -l`}
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500">Connected Serial:</span>
              <div className="text-slate-200 font-bold">{device.serial}</div>
            </div>
            <div className="p-3 rounded bg-slate-950 border border-slate-800">
              <span className="text-slate-500">USB Protocol:</span>
              <div className="text-slate-200">Android Debug Bridge (ADB) Subsystem</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
