import React, { useState, useRef, useEffect } from "react";
import { Terminal, X, Minimize2, Maximize2, CornerDownLeft } from "lucide-react";
import { ForensicCase, AndroidDevice, EvidenceFile } from "../types/forensics";

interface CliModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCase: ForensicCase;
  device: AndroidDevice;
  evidenceFiles: EvidenceFile[];
  onTriggerAcquisition: () => void;
}

export const CliModal: React.FC<CliModalProps> = ({
  isOpen,
  onClose,
  currentCase,
  device,
  evidenceFiles,
  onTriggerAcquisition,
}) => {
  const [history, setHistory] = useState<Array<{ cmd: string; output: string }>>([
    {
      cmd: "neon-cli --version",
      output: "NEON FORENSIC Command-Line Interface v3.4.0 (x86_64-linux-gnu)\nAuthorized Android Evidence Acquisition & Analysis Platform",
    },
    {
      cmd: "help",
      output: `Available Commands:
  devices                  List detected Android USB and TCP/IP devices
  info                     Display active case metadata and target specifications
  acquire --profile <p>    Execute forensic acquisition (quick | standard | deep)
  hash --verify            Recalculate SHA-256 digests across all case artifacts
  timeline --limit <n>     Display recent correlated temporal timeline events
  carve --unallocated      Scan raw residual blocks for file magic headers
  report --format <html>   Generate court-admissible forensic report
  clear                    Clear terminal screen
  help                     Show this command manual`,
    },
  ]);
  const [inputVal, setInputVal] = useState("");
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history]);

  if (!isOpen) return null;

  const handleCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = inputVal.trim();
    if (!cmd) return;

    let output = "";
    const lower = cmd.toLowerCase();

    if (lower === "clear") {
      setHistory([]);
      setInputVal("");
      return;
    } else if (lower === "devices") {
      output = `Target Serial: ${device.serial}
State:         ${device.adbState}
Manufacturer:  ${device.manufacturer}
Model:         ${device.model} (${device.marketName})
OS:            ${device.androidVersion}
Root Status:   ${device.rootStatus}
Security:      ${device.storage.encryptionType}`;
    } else if (lower === "info") {
      output = `Case ID:       ${currentCase.id}
Title:         ${currentCase.name}
Investigator:  ${currentCase.investigator}
Agency:        ${currentCase.organization}
Auth State:    ${currentCase.authorizationStatus}
Hash Standard: ${currentCase.hashAlgorithm}`;
    } else if (lower.startsWith("acquire")) {
      output = `[+] Initiating forensic acquisition sub-routine under case ${currentCase.id}...
[+] Non-destructive read lock verified.
[+] Acquired 6 evidence files. SHA-256 manifests updated.`;
      onTriggerAcquisition();
    } else if (lower.startsWith("hash")) {
      output = `[+] Hashing ${evidenceFiles.length} evidence artifacts using SHA-256:
${evidenceFiles.map((f) => `  ${f.sha256.slice(0, 32)}...  [OK] ${f.filename}`).join("\n")}
[✓] All digests verified against root manifest. Zero bit flips detected.`;
    } else if (lower.startsWith("timeline")) {
      output = `[+] Chronological Events Correlated:
  2026-09-08 03:19:22 UTC | SMS   | From: +44 7911 123456
  2026-09-08 19:40:00 UTC | APP   | Sideloaded: com.cryptocore.vault
  2026-09-09 14:23:01 UTC | MEDIA | Camera capture at GPS 37.7891, -122.4014
  2026-09-10 17:22:04 UTC | BRW   | Chrome Visit: SwissVault Secure File Gateway`;
    } else if (lower.startsWith("carve")) {
      output = `[+] Running NEON RECOVER signature scan on residual cluster sectors...
[✓] Matched 3 signatures:
  0x000F4800: JPEG Image (284,102 bytes) [RECOVERED]
  0x002A1000: SQLite 3 Database (40,960 bytes) [RECOVERED]
  0x00412000: PDF Document (16,384 bytes) [PARTIAL]`;
    } else if (lower.startsWith("report")) {
      output = `[✓] Generated court-admissible forensic dossier in /evidence/reports/NEON_REPORT_${currentCase.id}.html (SHA-256: e82910...)`;
    } else if (lower === "help") {
      output = `Available Commands:
  devices                  List detected Android USB and TCP/IP devices
  info                     Display active case metadata and target specifications
  acquire --profile <p>    Execute forensic acquisition (quick | standard | deep)
  hash --verify            Recalculate SHA-256 digests across all case artifacts
  timeline --limit <n>     Display recent correlated temporal timeline events
  carve --unallocated      Scan raw residual blocks for file magic headers
  report --format <html>   Generate court-admissible forensic report
  clear                    Clear terminal screen
  help                     Show this command manual`;
    } else {
      output = `neon-cli: command not found: '${cmd}'. Type 'help' for supported commands.`;
    }

    setHistory((prev) => [...prev, { cmd, output }]);
    setInputVal("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-4xl h-[580px] bg-[#07090e] border border-cyan-500/50 rounded-xl flex flex-col shadow-[0_0_30px_rgba(6,182,212,0.25)] overflow-hidden font-mono-forensic text-xs">
        {/* Terminal Title Bar */}
        <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-slate-300">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-white tracking-wider">
              NEON FORENSIC CLI TERMINAL (neon-cli)
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Terminal Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#07090e] text-slate-200">
          {history.map((item, idx) => (
            <div key={idx} className="space-y-1">
              <div className="flex items-center gap-2 text-cyan-400">
                <span className="text-purple-400 font-bold">investigator@neon-forensic</span>
                <span className="text-slate-500">:</span>
                <span className="text-blue-400">~/{currentCase.id}</span>
                <span className="text-slate-500">$</span>
                <span className="text-white font-semibold">{item.cmd}</span>
              </div>
              <pre className="text-slate-300 whitespace-pre-wrap pl-4 font-mono-forensic text-[11px] leading-relaxed">
                {item.output}
              </pre>
            </div>
          ))}
          <div ref={terminalEndRef} />
        </div>

        {/* Command Input Bar */}
        <form
          onSubmit={handleCommand}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2"
        >
          <span className="text-cyan-400 font-bold">$</span>
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type command ('help' for options)..."
            autoFocus
            className="flex-1 bg-transparent text-cyan-300 font-mono-forensic text-xs focus:outline-none"
          />
          <button
            type="submit"
            className="px-3 py-1 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 hover:bg-cyan-800/60 text-[11px] font-bold"
          >
            Run
          </button>
        </form>
      </div>
    </div>
  );
};
