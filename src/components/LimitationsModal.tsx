import React from "react";
import { AlertTriangle, X, Shield, Lock, FileCode, CheckCircle2 } from "lucide-react";

interface LimitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LimitationsModal: React.FC<LimitationsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono-forensic text-xs">
      <div className="w-full max-w-2xl bg-[#090d16] border border-amber-500/50 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(245,158,11,0.2)]">
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <AlertTriangle className="w-4 h-4" />
            <span>FORENSIC PRINCIPLES &amp; PLATFORM LIMITATIONS</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[500px] overflow-y-auto text-slate-300 leading-relaxed text-xs">
          <div className="p-3 rounded bg-amber-950/40 border border-amber-500/40 text-amber-200">
            <strong>CRITICAL LEGAL &amp; TECHNICAL COMPLIANCE NOTICE:</strong>
            <p className="mt-1 text-[11px]">
              NEON FORENSIC is strictly designed for legitimate digital forensics, incident response, cybersecurity laboratories, and authorized examinations.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-white font-bold uppercase text-[11px] flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              1. Non-Bypass Security Commitments
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
              <li>Never bypasses Android lock screens, PINs, passwords, or biometrics.</li>
              <li>Never bypasses Factory Reset Protection (FRP).</li>
              <li>Never exploits vulnerabilities or installs persistent rootkits without authorization.</li>
              <li>Preserves all hardware security fuses and Knox warranty flags intact.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <div className="text-white font-bold uppercase text-[11px] flex items-center gap-2">
              <Shield className="w-4 h-4 text-purple-400" />
              2. Android Sandboxing &amp; Non-Root Extraction Boundaries
            </div>
            <p className="text-slate-400 text-[11px]">
              On non-rooted production devices with SELinux in Enforcing mode, application private data folders (<code>/data/data/&lt;package&gt;/</code>) are protected by Linux UID sandboxing. Unless an application explicitly declares <code>android:allowBackup="true"</code>, direct private database access is blocked by the Android security model.
            </p>
          </div>

          <div className="space-y-2">
            <div className="text-white font-bold uppercase text-[11px] flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              3. Modern Flash TRIM &amp; File-Based Encryption (FBE)
            </div>
            <p className="text-slate-400 text-[11px]">
              On Android 10+ devices with UFS storage and File-Based Encryption, deleted file recovery is limited. Kernel TRIM zeroing and instantaneous cryptographic erasure of deleted inode keys mean residual data carving yields fragments only from shared volumes, thumbnail databases, and unpurged rollback journals.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400">
            Every extraction in NEON FORENSIC explicitly categorizes each artifact state:
            <span className="text-cyan-400 font-bold ml-1">AVAILABLE, ACQUIRED, PARSED, RECOVERED, INACCESSIBLE, or ENCRYPTED</span>.
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold uppercase tracking-wider text-xs"
          >
            I Understand &amp; Acknowledge
          </button>
        </div>
      </div>
    </div>
  );
};
