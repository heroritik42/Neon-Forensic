import React, { useState } from "react";
import {
  DownloadCloud,
  CheckCircle2,
  AlertTriangle,
  Zap,
  HardDrive,
  Shield,
  FileCheck,
  Upload,
  RefreshCw,
  FolderOpen,
} from "lucide-react";
import { AcquisitionProfile, ForensicCase, AndroidDevice } from "../types/forensics";

interface AcquisitionViewProps {
  currentCase: ForensicCase;
  device: AndroidDevice;
  onExecuteAcquisition: (profile: AcquisitionProfile) => void;
  isAcquiring: boolean;
  acquisitionProgress: number;
  acquisitionStep: string;
  onImportBackupFile: (files: FileList) => void;
}

export const AcquisitionView: React.FC<AcquisitionViewProps> = ({
  currentCase,
  device,
  onExecuteAcquisition,
  isAcquiring,
  acquisitionProgress,
  acquisitionStep,
  onImportBackupFile,
}) => {
  const [selectedProfile, setSelectedProfile] = useState<AcquisitionProfile>("STANDARD");
  const [confirmedAuth, setConfirmedAuth] = useState(true);

  const profiles: Array<{
    id: AcquisitionProfile;
    name: string;
    icon: React.ElementType;
    badge: string;
    timeEst: string;
    description: string;
    items: string[];
  }> = [
    {
      id: "QUICK",
      name: "Quick Acquisition",
      icon: Zap,
      badge: "Fast Triage (~3-5 min)",
      timeEst: "3m 40s",
      description: "Collects high-priority communication logs, shared storage media, and system metadata.",
      items: [
        "Device Metadata & Build Properties",
        "Contacts (contacts2.db)",
        "SMS & MMS (mmssms.db)",
        "Call History & Telephony metadata",
        "DCIM, Screenshots & Pictures",
        "Downloads & Documents folder",
        "Public Application package list",
        "System bugreport / dumpsys state",
      ],
    },
    {
      id: "STANDARD",
      name: "Standard Acquisition",
      icon: HardDrive,
      badge: "Recommended Standard (~12-18 min)",
      timeEst: "14m 10s",
      description: "Comprehensive forensic examination collecting all accessible user artifacts, browsers, and app metadata.",
      items: [
        "All Quick Acquisition targets",
        "Complete Application Inventory & APK manifests",
        "Chrome / Default Browser History & Search terms",
        "Android Logcat & Diagnostic system events",
        "Wi-Fi networks & Bluetooth pairing logs",
        "Notification history exports where authorized",
        "Accessible SQLite databases with WAL journals",
        "Pristine SHA-256 manifest generation",
      ],
    },
    {
      id: "DEEP",
      name: "Deep Authorized Acquisition",
      icon: Shield,
      badge: "Exhaustive Evidence (~35-60 min)",
      timeEst: "42m 00s",
      description: "Exhaustively queries all legally accessible ADB transports, Android backup agents, and shared volume clusters.",
      items: [
        "All Standard Acquisition targets",
        "Full shared storage raw cluster indexing",
        "Android ADB Backup agent extraction (.ab)",
        "Static APK security disassembly & signature hashes",
        "Unallocated space carving scan for residual files",
        "Full filesystem ls -laR metadata cataloging",
        "Cryptographic double-hash (SHA-256 + SHA-512)",
      ],
    },
  ];

  const handleStart = () => {
    if (!confirmedAuth) return;
    onExecuteAcquisition(selectedProfile);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onImportBackupFile(e.dataTransfer.files);
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Case Confirmation Banner */}
      <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-base font-bold text-white font-mono-forensic flex items-center gap-2">
              <DownloadCloud className="w-5 h-5 text-cyan-400" />
              Evidence Acquisition Engine
            </h2>
            <p className="text-xs text-slate-400 font-mono-forensic mt-1">
              Select an authorized forensic profile. Original device memory is read without modification.
            </p>
          </div>

          <div className="text-xs font-mono-forensic text-right">
            <span className="text-slate-500">Target Device: </span>
            <span className="text-cyan-300 font-bold">{device.manufacturer} {device.model}</span>
            <div className="text-[11px] text-slate-400">Target Case: {currentCase.id}</div>
          </div>
        </div>

        {/* Section 4: Mandatory Authorization Confirmation Checkpoint */}
        <div className="mt-4 p-4 rounded-lg bg-cyan-950/30 border border-cyan-500/30 flex items-start gap-3">
          <input
            type="checkbox"
            id="authConfirmation"
            checked={confirmedAuth}
            onChange={(e) => setConfirmedAuth(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-500 focus:ring-offset-0"
          />
          <label htmlFor="authConfirmation" className="text-xs font-mono-forensic leading-relaxed text-slate-200 cursor-pointer">
            <span className="font-bold text-cyan-300">
              Authorization confirmed for this device?
            </span>{" "}
            I certify under penalty of perjury that I am authorized to acquire, preserve, and examine digital evidence from this Android device under case #{currentCase.id}.
            All acquisitions are non-destructive and maintain court-admissible chain of custody.
          </label>
        </div>
      </div>

      {/* Profile Selection Grid (Section 8) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {profiles.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedProfile === p.id;
          return (
            <div
              key={p.id}
              onClick={() => !isAcquiring && setSelectedProfile(p.id)}
              className={`p-5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? "bg-[#0f172a] border-cyan-500 shadow-[0_0_20px_rgba(6,182,212,0.2)]"
                  : "bg-[#090d16] border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${isSelected ? "bg-cyan-500/20 text-cyan-400" : "bg-slate-900 text-slate-400"}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono-forensic px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    {p.timeEst}
                  </span>
                </div>

                <h3 className="font-bold font-mono-forensic text-sm text-white mb-1">
                  {p.name}
                </h3>
                <div className="text-[11px] text-cyan-400 font-mono-forensic mb-2">
                  {p.badge}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">
                  {p.description}
                </p>

                <div className="space-y-1.5 border-t border-slate-800/80 pt-3">
                  <div className="text-[10px] font-bold font-mono-forensic uppercase text-slate-500 mb-1">
                    Acquisition Scope:
                  </div>
                  {p.items.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-300 font-mono-forensic">
                      <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
                      <span className="text-[11px]">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[11px] font-mono-forensic text-slate-500">
                  {isSelected ? "● PROFILE SELECTED" : "Click to select"}
                </span>
                <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? "border-cyan-400 bg-cyan-400" : "border-slate-700"}`}>
                  {isSelected && <div className="w-2 h-2 rounded-full bg-slate-950" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Active Acquisition Progress & Action */}
      <div className="p-5 rounded-xl bg-[#090d16] border border-slate-800 space-y-4">
        {isAcquiring ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between font-mono-forensic text-xs">
              <span className="text-cyan-400 font-bold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                ACQUIRING EVIDENCE: {selectedProfile} PROFILE
              </span>
              <span className="text-white font-bold">{acquisitionProgress}%</span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300 shadow-[0_0_12px_rgba(6,182,212,0.6)]"
                style={{ width: `${acquisitionProgress}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs font-mono-forensic text-slate-400">
              <span>Active Operation: <span className="text-slate-200">{acquisitionStep}</span></span>
              <span className="text-emerald-400 font-semibold">Rate: 38.4 MB/s (USB 3.2 Gen 1)</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs font-mono-forensic text-slate-400">
              Selected Profile: <span className="text-white font-bold">{selectedProfile}</span>. Ready to ingest device evidence into case directory.
            </div>
            <button
              onClick={handleStart}
              disabled={!confirmedAuth || device.adbState !== "CONNECTED"}
              className={`w-full sm:w-auto px-6 py-3 rounded-lg font-bold font-mono-forensic text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                confirmedAuth && device.adbState === "CONNECTED"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
              }`}
            >
              <DownloadCloud className="w-4 h-4" />
              <span>Start {selectedProfile} Acquisition</span>
            </button>
          </div>
        )}
      </div>

      {/* External Backup / Forensic Image Import (Section 1) */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="p-6 rounded-xl border-2 border-dashed border-slate-800 hover:border-cyan-500/50 bg-[#090d16]/60 transition-colors text-center font-mono-forensic text-xs"
      >
        <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
        <div className="text-slate-200 font-bold mb-1">
          Import Local Android Backup, TAR, or Raw Forensic Image
        </div>
        <p className="text-slate-400 max-w-lg mx-auto text-[11px] mb-3">
          Drag and drop Android backup files (.ab), compressed archives (.tar, .tar.gz, .zip), or raw flash images into this case.
        </p>
        <label className="inline-flex items-center gap-2 px-4 py-2 rounded bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-cyan-300 cursor-pointer transition-colors text-xs font-semibold">
          <FolderOpen className="w-4 h-4" />
          Browse Forensic Files
          <input
            type="file"
            multiple
            className="hidden"
            onChange={(e) => e.target.files && onImportBackupFile(e.target.files)}
          />
        </label>
      </div>
    </div>
  );
};
