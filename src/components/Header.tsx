import React from "react";
import {
  ShieldCheck,
  Smartphone,
  Terminal,
  Brain,
  AlertTriangle,
  FolderLock,
  RefreshCw,
  Fingerprint,
  Download,
} from "lucide-react";
import { ForensicCase, AndroidDevice } from "../types/forensics";

interface HeaderProps {
  currentCase: ForensicCase;
  device: AndroidDevice;
  onOpenCaseModal: () => void;
  onOpenCli: () => void;
  onOpenAi: () => void;
  onOpenLimitations: () => void;
  onOpenLinuxDownload: () => void;
  onVerifyIntegrity: () => void;
  isVerifying: boolean;
  integrityStatus: "VERIFIED" | "TAMPERED" | "UNCHECKED";
}

export const Header: React.FC<HeaderProps> = ({
  currentCase,
  device,
  onOpenCaseModal,
  onOpenCli,
  onOpenAi,
  onOpenLimitations,
  onOpenLinuxDownload,
  onVerifyIntegrity,
  isVerifying,
  integrityStatus,
}) => {
  return (
    <header className="border-b border-cyan-500/20 bg-[#090d16]/90 backdrop-blur-md sticky top-0 z-30 px-4 py-2.5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Tagline */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 via-purple-500/20 to-blue-500/30 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Fingerprint className="w-6 h-6 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-wider text-white font-mono-forensic neon-glow-cyan">
                NEON<span className="text-cyan-400">FORENSIC</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                v3.4.0 PRO
              </span>
            </div>
            <p className="text-xs text-slate-400 tracking-tight">
              Authorized Android Evidence Acquisition &amp; Analysis Platform
            </p>
          </div>
        </div>

        {/* Case & Device Quick Status */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Active Case Badge */}
          <button
            onClick={onOpenCaseModal}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/80 border border-slate-700/60 hover:border-cyan-500/50 transition-colors text-left"
            title="Click to view/edit Case metadata and authorization"
          >
            <FolderLock className="w-4 h-4 text-purple-400 shrink-0" />
            <div className="text-xs leading-tight">
              <div className="text-[10px] text-slate-400 uppercase font-mono-forensic">
                Active Case: {currentCase.id}
              </div>
              <div className="text-slate-200 font-medium truncate max-w-[170px]">
                {currentCase.name}
              </div>
            </div>
          </button>

          {/* Device State Badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-900/80 border border-slate-700/60 text-xs">
            <Smartphone className="w-4 h-4 text-cyan-400 shrink-0" />
            <div className="leading-tight">
              <div className="flex items-center gap-1.5 text-[10px] font-mono-forensic">
                <span
                  className={`w-2 h-2 rounded-full ${
                    device.adbState === "CONNECTED"
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)] animate-pulse"
                      : "bg-amber-400"
                  }`}
                />
                <span className="text-slate-300 font-semibold">
                  {device.adbState}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-cyan-300">{device.manufacturer}</span>
              </div>
              <div className="text-slate-300 truncate max-w-[160px] text-[11px]">
                {device.model} ({device.androidVersion.split(" ")[0]})
              </div>
            </div>
          </div>

          {/* Quick Integrity Check Button */}
          <button
            onClick={onVerifyIntegrity}
            disabled={isVerifying}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono-forensic font-semibold transition-all border ${
              integrityStatus === "VERIFIED"
                ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]"
                : integrityStatus === "TAMPERED"
                ? "bg-rose-950/50 border-rose-500/60 text-rose-300 hover:bg-rose-900/40"
                : "bg-slate-900/80 border-slate-700/60 text-slate-300 hover:border-emerald-500/40"
            }`}
            title="Recalculate cryptographic SHA-256 hashes against evidence manifest"
          >
            {isVerifying ? (
              <RefreshCw className="w-3.5 h-3.5 text-emerald-400 animate-spin" />
            ) : (
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            )}
            <span>
              {isVerifying
                ? "HASHING..."
                : integrityStatus === "VERIFIED"
                ? "INTEGRITY OK"
                : "VERIFY INTEGRITY"}
            </span>
          </button>

          {/* Action Tools: AI, Terminal, Limitations */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-800">
            <button
              onClick={onOpenAi}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-purple-950/40 border border-purple-500/40 text-purple-300 hover:bg-purple-900/40 text-xs font-mono-forensic transition-all shadow-[0_0_12px_rgba(168,85,247,0.2)]"
              title="Open Gemini 3.1 Pro High-Thinking Forensic Intelligence Engine"
            >
              <Brain className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden sm:inline">AI COPILOT</span>
            </button>

            <button
              onClick={onOpenCli}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded bg-slate-900/90 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-950/50 text-xs font-mono-forensic transition-all"
              title="Launch Neon Forensic Interactive CLI Terminal"
            >
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">CLI</span>
            </button>

            <button
              onClick={onOpenLinuxDownload}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/40 text-xs font-mono-forensic transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
              title="Download NEON FORENSIC for Linux (Desktop / Script / Docker)"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">LINUX</span>
            </button>

            <button
              onClick={onOpenLimitations}
              className="p-1.5 rounded bg-slate-900/80 border border-slate-700/60 text-amber-400 hover:text-amber-300 hover:border-amber-500/40 transition-colors"
              title="Permanent Forensic Limitations & Sandboxing Disclosure"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
