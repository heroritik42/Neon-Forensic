import React, { useState } from "react";
import {
  Sparkles,
  Search,
  AlertTriangle,
  FileCheck,
  CheckCircle2,
  RefreshCw,
  Info,
  ShieldAlert,
  Download,
} from "lucide-react";
import { CarvedFileArtifact } from "../types/forensics";

interface NeonRecoverViewProps {
  carvedFiles: CarvedFileArtifact[];
  onTriggerCarveScan: () => void;
  isScanning: boolean;
}

export const NeonRecoverView: React.FC<NeonRecoverViewProps> = ({
  carvedFiles,
  onTriggerCarveScan,
  isScanning,
}) => {
  const [selectedFile, setSelectedFile] = useState<CarvedFileArtifact | null>(
    carvedFiles[0] || null
  );

  return (
    <div className="space-y-6 font-mono-forensic text-xs">
      {/* Header & Truth In Forensics Banner */}
      <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-purple-950/60 border border-purple-500/40 flex items-center justify-center text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
              <Sparkles className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-wide">
                  NEON RECOVER: File Carving Engine
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800 font-bold">
                  RESIDUAL HEURISTICS
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Recovers residual data from unallocated space, cache fragments, and application temp folders.
              </p>
            </div>
          </div>

          <button
            onClick={onTriggerCarveScan}
            disabled={isScanning}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(168,85,247,0.4)]"
          >
            {isScanning ? (
              <RefreshCw className="w-4 h-4 animate-spin text-purple-200" />
            ) : (
              <Search className="w-4 h-4 text-purple-200" />
            )}
            <span>{isScanning ? "Carving Raw Sectors..." : "Scan Unallocated Space"}</span>
          </button>
        </div>

        {/* Section 21: Android Flash & FBE Storage Reality Disclosure */}
        <div className="p-4 rounded-lg bg-[#080d16] border border-amber-500/40 flex items-start gap-3 text-slate-300">
          <Info className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-[11px] leading-relaxed">
            <div className="font-bold text-amber-300 uppercase">
              Scientific Notice: Modern Android Flash &amp; Encryption Reality
            </div>
            <p>
              On modern Android devices (Android 10+ with File-Based Encryption and UFS storage), deleted file recovery is strictly limited by:
            </p>
            <ul className="list-disc pl-4 space-y-0.5 text-slate-400 mt-1">
              <li>
                <strong className="text-slate-200">Hardware TRIM / Discard:</strong> The Android kernel automatically issues blkdiscard / fstrim commands to flash controller chips, zeroing deleted unallocated sectors.
              </li>
              <li>
                <strong className="text-slate-200">Per-File Encryption (FBE):</strong> When a file is removed from ext4/f2fs, its cryptographic ephemeral inode key is discarded from memory, turning the underlying raw sectors into cryptographically undecryptable high-entropy bytes.
              </li>
            </ul>
            <p className="text-slate-400 mt-1">
              NEON RECOVER carves residual media from unallocated shared storage, WAL database rollback journals, thumbnail caches, and temporary export queues.
            </p>
          </div>
        </div>
      </div>

      {/* Carved Files Grid + Detailed Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Carved Items (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between text-slate-400 font-bold">
            <span>Carved Residual Artifacts ({carvedFiles.length})</span>
            <span className="text-[10px] text-slate-500">Magic Bytes Verified</span>
          </div>

          <div className="divide-y divide-slate-850 max-h-[480px] overflow-y-auto">
            {carvedFiles.map((file) => {
              const isSelected = selectedFile?.id === file.id;
              return (
                <div
                  key={file.id}
                  onClick={() => setSelectedFile(file)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                    isSelected
                      ? "bg-purple-950/40 border-l-2 border-purple-400"
                      : "hover:bg-slate-900/40"
                  }`}
                >
                  <div>
                    <div className="text-white font-bold flex items-center gap-2">
                      <span className="text-purple-400">{file.fileType}</span>
                      <span>{file.signatureMatch}</span>
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Offset: <span className="text-cyan-400">{file.offset}</span> (decimal {file.offsetDec.toLocaleString()})
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 truncate max-w-sm">
                      SHA: {file.sha256}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        file.status === "RECOVERED"
                          ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                          : file.status === "PARTIAL"
                          ? "bg-amber-950 text-amber-300 border border-amber-800"
                          : "bg-rose-950 text-rose-300 border border-rose-800"
                      }`}
                    >
                      {file.status}
                    </span>
                    <div className="text-slate-400 text-[11px] mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Carved Artifact Details (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-[#090d16] border border-slate-800 p-4 space-y-4">
          {selectedFile ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-purple-400 font-bold uppercase tracking-wider">
                  <FileCheck className="w-4 h-4" />
                  Carved Structure Analysis
                </div>
                <span className="text-[10px] text-slate-500">{selectedFile.id}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px]">Format &amp; Magic Bytes:</span>
                  <div className="text-white font-bold">{selectedFile.signatureMatch}</div>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px]">Sector Cluster Offset:</span>
                  <div className="text-cyan-300 font-bold">{selectedFile.offset}</div>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px]">Structural Integrity:</span>
                  <div className="p-2 rounded bg-slate-950 border border-slate-900 text-slate-300 leading-relaxed text-[11px]">
                    {selectedFile.validationDetails}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px]">Recovery Assessment:</span>
                  <div className="text-slate-300 bg-purple-950/20 border border-purple-800/40 p-2 rounded text-[11px]">
                    {selectedFile.recoveryNote}
                  </div>
                </div>

                <div className="bg-slate-950 p-2.5 rounded border border-slate-900 space-y-1">
                  <span className="text-[10px] text-emerald-400 font-bold block">
                    Carved Payload SHA-256:
                  </span>
                  <div className="text-[10px] text-slate-300 break-all select-all">
                    {selectedFile.sha256}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="p-8 text-center text-slate-500">
              Select a carved artifact to view structural validation
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
