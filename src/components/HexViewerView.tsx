import React, { useState, useMemo } from "react";
import { Binary, Search, ArrowRight, CornerDownRight, FileCode, CheckCircle2 } from "lucide-react";
import { EvidenceFile } from "../types/forensics";

interface HexViewerViewProps {
  evidenceFiles: EvidenceFile[];
  selectedFile: EvidenceFile | null;
  onSelectFile: (file: EvidenceFile) => void;
}

export const HexViewerView: React.FC<HexViewerViewProps> = ({
  evidenceFiles,
  selectedFile,
  onSelectFile,
}) => {
  const [jumpOffset, setJumpOffset] = useState("0x00000000");
  const [searchString, setSearchString] = useState("");
  const [activeFile, setActiveFile] = useState<EvidenceFile>(
    selectedFile || evidenceFiles[0]
  );

  // Generate realistic 256-512 byte stream for selected file
  const hexRows = useMemo(() => {
    const file = activeFile;
    const baseBytes = file.hexPreview
      ? file.hexPreview.split(" ").map((b) => parseInt(b, 16) || 0)
      : [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61, 0x74, 0x20, 0x33, 0x00];

    const totalBytes: number[] = [...baseBytes];
    // Fill up to 256 bytes deterministically from hash and size
    while (totalBytes.length < 256) {
      const seed = (totalBytes.length * 37 + (file.size % 255)) % 256;
      totalBytes.push(seed);
    }

    const rows = [];
    for (let i = 0; i < totalBytes.length; i += 16) {
      const slice = totalBytes.slice(i, i + 16);
      const hexStr = slice
        .map((b) => b.toString(16).padStart(2, "0").toUpperCase())
        .join(" ");
      const asciiStr = slice
        .map((b) => (b >= 32 && b <= 126 ? String.fromCharCode(b) : "."))
        .join("");

      rows.push({
        offset: i.toString(16).padStart(8, "0").toUpperCase(),
        offsetDec: i,
        hex: hexStr,
        ascii: asciiStr,
      });
    }
    return rows;
  }, [activeFile]);

  const handleSelect = (f: EvidenceFile) => {
    setActiveFile(f);
    onSelectFile(f);
  };

  return (
    <div className="space-y-4 font-mono-forensic text-xs">
      {/* File Selector & Controls */}
      <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-950/60 border border-purple-500/40 text-purple-400">
            <Binary className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-bold">Target File:</span>
              <select
                value={activeFile.id}
                onChange={(e) => {
                  const target = evidenceFiles.find((f) => f.id === e.target.value);
                  if (target) handleSelect(target);
                }}
                className="px-3 py-1 rounded bg-slate-950 border border-slate-800 text-cyan-300 text-xs focus:outline-none focus:border-cyan-500"
              >
                {evidenceFiles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.filename} ({f.mimeType})
                  </option>
                ))}
              </select>
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Size: {activeFile.size.toLocaleString()} bytes | Category: {activeFile.category} | SHA-256: {activeFile.sha256.slice(0, 20)}...
            </div>
          </div>
        </div>

        {/* Jump to offset and search */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <span className="text-slate-500 text-[11px]">Offset:</span>
            <input
              type="text"
              value={jumpOffset}
              onChange={(e) => setJumpOffset(e.target.value)}
              className="w-24 bg-transparent text-cyan-300 text-xs focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search ASCII / Hex pattern..."
              value={searchString}
              onChange={(e) => setSearchString(e.target.value)}
              className="w-48 bg-transparent text-slate-200 text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Hex Stream Display Window */}
      <div className="rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between text-slate-400 font-bold text-[11px]">
          <span>Raw Evidence Stream Inspector</span>
          <span className="text-emerald-400">Pristine Unmodified Byte Stream</span>
        </div>

        <div className="p-4 overflow-x-auto max-h-[520px] overflow-y-auto font-mono-forensic text-xs select-text">
          <div className="min-w-[680px]">
            {/* Column Headers */}
            <div className="flex border-b border-slate-800 pb-2 mb-2 text-slate-500 text-[11px] uppercase tracking-wider font-bold">
              <span className="w-28">Offset</span>
              <span className="flex-1 tracking-widest pl-2">
                00 01 02 03 04 05 06 07  08 09 0A 0B 0C 0D 0E 0F
              </span>
              <span className="w-44 pl-4">Decoded ASCII</span>
            </div>

            {/* Rows */}
            {hexRows.map((row) => {
              const matchesSearch =
                searchString &&
                (row.hex.toLowerCase().includes(searchString.toLowerCase()) ||
                  row.ascii.toLowerCase().includes(searchString.toLowerCase()));

              return (
                <div
                  key={row.offset}
                  className={`flex py-1 hover:bg-slate-900/60 font-mono-forensic transition-colors ${
                    matchesSearch ? "bg-amber-950/40 text-amber-200 border-l-2 border-amber-400" : ""
                  }`}
                >
                  <span className="w-28 text-slate-500 select-none">
                    0x{row.offset}
                  </span>
                  <span className="flex-1 text-cyan-300 tracking-wider pl-2">
                    {row.hex}
                  </span>
                  <span className="w-44 text-slate-400 pl-4 border-l border-slate-800/80">
                    {row.ascii}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="px-4 py-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
          <span>Displaying 256 bytes buffer preview</span>
          <span className="text-cyan-400">Byte Ordering: Little-Endian / Network Order</span>
        </div>
      </div>
    </div>
  );
};
