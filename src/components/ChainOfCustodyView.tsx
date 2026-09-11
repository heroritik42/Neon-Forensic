import React, { useState } from "react";
import {
  Link2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Download,
  Lock,
  FileCheck,
} from "lucide-react";
import { ChainOfCustodyRecord, ForensicCase } from "../types/forensics";
import { verifyAuditChain, computeSha256 } from "../utils/crypto";

interface ChainOfCustodyViewProps {
  currentCase: ForensicCase;
  records: ChainOfCustodyRecord[];
  onAddRecord: (record: ChainOfCustodyRecord) => void;
}

export const ChainOfCustodyView: React.FC<ChainOfCustodyViewProps> = ({
  currentCase,
  records,
  onAddRecord,
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    isValid: boolean;
    brokenAtIndex?: number;
  } | null>(null);

  const [newAction, setNewAction] = useState("");
  const [newEvidenceId, setNewEvidenceId] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const handleVerify = async () => {
    setIsVerifying(true);
    const res = await verifyAuditChain(records);
    setVerificationResult(res);
    setIsVerifying(false);
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAction.trim()) return;

    const prevHash = records.length > 0
      ? records[records.length - 1].currentEventHash
      : "GENESIS_ROOT_HASH_000000000000000000000000000000000000000000000000";

    const timestamp = new Date().toISOString();
    const payload = `${prevHash}-${timestamp}-${currentCase.investigator}-${newAction}-${newEvidenceId}`;
    const currentHash = await computeSha256(payload);

    const record: ChainOfCustodyRecord = {
      id: `COC-${(records.length + 1).toString().padStart(2, "0")}`,
      timestamp,
      investigator: currentCase.investigator,
      action: newAction.trim(),
      evidenceId: newEvidenceId.trim() || currentCase.id,
      previousEventHash: prevHash,
      currentEventHash: currentHash,
      verificationStatus: "VERIFIED",
    };

    onAddRecord(record);
    setNewAction("");
    setNewEvidenceId("");
    setIsAdding(false);
    setVerificationResult(null);
  };

  const handleExportJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(records, null, 2));
    const link = document.createElement("a");
    link.href = dataStr;
    link.download = `chain_of_custody_${currentCase.id}.json`;
    link.click();
  };

  return (
    <div className="space-y-6 font-mono-forensic text-xs">
      {/* Top Banner: Verification & Actions */}
      <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/60 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
            <Link2 className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white tracking-wide">
                Cryptographic Chain of Custody
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                MERKLE-LINKED IMMUTABLE LEDGER
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Every forensic action is cryptographically bound to previous block hashes, guaranteeing non-repudiation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleVerify}
            disabled={isVerifying}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isVerifying ? "Verifying Hashes..." : "Verify Chain Integrity"}</span>
          </button>

          <button
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:border-cyan-500/50 transition-colors text-xs"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Log Examiner Event</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs"
            title="Export Ledger as JSON"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Verification Result Banner */}
      {verificationResult && (
        <div
          className={`p-4 rounded-xl border flex items-center justify-between text-xs ${
            verificationResult.isValid
              ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              : "bg-rose-950/40 border-rose-500/50 text-rose-300"
          }`}
        >
          <div className="flex items-center gap-3">
            {verificationResult.isValid ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <div>
              <div className="font-bold text-sm">
                {verificationResult.isValid
                  ? "CHAIN OF CUSTODY INTEGRITY VERIFIED (0 DISCREPANCIES)"
                  : `INTEGRITY BREACH DETECTED AT BLOCK #${verificationResult.brokenAtIndex}`}
              </div>
              <p className="text-[11px] mt-0.5 opacity-90">
                {verificationResult.isValid
                  ? "All SHA-256 inter-event hash links match sequentially. No tampering or chronological alterations detected."
                  : "Hash mismatch detected. Previous event hash does not match mathematical predecessor."}
              </p>
            </div>
          </div>
          <span className="text-[10px] uppercase font-bold px-2 py-1 rounded bg-slate-950 border border-slate-800">
            {verificationResult.isValid ? "COURT ADMISSIBLE" : "FLAGGED UNSECURE"}
          </span>
        </div>
      )}

      {/* Manual Entry Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateRecord}
          className="p-4 rounded-xl bg-[#090d16] border border-cyan-500/40 space-y-3"
        >
          <div className="text-white font-bold text-xs flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            Record Custody Transfer or Examiner Action
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 uppercase block mb-1">
                Action Description:
              </label>
              <input
                type="text"
                placeholder="e.g. Transferred working copy to court master vault"
                value={newAction}
                onChange={(e) => setNewAction(e.target.value)}
                required
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 uppercase block mb-1">
                Affected Evidence ID / Hash:
              </label>
              <input
                type="text"
                placeholder="e.g. EVIDENCE-CONTAINER-01"
                value={newEvidenceId}
                onChange={(e) => setNewEvidenceId(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 text-xs focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded bg-slate-900 text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold uppercase tracking-wider text-xs"
            >
              Commit to Immutable Log
            </button>
          </div>
        </form>
      )}

      {/* Custody Event Chain Stream */}
      <div className="rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between text-slate-400 font-bold">
          <span>Audit Log Entries ({records.length} blocks)</span>
          <span className="text-[10px] text-slate-500">Cryptographically Chained Sequence</span>
        </div>

        <div className="divide-y divide-slate-850 max-h-[580px] overflow-y-auto">
          {records.map((rec, index) => (
            <div key={rec.id} className="p-4 hover:bg-slate-900/30 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800 font-bold">
                    Block #{index + 1} ({rec.id})
                  </span>
                  <span className="text-white font-semibold">{rec.action}</span>
                </div>
                <div className="text-slate-400">
                  {rec.timestamp.replace("T", " ").replace("Z", " UTC")}
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Examiner: <span className="text-slate-200">{rec.investigator}</span></span>
                <span>Evidence Ref: <span className="text-purple-300">{rec.evidenceId}</span></span>
              </div>

              {/* Merkle-Style Hashes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] pt-1">
                <div className="bg-slate-950 p-2 rounded border border-slate-900">
                  <span className="text-slate-500 uppercase block mb-0.5">Previous Event Hash:</span>
                  <div className="text-slate-400 truncate select-all">{rec.previousEventHash}</div>
                </div>
                <div className="bg-slate-950 p-2 rounded border border-slate-900">
                  <span className="text-emerald-400 font-bold uppercase block mb-0.5">Current Block Hash:</span>
                  <div className="text-cyan-300 truncate select-all">{rec.currentEventHash}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
