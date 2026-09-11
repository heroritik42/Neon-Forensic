import React, { useState, useEffect } from "react";
import { FolderLock, X, ShieldCheck, CheckCircle2, Trash2, FolderOpen, AlertTriangle } from "lucide-react";
import { ForensicCase } from "../types/forensics";

interface CaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCase: ForensicCase;
  onUpdateCase: (updated: ForensicCase) => void;
  onResetDatabase?: () => void;
  onLoadSampleCase?: () => void;
  isSampleCaseLoaded?: boolean;
}

export const CaseModal: React.FC<CaseModalProps> = ({
  isOpen,
  onClose,
  currentCase,
  onUpdateCase,
  onResetDatabase,
  onLoadSampleCase,
  isSampleCaseLoaded,
}) => {
  const [formData, setFormData] = useState<ForensicCase>({ ...currentCase });

  useEffect(() => {
    setFormData({ ...currentCase });
  }, [currentCase]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCase(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono-forensic text-xs">
      <div className="w-full max-w-2xl bg-[#090d16] border border-cyan-500/50 rounded-xl overflow-hidden shadow-[0_0_30px_rgba(6,182,212,0.2)]">
        <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-cyan-400 font-bold">
            <FolderLock className="w-4 h-4" />
            <span>CASE &amp; AUTHORIZATION DOSSIER</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] text-slate-500 uppercase block mb-1">
                Case Identifier:
              </label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase block mb-1">
                Operation / Case Name:
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase block mb-1">
                Lead Investigator (Badge / ID):
              </label>
              <input
                type="text"
                value={formData.investigator}
                onChange={(e) => setFormData({ ...formData, investigator: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase block mb-1">
                Agency / Forensic Unit:
              </label>
              <input
                type="text"
                value={formData.organization}
                onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase block mb-1">
                Authorization Status:
              </label>
              <select
                value={formData.authorizationStatus}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    authorizationStatus: e.target.value as ForensicCase["authorizationStatus"],
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-cyan-300"
              >
                <option value="AUTHORIZED">AUTHORIZED (Warrant/Consent on File)</option>
                <option value="EXPLICIT_CONSENT">EXPLICIT OWNER CONSENT</option>
                <option value="LAB_INTERNAL">LAB INTERNAL INCIDENT</option>
                <option value="PENDING_VERIFICATION">PENDING VERIFICATION</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] text-slate-500 uppercase block mb-1">
                Evidence Hash Standard:
              </label>
              <select
                value={formData.hashAlgorithm}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    hashAlgorithm: e.target.value as "SHA-256" | "SHA-512" | "DOUBLE_SHA256",
                  })
                }
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200"
              >
                <option value="SHA-256">SHA-256 (NIST Standard)</option>
                <option value="SHA-512">SHA-512 (High Security)</option>
                <option value="DOUBLE_SHA256">DOUBLE SHA-256 (SHA-256 + SHA-512)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-[10px] text-slate-500 uppercase block mb-1">
              Legal Authorization &amp; Warrant Citation Notes:
            </label>
            <textarea
              rows={3}
              value={formData.authorizationNotes}
              onChange={(e) => setFormData({ ...formData, authorizationNotes: e.target.value })}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded text-slate-200 text-[11px]"
            />
          </div>

          {/* Database Control Section */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-slate-400 font-bold uppercase text-[10px] block">
                Database Vault State:
              </span>
              <span className="text-[11px] text-slate-500">
                {isSampleCaseLoaded ? "Demonstration case loaded." : "Clean production database active."}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {onLoadSampleCase && !isSampleCaseLoaded && (
                <button
                  type="button"
                  onClick={() => {
                    onLoadSampleCase();
                    onClose();
                  }}
                  className="px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs flex items-center gap-1.5"
                >
                  <FolderOpen className="w-3.5 h-3.5 text-purple-400" />
                  Load Sample Lab Case
                </button>
              )}

              {onResetDatabase && (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm("Reset the evidence vault and clear all records in the SQLite database?")) {
                      onResetDatabase();
                      onClose();
                    }
                  }}
                  className="px-3 py-1.5 rounded bg-rose-950/40 hover:bg-rose-900/50 border border-rose-500/50 text-rose-300 text-xs flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                  Reset Vault
                </button>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded bg-slate-900 text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold uppercase tracking-wider"
            >
              Save Case Metadata
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
