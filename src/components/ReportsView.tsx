import React, { useState } from "react";
import {
  FileText,
  Download,
  Printer,
  CheckCircle2,
  FileCode,
  ShieldCheck,
  FolderArchive,
} from "lucide-react";
import {
  ForensicCase,
  AndroidDevice,
  EvidenceFile,
  ContactArtifact,
  SmsArtifact,
  CallLogArtifact,
  TimelineEvent,
  CarvedFileArtifact,
  ChainOfCustodyRecord,
} from "../types/forensics";

interface ReportsViewProps {
  currentCase: ForensicCase;
  device: AndroidDevice;
  evidenceFiles: EvidenceFile[];
  contacts: ContactArtifact[];
  sms: SmsArtifact[];
  calls: CallLogArtifact[];
  timeline: TimelineEvent[];
  carvedFiles: CarvedFileArtifact[];
  chainRecords: ChainOfCustodyRecord[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  currentCase,
  device,
  evidenceFiles,
  contacts,
  sms,
  calls,
  timeline,
  carvedFiles,
  chainRecords,
}) => {
  const [includeTimeline, setIncludeTimeline] = useState(true);
  const [includeHashes, setIncludeHashes] = useState(true);
  const [includeCustody, setIncludeCustody] = useState(true);
  const [includeCarved, setIncludeCarved] = useState(true);
  const [reportFormat, setReportFormat] = useState<"HTML" | "JSON" | "PRINT_PDF">("HTML");

  const handlePrintPdf = () => {
    window.print();
  };

  const handleExportJson = () => {
    const fullReport = {
      reportType: "NEON_FORENSIC_OFFICIAL_CASE_DOSSIER",
      generatedAt: new Date().toISOString(),
      generator: "NEON FORENSIC v3.4.0 PRO",
      case: currentCase,
      device,
      counts: {
        evidenceFiles: evidenceFiles.length,
        contacts: contacts.length,
        sms: sms.length,
        calls: calls.length,
        timelineEvents: timeline.length,
        carvedFiles: carvedFiles.length,
      },
      evidenceManifest: includeHashes ? evidenceFiles : undefined,
      timeline: includeTimeline ? timeline : undefined,
      chainOfCustody: includeCustody ? chainRecords : undefined,
      carvedArtifacts: includeCarved ? carvedFiles : undefined,
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullReport, null, 2));
    const link = document.createElement("a");
    link.href = dataStr;
    link.download = `NEON_FORENSIC_${currentCase.id}_DOSSIER.json`;
    link.click();
  };

  const handleExportHtml = () => {
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>NEON FORENSIC - Case ${currentCase.id}</title>
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace; background: #07090e; color: #e2e8f0; padding: 40px; }
  h1, h2, h3 { color: #38bdf8; font-family: monospace; }
  .box { background: #0f172a; border: 1px solid #1e293b; padding: 20px; border-radius: 8px; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
  th, td { border: 1px solid #334155; padding: 8px; text-align: left; }
  th { background: #1e293b; color: #38bdf8; }
  .badge { background: #0369a1; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; }
</style>
</head>
<body>
  <h1>NEON FORENSIC OFFICIAL CASE REPORT</h1>
  <p>Authorized Android Evidence Acquisition &amp; Analysis Platform</p>
  <div class="box">
    <h2>Case Identification</h2>
    <p><strong>Case ID:</strong> ${currentCase.id}</p>
    <p><strong>Case Title:</strong> ${currentCase.name}</p>
    <p><strong>Lead Investigator:</strong> ${currentCase.investigator}</p>
    <p><strong>Agency:</strong> ${currentCase.organization}</p>
    <p><strong>Authorization Status:</strong> ${currentCase.authorizationStatus} (${currentCase.authorizationConfirmedAt})</p>
  </div>

  <div class="box">
    <h2>Device Specifications</h2>
    <p><strong>Device:</strong> ${device.manufacturer} ${device.model} (${device.marketName})</p>
    <p><strong>Android Version:</strong> ${device.androidVersion} (SDK ${device.sdkVersion})</p>
    <p><strong>Serial Number:</strong> ${device.serial}</p>
    <p><strong>Security State:</strong> ${device.rootStatus} | ${device.storage.encryptionType}</p>
  </div>

  <div class="box">
    <h2>Evidence Files &amp; Cryptographic Manifest (${evidenceFiles.length} files)</h2>
    <table>
      <thead><tr><th>Filename</th><th>Size</th><th>SHA-256</th><th>Status</th></tr></thead>
      <tbody>
        ${evidenceFiles.map(f => `<tr><td>${f.filename}</td><td>${f.size}</td><td><code>${f.sha256}</code></td><td>${f.status}</td></tr>`).join("")}
      </tbody>
    </table>
  </div>

  <div class="box">
    <h2>Chain of Custody Immutable Ledger</h2>
    <table>
      <thead><tr><th>Timestamp</th><th>Action</th><th>Investigator</th><th>Current Hash</th></tr></thead>
      <tbody>
        ${chainRecords.map(r => `<tr><td>${r.timestamp}</td><td>${r.action}</td><td>${r.investigator}</td><td><code>${r.currentEventHash.slice(0, 20)}...</code></td></tr>`).join("")}
      </tbody>
    </table>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `NEON_FORENSIC_${currentCase.id}_REPORT.html`;
    link.click();
  };

  return (
    <div className="space-y-6 font-mono-forensic text-xs">
      {/* Top Banner */}
      <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-blue-950/60 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Forensic Reporting &amp; Evidence Export
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Generate court-admissible dossiers, HTML interactive audits, and JSON evidence packages.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportHtml}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          >
            <Download className="w-4 h-4" />
            <span>Generate HTML Dossier</span>
          </button>

          <button
            onClick={handleExportJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 text-xs transition-colors"
          >
            <FileCode className="w-4 h-4 text-purple-400" />
            <span>Export JSON Bundle</span>
          </button>

          <button
            onClick={handlePrintPdf}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 text-xs transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Print / Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Configuration Checklist */}
      <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-3">
        <div className="text-white font-bold text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          Report Inclusion Modules:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <label className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-850 cursor-pointer">
            <input
              type="checkbox"
              checked={includeHashes}
              onChange={(e) => setIncludeHashes(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
            />
            <span className="text-slate-200">SHA-256 Manifest ({evidenceFiles.length} files)</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-850 cursor-pointer">
            <input
              type="checkbox"
              checked={includeTimeline}
              onChange={(e) => setIncludeTimeline(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
            />
            <span className="text-slate-200">Timeline Events ({timeline.length})</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-850 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCustody}
              onChange={(e) => setIncludeCustody(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
            />
            <span className="text-slate-200">Chain of Custody Ledger</span>
          </label>

          <label className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-850 cursor-pointer">
            <input
              type="checkbox"
              checked={includeCarved}
              onChange={(e) => setIncludeCarved(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 bg-slate-900 border-slate-700"
            />
            <span className="text-slate-200">Carved Residual Artifacts</span>
          </label>
        </div>
      </div>

      {/* Live On-Screen Report Preview */}
      <div className="rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between text-slate-400 font-bold">
          <span>Official Case Dossier Preview</span>
          <span className="text-cyan-400">Standard Forensic Output Template</span>
        </div>

        <div className="p-6 space-y-6 max-h-[550px] overflow-y-auto">
          {/* Header Block */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-850 flex justify-between items-start">
            <div>
              <div className="text-xl font-bold text-white tracking-wider">NEON FORENSIC</div>
              <div className="text-cyan-400 text-xs mt-0.5">EXPERT DIGITAL FORENSICS EXAMINATION REPORT</div>
              <div className="text-slate-400 text-[11px] mt-2">
                Case ID: <span className="text-white font-bold">{currentCase.id}</span>
              </div>
              <div className="text-slate-400 text-[11px]">
                Operation: <span className="text-slate-200">{currentCase.name}</span>
              </div>
            </div>
            <div className="text-right text-[11px] text-slate-400 space-y-1">
              <div>Date: {new Date().toISOString().slice(0, 10)}</div>
              <div>Investigator: <span className="text-white">{currentCase.investigator}</span></div>
              <div className="text-emerald-400 font-bold">● {currentCase.authorizationStatus}</div>
            </div>
          </div>

          {/* Device Hardware Record */}
          <div className="space-y-2">
            <div className="text-cyan-400 font-bold uppercase text-[11px] border-b border-slate-800 pb-1">
              1. Target Hardware &amp; Acquisition Platform
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px]">
              <div className="bg-slate-950 p-2 rounded">
                <span className="text-slate-500 block">Device:</span>
                <span className="text-slate-200 font-bold">{device.manufacturer} {device.model}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded">
                <span className="text-slate-500 block">OS Version:</span>
                <span className="text-slate-200">{device.androidVersion}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded">
                <span className="text-slate-500 block">Hardware Serial:</span>
                <span className="text-slate-200">{device.serial}</span>
              </div>
              <div className="bg-slate-950 p-2 rounded">
                <span className="text-slate-500 block">Security Patch:</span>
                <span className="text-emerald-400">{device.securityPatch}</span>
              </div>
            </div>
          </div>

          {/* Evidence Manifest Table */}
          {includeHashes && (
            <div className="space-y-2">
              <div className="text-cyan-400 font-bold uppercase text-[11px] border-b border-slate-800 pb-1">
                2. Cryptographic Evidence Manifest (SHA-256)
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="p-2">Filename</th>
                      <th className="p-2">Category</th>
                      <th className="p-2">Size</th>
                      <th className="p-2">Status</th>
                      <th className="p-2">SHA-256 Digest</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850 text-slate-300">
                    {evidenceFiles.map((f) => (
                      <tr key={f.id}>
                        <td className="p-2 font-bold text-white">{f.filename}</td>
                        <td className="p-2">{f.category}</td>
                        <td className="p-2">{(f.size / 1024).toFixed(1)} KB</td>
                        <td className="p-2">
                          <span className="text-[10px] text-cyan-400">{f.status}</span>
                        </td>
                        <td className="p-2 font-mono-forensic text-[10px] text-slate-400 truncate max-w-xs">
                          {f.sha256}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
