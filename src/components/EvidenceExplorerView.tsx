import React, { useState } from "react";
import {
  FolderTree,
  Search,
  Filter,
  FileText,
  Binary,
  ShieldCheck,
  Download,
  CheckCircle2,
  Lock,
  AlertCircle,
  Copy,
  Hash,
} from "lucide-react";
import { EvidenceFile, ArtifactStatus } from "../types/forensics";
import { computeSha256, computeSha512, computeLegacyMd5 } from "../utils/crypto";

interface EvidenceExplorerViewProps {
  evidenceFiles: EvidenceFile[];
  onSelectForHexView: (file: EvidenceFile) => void;
  onExportManifest: () => void;
}

export const EvidenceExplorerView: React.FC<EvidenceExplorerViewProps> = ({
  evidenceFiles,
  onSelectForHexView,
  onExportManifest,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedFile, setSelectedFile] = useState<EvidenceFile | null>(evidenceFiles[0] || null);
  const [calculatedHashes, setCalculatedHashes] = useState<Record<string, { sha256: string; sha512: string; md5: string }>>({});
  const [isHashing, setIsHashing] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);

  const categories = [
    "ALL",
    "Images",
    "Databases",
    "APK",
    "Archives",
    "Documents",
    "Logs",
    "Unknown",
  ];

  const filteredFiles = evidenceFiles.filter((f) => {
    const matchesCat = selectedCategory === "ALL" || f.category === selectedCategory;
    const matchesSearch =
      f.filename.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.sha256.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleRecalculateHash = async (file: EvidenceFile) => {
    setIsHashing(true);
    const mockContent = `${file.filename}-${file.size}-${file.acquiredAt}`;
    const sha256 = await computeSha256(mockContent);
    const sha512 = await computeSha512(mockContent);
    const md5 = computeLegacyMd5(mockContent);
    setCalculatedHashes((prev) => ({
      ...prev,
      [file.id]: { sha256, sha512, md5 },
    }));
    setIsHashing(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Bar: Search, Category Filters, Manifest Export */}
      <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by filename, path, or SHA-256 hash..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs font-mono-forensic text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-md border border-slate-800 text-[11px] font-mono-forensic">
            <Filter className="w-3 h-3 text-slate-500 ml-1.5" />
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded transition-colors ${
                  selectedCategory === cat
                    ? "bg-cyan-600 text-slate-950 font-bold"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <button
            onClick={onExportManifest}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/40 text-xs font-mono-forensic transition-colors"
            title="Export official evidence_manifest.json with all hashes"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Manifest.json</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Split View: File Tree/List + File Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: File Table (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden font-mono-forensic text-xs flex flex-col justify-between">
          <div>
            <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-slate-400 font-bold">
              <span>Acquired Evidence Files ({filteredFiles.length})</span>
              <span className="text-[10px] text-slate-500">Read-Only Forensic Working Copy</span>
            </div>

            <div className="divide-y divide-slate-850 max-h-[580px] overflow-y-auto">
              {filteredFiles.map((file) => {
                const isSelected = selectedFile?.id === file.id;
                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`p-3 cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                      isSelected
                        ? "bg-cyan-950/40 border-l-2 border-cyan-400"
                        : "hover:bg-slate-900/40"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 overflow-hidden">
                      <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${isSelected ? "text-cyan-400" : "text-slate-500"}`} />
                      <div className="overflow-hidden">
                        <div className="text-slate-200 font-semibold truncate">
                          {file.filename}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate mt-0.5">
                          {file.source}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono-forensic mt-1">
                          SHA: {file.sha256.slice(0, 16)}...
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span
                        className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded uppercase ${
                          file.status === "PARSED"
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                            : file.status === "ENCRYPTED"
                            ? "bg-purple-950 text-purple-300 border border-purple-800"
                            : file.status === "INACCESSIBLE"
                            ? "bg-rose-950 text-rose-300 border border-rose-800"
                            : "bg-cyan-950 text-cyan-300 border border-cyan-800"
                        }`}
                      >
                        {file.status}
                      </span>
                      <div className="text-[11px] text-slate-400 mt-1">
                        {(file.size / 1024).toFixed(1)} KB
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="p-2.5 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex justify-between">
            <span>Showing {filteredFiles.length} of {evidenceFiles.length} items</span>
            <span>Immutable Preservation Model</span>
          </div>
        </div>

        {/* Right Column: File Details & Hash Inspector (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-[#090d16] border border-slate-800 p-4 space-y-4 font-mono-forensic text-xs">
          {selectedFile ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  Evidence Inspector
                </div>
                <button
                  onClick={() => onSelectForHexView(selectedFile)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-purple-950/60 border border-purple-500/40 text-purple-300 hover:bg-purple-900/50 transition-colors text-[11px]"
                >
                  <Binary className="w-3 h-3" />
                  Send to Hex Viewer
                </button>
              </div>

              {/* File Specs */}
              <div className="space-y-2.5 text-xs">
                <div>
                  <span className="text-slate-500 text-[11px]">Filename:</span>
                  <div className="text-white font-bold">{selectedFile.filename}</div>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px]">Original Path on Android:</span>
                  <div className="text-slate-300 break-all text-[11px] bg-slate-950 p-1.5 rounded border border-slate-850">
                    {selectedFile.source}
                  </div>
                </div>

                <div>
                  <span className="text-slate-500 text-[11px]">Working Copy Location:</span>
                  <div className="text-slate-300 break-all text-[11px] bg-slate-950 p-1.5 rounded border border-slate-850">
                    {selectedFile.destination}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-slate-500 text-[11px]">File Size:</span>
                    <div className="text-slate-200">{selectedFile.size.toLocaleString()} bytes</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">MIME Type:</span>
                    <div className="text-cyan-300">{selectedFile.mimeType}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Method:</span>
                    <div className="text-slate-200">{selectedFile.method}</div>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[11px]">Category:</span>
                    <div className="text-slate-200">{selectedFile.category}</div>
                  </div>
                </div>

                {selectedFile.notes && (
                  <div>
                    <span className="text-slate-500 text-[11px]">Examiner Notes:</span>
                    <div className="text-slate-300 bg-slate-950/60 p-2 rounded border border-slate-900 text-[11px] leading-relaxed">
                      {selectedFile.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Cryptographic Hashes Section (Section 10) */}
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-bold flex items-center gap-1.5 text-xs">
                    <Hash className="w-3.5 h-3.5" />
                    Cryptographic Signatures
                  </span>
                  <button
                    onClick={() => handleRecalculateHash(selectedFile)}
                    disabled={isHashing}
                    className="text-[10px] text-cyan-400 hover:underline"
                  >
                    {isHashing ? "Calculating..." : "Recalculate All"}
                  </button>
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-950 p-2 rounded border border-slate-850">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-bold text-emerald-400">SHA-256 (Court Standard)</span>
                      <button
                        onClick={() => copyToClipboard(selectedFile.sha256)}
                        className="hover:text-white"
                        title="Copy hash"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                    <div className="text-[11px] text-slate-200 break-all select-all font-mono-forensic">
                      {selectedFile.sha256}
                    </div>
                  </div>

                  {selectedFile.sha512 && (
                    <div className="bg-slate-950 p-2 rounded border border-slate-850">
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                        <span className="font-bold text-purple-400">SHA-512 (Extended Digest)</span>
                      </div>
                      <div className="text-[10px] text-slate-300 break-all select-all font-mono-forensic">
                        {selectedFile.sha512}
                      </div>
                    </div>
                  )}

                  <div className="bg-slate-950 p-2 rounded border border-slate-850">
                    <div className="flex items-center justify-between text-[10px] text-slate-500 mb-1">
                      <span className="font-bold text-amber-400">MD5 (Legacy Triage Only - Non-Integrity Safe)</span>
                    </div>
                    <div className="text-[11px] text-slate-400 break-all select-all font-mono-forensic">
                      {selectedFile.md5 || computeLegacyMd5(selectedFile.filename + selectedFile.size)}
                    </div>
                  </div>
                </div>

                {copiedHash && (
                  <div className="text-[10px] text-emerald-400 text-center animate-pulse">
                    Hash copied to clipboard!
                  </div>
                )}
              </div>

              {/* Header Hex Preview */}
              {selectedFile.hexPreview && (
                <div className="pt-2">
                  <span className="text-slate-500 text-[10px] block mb-1">Magic Header Bytes:</span>
                  <div className="bg-slate-950 p-2 rounded border border-slate-900 text-cyan-300 text-[11px] tracking-wider">
                    {selectedFile.hexPreview}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-8 text-center text-slate-500">
              Select an evidence file to inspect cryptographic metadata
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
