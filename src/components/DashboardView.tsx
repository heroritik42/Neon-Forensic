import React from "react";
import {
  Smartphone,
  ShieldAlert,
  DownloadCloud,
  FileText,
  Image,
  Database,
  MessageSquare,
  Users,
  PhoneCall,
  Layers,
  Sparkles,
  ArrowRight,
  HardDrive,
  Activity,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Usb,
  Trash2,
  FolderOpen
} from "lucide-react";
import {
  ForensicCase,
  AndroidDevice,
  EvidenceFile,
  AdbCommandLog,
  TimelineEvent,
} from "../types/forensics";
import { NavTab } from "./Navigation";

interface DashboardViewProps {
  currentCase: ForensicCase;
  device: AndroidDevice;
  evidenceFiles: EvidenceFile[];
  smsCount: number;
  contactsCount: number;
  callsCount: number;
  appsCount: number;
  carvedCount: number;
  logs: AdbCommandLog[];
  recentEvents: TimelineEvent[];
  onNavigate: (tab: NavTab) => void;
  onStartAcquisition: () => void;
  onScanDevices?: () => void;
  isScanningDevices?: boolean;
  onLoadSampleCase?: () => void;
  onResetDatabase?: () => void;
  isSampleCaseLoaded?: boolean;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentCase,
  device,
  evidenceFiles,
  smsCount,
  contactsCount,
  callsCount,
  appsCount,
  carvedCount,
  logs,
  recentEvents,
  onNavigate,
  onStartAcquisition,
  onScanDevices,
  isScanningDevices,
  onLoadSampleCase,
  onResetDatabase,
  isSampleCaseLoaded,
}) => {
  const isConnected = device && device.serial !== "NO_DEVICE" && device.adbState === "CONNECTED";
  const isUnauthorized = device && device.adbState === "UNAUTHORIZED";

  const imagesCount = evidenceFiles.filter((f) => f.category === "Images").length;
  const databasesCount = evidenceFiles.filter((f) => f.category === "Databases").length;
  const docsCount = evidenceFiles.filter((f) => f.category === "Documents").length;

  const cards = [
    { label: "FILES IN VAULT", count: evidenceFiles.length, icon: FileText, tab: "EVIDENCE" as NavTab, color: "text-cyan-400" },
    { label: "IMAGES", count: imagesCount, icon: Image, tab: "MEDIA" as NavTab, color: "text-blue-400" },
    { label: "SQLITE DATABASES", count: databasesCount, icon: Database, tab: "SQLITE" as NavTab, color: "text-emerald-400" },
    { label: "DOCUMENTS", count: docsCount, icon: FileText, tab: "EVIDENCE" as NavTab, color: "text-slate-300" },
    { label: "SMS MESSAGES", count: smsCount, icon: MessageSquare, tab: "ARTIFACTS" as NavTab, color: "text-indigo-400" },
    { label: "CONTACTS", count: contactsCount, icon: Users, tab: "ARTIFACTS" as NavTab, color: "text-purple-400" },
    { label: "CALL LOGS", count: callsCount, icon: PhoneCall, tab: "ARTIFACTS" as NavTab, color: "text-pink-400" },
    { label: "APPLICATIONS", count: appsCount, icon: Layers, tab: "ARTIFACTS" as NavTab, color: "text-amber-400" },
    { label: "RECOVERED ARTIFACTS", count: carvedCount, icon: Sparkles, tab: "RECOVERY" as NavTab, color: "text-rose-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Sample Training Case Notice Banner if active */}
      {isSampleCaseLoaded && (
        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-500/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-200 text-xs font-mono-forensic shadow-[0_0_15px_rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold text-amber-300 uppercase tracking-wider">
                [LAB DEMONSTRATION DATASET LOADED]
              </span>
              <p className="text-[11px] text-amber-200/80 mt-0.5">
                Workstation is viewing sample evidence. When ready to extract an actual physical Android phone, click "Reset Vault to Clean State".
              </p>
            </div>
          </div>
          {onResetDatabase && (
            <button
              onClick={onResetDatabase}
              className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/60 text-amber-300 font-bold flex items-center gap-1.5 transition-colors text-xs whitespace-nowrap"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Reset Vault to Clean State
            </button>
          )}
        </div>
      )}

      {/* Hardware Connection Banner */}
      {isConnected ? (
        /* Real Device Connected State */
        <div className="p-5 rounded-xl bg-gradient-to-r from-[#0c121e] via-[#0f172a] to-[#0c121e] border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.15)] flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-cyan-950/80 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Smartphone className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_rgba(52,211,153,1)]" />
                <h2 className="text-lg font-bold text-white font-mono-forensic tracking-wide">
                  {device.manufacturer || "Android"} {device.model || "Device"}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono-forensic font-semibold">
                  ● ADB AUTHORIZED &amp; READY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono-forensic">
                Serial: <span className="text-slate-200 font-bold">{device.serial || "Unknown"}</span> | Android {device.androidVersion || "14"} (API {device.sdkVersion || "34"}) | Build: {device.buildFingerprint ? (device.buildFingerprint.split(":")[0] || device.buildFingerprint) : (device.buildNumber || "Release")}
              </p>
              <div className="flex items-center gap-3 mt-2 text-xs text-slate-300 font-mono-forensic flex-wrap">
                <span>Battery: <strong className="text-emerald-400">{device.batteryLevel ?? 85}%</strong></span>
                <span>•</span>
                <span>Root State: <strong className="text-cyan-300">{device.rootStatus || "SELINUX_ENFORCING"}</strong></span>
                <span>•</span>
                <span className="text-purple-300">Security: {device.storage?.encryptionType || device.encryptionType || "File-Based Encryption (FBE)"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {onScanDevices && (
              <button
                onClick={onScanDevices}
                disabled={isScanningDevices}
                className="px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs font-mono-forensic text-slate-300 flex items-center gap-1.5 transition-colors"
                title="Refresh connected devices"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanningDevices ? "animate-spin text-cyan-400" : ""}`} />
                <span>Rescan</span>
              </button>
            )}

            <button
              onClick={onStartAcquisition}
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold font-mono-forensic text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
            >
              <DownloadCloud className="w-4 h-4 text-slate-950" />
              <span>Start Real Acquisition</span>
            </button>
          </div>
        </div>
      ) : isUnauthorized ? (
        /* Device plugged in but unauthorized on phone screen */
        <div className="p-5 rounded-xl bg-amber-950/30 border border-amber-500/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-950/80 border border-amber-500/50 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-amber-300 font-mono-forensic">
                  Target Device Detected (Serial: {device.serial}) - UNAUTHORIZED
                </h2>
              </div>
              <p className="text-xs text-amber-200/90 mt-1 font-mono-forensic">
                Unlock phone display and tap "Allow USB debugging" (check "Always allow from this computer").
              </p>
            </div>
          </div>
          {onScanDevices && (
            <button
              onClick={onScanDevices}
              className="px-4 py-2 rounded-lg bg-amber-500/20 border border-amber-500/60 text-amber-300 font-bold text-xs font-mono-forensic flex items-center gap-2"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanningDevices ? "animate-spin" : ""}`} />
              Verify Authorization
            </button>
          )}
        </div>
      ) : (
        /* Real Disconnected State: Clear instructions for physical phone connection */
        <div className="p-5 rounded-xl bg-[#090d16] border border-slate-800 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-400 shrink-0">
              <Usb className="w-8 h-8 text-cyan-400/70" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
                <h2 className="text-base font-bold text-white font-mono-forensic">
                  NO PHYSICAL ANDROID TARGET CONNECTED
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 font-mono-forensic uppercase">
                  WAITING FOR USB / ADB
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-mono-forensic">
                To examine an actual physical Android phone:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 mt-2 text-[11px] text-slate-300 font-mono-forensic">
                <div>1. Connect target Android phone via USB cable</div>
                <div>2. Settings &gt; Developer Options &gt; Turn ON <strong>USB Debugging</strong></div>
                <div>3. Accept RSA Fingerprint prompt on phone screen</div>
                <div>4. Linux: Ensure udev rules are installed (<code className="text-cyan-300">./scripts/install-linux.sh</code>)</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {onScanDevices && (
              <button
                onClick={onScanDevices}
                disabled={isScanningDevices}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-lg bg-cyan-950/70 hover:bg-cyan-900/60 border border-cyan-500/50 text-cyan-300 font-bold font-mono-forensic text-xs flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanningDevices ? "animate-spin" : ""}`} />
                <span>{isScanningDevices ? "Scanning USB..." : "Scan for Connected Phone"}</span>
              </button>
            )}

            {onLoadSampleCase && !isSampleCaseLoaded && (
              <button
                onClick={onLoadSampleCase}
                className="flex-1 sm:flex-none px-3.5 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-mono-forensic flex items-center justify-center gap-1.5 transition-colors"
                title="Load sample demonstration investigation without physical device"
              >
                <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
                <span>Load Sample Lab Case</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Evidence Category Cards */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-mono-forensic font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Active Evidence Vault Artifacts
          </h3>
          <span className="text-[11px] text-slate-500 font-mono-forensic">
            {evidenceFiles.length === 0 ? "Evidence vault is empty (awaiting acquisition or import)" : "Click category to inspect records"}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.label}
                onClick={() => onNavigate(c.tab)}
                className="p-4 rounded-lg bg-[#0c121e]/80 border border-slate-800 hover:border-cyan-500/40 hover:bg-[#0f172a] transition-all text-left group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-5 h-5 ${c.color}`} />
                  <ArrowRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
                </div>
                <div className="text-2xl font-bold font-mono-forensic text-white group-hover:text-cyan-300">
                  {c.count}
                </div>
                <div className="text-[11px] text-slate-400 font-mono-forensic uppercase tracking-wider mt-0.5">
                  {c.label}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column Section: Live Acquisition Logs & Recent Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Live Acquisition Log */}
        <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono-forensic font-bold uppercase tracking-wider text-cyan-400">
                <Activity className="w-4 h-4" />
                ADB Hardware Command Session Log
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50 font-mono-forensic">
                {logs.length} LOGS RECORDED
              </span>
            </div>

            <div className="mt-3 space-y-2 font-mono-forensic text-xs max-h-64 overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-mono-forensic">
                  No ADB command executions logged yet. Connect device and run inspection commands.
                </div>
              ) : (
                logs.map((log) => (
                  <div key={log.id} className="p-2 rounded bg-slate-950/60 border border-slate-900 flex flex-col gap-0.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">
                        [{log.timestamp ? log.timestamp.slice(11, 19) : "--:--:--"}]
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          log.result === "SUCCESS" ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {log.result}
                      </span>
                    </div>
                    <div className="text-cyan-300 font-medium">{log.command}</div>
                    {log.outputSnippet && (
                      <div className="text-[11px] text-slate-400 truncate">
                        {log.outputSnippet}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate("DEVICES")}
            className="mt-3 w-full py-2 text-center text-xs font-mono-forensic text-slate-400 hover:text-cyan-300 border-t border-slate-800/80 transition-colors"
          >
            Open ADB Device Manager Console →
          </button>
        </div>

        {/* Recent Timeline Correlated Events */}
        <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800/90 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-mono-forensic font-bold uppercase tracking-wider text-purple-400">
                <HardDrive className="w-4 h-4" />
                Evidence Timeline Feed
              </div>
              <button
                onClick={() => onNavigate("TIMELINE")}
                className="text-[10px] text-cyan-400 hover:underline font-mono-forensic"
              >
                View Full Timeline ({recentEvents.length})
              </button>
            </div>

            <div className="mt-3 space-y-2 font-mono-forensic text-xs max-h-64 overflow-y-auto pr-1">
              {recentEvents.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs font-mono-forensic">
                  No chronological events in evidence store yet. Acquire target or import artifacts to populate.
                </div>
              ) : (
                recentEvents.slice(0, 5).map((evt) => (
                  <div key={evt.id} className="p-2 rounded bg-slate-950/60 border border-slate-900">
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>{evt.dateTime.replace("T", " ").replace("Z", "")}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px] font-bold uppercase">
                        {evt.type}
                      </span>
                    </div>
                    <div className="text-slate-200 mt-1 text-xs">{evt.eventDescription}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">Source: {evt.source}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <button
            onClick={() => onNavigate("TIMELINE")}
            className="mt-3 w-full py-2 text-center text-xs font-mono-forensic text-slate-400 hover:text-purple-300 border-t border-slate-800/80 transition-colors"
          >
            Open Chronological Event Visualizer →
          </button>
        </div>
      </div>
    </div>
  );
};
