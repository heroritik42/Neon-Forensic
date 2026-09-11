import React, { useState, useMemo } from "react";
import {
  Sparkles,
  Search,
  RefreshCw,
  Info,
  ShieldCheck,
  Eye,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  FileCode,
  Binary,
  Database,
  Layers,
  CheckCircle2,
  FolderOpen,
  Filter,
  Copy,
  Check,
  Zap,
  ArrowUpRight,
  Maximize2
} from "lucide-react";
import { CarvedFileArtifact } from "../types/forensics";
import { ForensicFilePreviewModal } from "./ForensicFilePreviewModal";

interface NeonRecoverViewProps {
  carvedFiles: CarvedFileArtifact[];
  onTriggerCarveScan: (method?: string) => void;
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
  const [previewingFile, setPreviewingFile] = useState<CarvedFileArtifact | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedMethod, setSelectedMethod] = useState<string>("ALL");
  const [searchFilter, setSearchFilter] = useState<string>("");
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [inlineTab, setInlineTab] = useState<"PREVIEW" | "TEXT" | "HEX">("PREVIEW");

  // Filtered files calculation
  const filteredFiles = useMemo(() => {
    return carvedFiles.filter((file) => {
      // Category filter
      if (selectedCategory === "IMAGES") {
        if (!["JPEG", "PNG", "WEBP", "GIF"].includes(file.fileType)) return false;
      } else if (selectedCategory === "DOCS") {
        if (!["PDF", "DOC", "DOCX"].includes(file.fileType)) return false;
      } else if (selectedCategory === "TEXT") {
        if (!["TXT", "LOG"].includes(file.fileType)) return false;
      } else if (selectedCategory === "MEDIA") {
        if (!["MP4", "MP3", "WAV", "OGG"].includes(file.fileType)) return false;
      } else if (selectedCategory === "DB") {
        if (!["SQLITE", "SQL"].includes(file.fileType)) return false;
      }

      // Method filter
      if (selectedMethod !== "ALL") {
        if (file.recoveryMethod && file.recoveryMethod !== selectedMethod) return false;
      }

      // Search keyword filter
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        const matchesName = (file.filename || "").toLowerCase().includes(q);
        const matchesType = file.fileType.toLowerCase().includes(q);
        const matchesPath = (file.deletedOriginalPath || "").toLowerCase().includes(q);
        const matchesContent = (file.contentSnippet || "").toLowerCase().includes(q);
        const matchesOffset = file.offset.toLowerCase().includes(q);
        if (!matchesName && !matchesType && !matchesPath && !matchesContent && !matchesOffset) {
          return false;
        }
      }

      return true;
    });
  }, [carvedFiles, selectedCategory, selectedMethod, searchFilter]);

  // Keep selectedFile valid
  React.useEffect(() => {
    if (filteredFiles.length > 0 && (!selectedFile || !filteredFiles.some((f) => f.id === selectedFile.id))) {
      setSelectedFile(filteredFiles[0]);
    }
  }, [filteredFiles, selectedFile]);

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const getCategoryCount = (cat: string) => {
    if (cat === "ALL") return carvedFiles.length;
    if (cat === "IMAGES") return carvedFiles.filter((f) => ["JPEG", "PNG", "WEBP"].includes(f.fileType)).length;
    if (cat === "DOCS") return carvedFiles.filter((f) => ["PDF", "DOC", "DOCX"].includes(f.fileType)).length;
    if (cat === "TEXT") return carvedFiles.filter((f) => ["TXT", "LOG"].includes(f.fileType)).length;
    if (cat === "MEDIA") return carvedFiles.filter((f) => ["MP4", "MP3"].includes(f.fileType)).length;
    if (cat === "DB") return carvedFiles.filter((f) => ["SQLITE", "SQL"].includes(f.fileType)).length;
    return 0;
  };

  const getIconForType = (type: string) => {
    if (["JPEG", "PNG", "WEBP"].includes(type)) return <ImageIcon className="w-4 h-4 text-emerald-400" />;
    if (["PDF", "DOC", "DOCX"].includes(type)) return <FileText className="w-4 h-4 text-rose-400" />;
    if (["MP4"].includes(type)) return <Film className="w-4 h-4 text-purple-400" />;
    if (["MP3"].includes(type)) return <Music className="w-4 h-4 text-amber-400" />;
    if (["TXT", "LOG"].includes(type)) return <FileCode className="w-4 h-4 text-cyan-400" />;
    return <Binary className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="space-y-6 font-mono-forensic text-xs">
      {/* Header & Advanced Method Control Center */}
      <div className="p-5 rounded-2xl bg-[#090e1a] border border-cyan-500/30 shadow-[0_0_30px_rgba(6,182,212,0.1)] space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-950 to-purple-950 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.3)] shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-white tracking-wide">
                  NEON RECOVER: Advanced Forensic Reconstruction
                </h2>
                <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-700 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" />
                  LIVE PHYSICAL &amp; INODE RECOVERY
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-700 font-bold">
                  DIRECT IN-TOOL VIEWER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                Recovers deleted data via hardware inode carving, MediaStore trash recovery, SQLite WAL freelist extraction, and raw magic signature reconstruction. View any recovered artifact directly in this tool without downloading.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 w-full lg:w-auto">
            {/* Recovery Method Selector */}
            <select
              value={selectedMethod}
              onChange={(e) => setSelectedMethod(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono-forensic text-cyan-300 focus:outline-none focus:border-cyan-400 cursor-pointer"
            >
              <option value="ALL">⚡ All Methods (Deep Comprehensive)</option>
              <option value="TRASH_INODE">🗑️ Inode &amp; MediaStore Trash (.trashed-*)</option>
              <option value="THUMBNAIL_RECONSTRUCT">🖼️ Deleted Photos &amp; EXIF Inode Carve</option>
              <option value="SQLITE_WAL_FREELIST">💬 SQLite WAL Freelist (Deleted Chats &amp; SMS)</option>
              <option value="MAGIC_HEADER_CARVE">📄 Magic Signature Carve (PDF, DOCX, TXT)</option>
              <option value="CACHE_EXTRACT">💾 Application Temp Cache &amp; Media Stream</option>
            </select>

            <button
              onClick={() => onTriggerCarveScan(selectedMethod)}
              disabled={isScanning}
              className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] disabled:opacity-50"
            >
              {isScanning ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <Search className="w-4 h-4 text-slate-950" />
              )}
              <span>{isScanning ? "Carving Raw Inodes..." : "Execute Forensic Recovery"}</span>
            </button>
          </div>
        </div>

        {/* Forensic Methodology & Hardware Notice Banner */}
        <div className="p-3.5 rounded-xl bg-[#060a12] border border-cyan-900/40 grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300 text-[11px]">
          <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-cyan-300 block">1. Inode &amp; MediaStore Carver</span>
              <p className="text-slate-400 text-[10px] mt-0.5">
                Targets Android 11+ scoped-storage trash inodes (<code className="text-cyan-400">.trashed-*</code>), reclaiming deleted documents &amp; media before physical disk discard.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <Database className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-purple-300 block">2. SQLite WAL Freelist Engine</span>
              <p className="text-slate-400 text-[10px] mt-0.5">
                Parses unallocated freeblock pages in <code className="text-purple-400">mmssms.db</code> and Signal/WhatsApp cache journals to recover deleted messages and call logs.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5 p-2 rounded-lg bg-slate-900/60 border border-slate-800">
            <Eye className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-emerald-300 block">3. In-Tool Live Inspector</span>
              <p className="text-slate-400 text-[10px] mt-0.5">
                View recovered PDFs, Word DOCXs, high-res photos, text logs, videos, and audio directly within the workstation. No external software or download required.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* FILTER TABS & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#080d17] p-2.5 rounded-xl border border-slate-800">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: "ALL", label: "All Recovered Files", count: getCategoryCount("ALL") },
            { id: "IMAGES", label: "Images (JPEG/PNG)", count: getCategoryCount("IMAGES") },
            { id: "DOCS", label: "Documents (PDF/DOCX)", count: getCategoryCount("DOCS") },
            { id: "TEXT", label: "Text & Logs", count: getCategoryCount("TEXT") },
            { id: "MEDIA", label: "Video & Audio", count: getCategoryCount("MEDIA") },
            { id: "DB", label: "Databases (SQLite)", count: getCategoryCount("DB") },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono-forensic whitespace-nowrap transition-all flex items-center gap-1.5 ${
                selectedCategory === cat.id
                  ? "bg-cyan-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                  : "bg-slate-900/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
              }`}
            >
              <span>{cat.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded ${
                  selectedCategory === cat.id
                    ? "bg-slate-950/40 text-slate-950 font-extrabold"
                    : "bg-slate-800 text-cyan-400"
                }`}
              >
                {cat.count}
              </span>
            </button>
          ))}
        </div>

        <div className="relative shrink-0 sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter recovered files..."
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono-forensic text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Main Forensic Carved Vault Workspace (Grid: Left List + Right Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Side: Carved Items List (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-[#080d17] border border-slate-800 overflow-hidden flex flex-col">
          <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-slate-400 font-bold">
            <span className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-cyan-400" />
              Recovered Artifact Vault ({filteredFiles.length})
            </span>
            <span className="text-[10px] text-cyan-400 uppercase font-mono-forensic">
              Zero Download • Court Admissible
            </span>
          </div>

          <div className="divide-y divide-slate-850/80 max-h-[620px] overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <div className="p-8 text-center text-slate-500 font-mono-forensic">
                No artifacts matched the selected filter or search criteria.
              </div>
            ) : (
              filteredFiles.map((file) => {
                const isSelected = selectedFile?.id === file.id;
                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFile(file)}
                    className={`p-3.5 cursor-pointer transition-all border-l-2 flex flex-col gap-2 ${
                      isSelected
                        ? "bg-cyan-950/30 border-cyan-400 shadow-inner"
                        : "hover:bg-slate-900/50 border-transparent"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                          {getIconForType(file.fileType)}
                        </div>
                        <div className="min-w-0">
                          <div className="text-white font-bold text-xs truncate" title={file.filename || file.id}>
                            {file.filename || `${file.id}.${file.fileType.toLowerCase()}`}
                          </div>
                          <div className="text-slate-400 text-[11px] flex items-center gap-2 mt-0.5 flex-wrap">
                            <span className="text-cyan-400 font-mono-forensic font-semibold">
                              {file.offset}
                            </span>
                            <span className="text-slate-600">•</span>
                            <span>{(file.size / 1024).toFixed(1)} KB</span>
                            <span className="text-slate-600">•</span>
                            <span className="text-purple-300 font-mono-forensic text-[10px]">
                              {file.recoveryMethod || "CARVED_SECTOR"}
                            </span>
                          </div>
                          {file.deletedOriginalPath && (
                            <div
                              className="text-[10px] text-rose-400/90 truncate max-w-sm mt-1"
                              title={file.deletedOriginalPath}
                            >
                              Deleted: {file.deletedOriginalPath}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            file.status === "RECOVERED"
                              ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                              : "bg-amber-950/80 text-amber-300 border border-amber-800"
                          }`}
                        >
                          {file.status}
                        </span>

                        {/* Direct In-Tool Preview Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFile(file);
                            setPreviewingFile(file);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 text-[11px] font-bold border border-cyan-500/40 transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                          title="View file content directly in this tool without download"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View in Tool</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Selected Artifact Quick Viewer & Deep Inspector (6 cols) */}
        <div className="lg:col-span-6 rounded-2xl bg-[#080d17] border border-slate-800 overflow-hidden flex flex-col">
          {selectedFile ? (
            <>
              {/* Header with Quick Actions */}
              <div className="px-4 py-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="p-1.5 rounded bg-slate-800 border border-slate-700">
                    {getIconForType(selectedFile.fileType)}
                  </div>
                  <div className="min-w-0">
                    <span className="font-bold text-white text-xs block truncate max-w-xs" title={selectedFile.filename || selectedFile.id}>
                      {selectedFile.filename || selectedFile.id}
                    </span>
                    <span className="text-[10px] text-cyan-400 font-mono-forensic">
                      {selectedFile.fileType} • {selectedFile.recoveryMethod || "CARVE_SECTOR"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewingFile(selectedFile)}
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs font-mono-forensic flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)] transition-all"
                  >
                    <Maximize2 className="w-3.5 h-3.5" />
                    <span>Fullscreen Inspector</span>
                  </button>
                </div>
              </div>

              {/* Inspector Sub-tabs: Quick Preview, Extracted Text, Raw Hex */}
              <div className="px-4 py-2 bg-slate-950/80 border-b border-slate-800 flex items-center gap-2">
                <button
                  onClick={() => setInlineTab("PREVIEW")}
                  className={`px-3 py-1 rounded text-xs font-mono-forensic font-semibold transition-all flex items-center gap-1 ${
                    inlineTab === "PREVIEW"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  Visual Preview
                </button>
                <button
                  onClick={() => setInlineTab("TEXT")}
                  className={`px-3 py-1 rounded text-xs font-mono-forensic font-semibold transition-all flex items-center gap-1 ${
                    inlineTab === "TEXT"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  Extracted Content
                </button>
                <button
                  onClick={() => setInlineTab("HEX")}
                  className={`px-3 py-1 rounded text-xs font-mono-forensic font-semibold transition-all flex items-center gap-1 ${
                    inlineTab === "HEX"
                      ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/40"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Binary className="w-3.5 h-3.5" />
                  Sector Hex Dump
                </button>
              </div>

              {/* Inspector Body */}
              <div className="flex-1 p-4 space-y-4 max-h-[540px] overflow-y-auto bg-[#060a12]">
                {inlineTab === "PREVIEW" && (
                  <div className="space-y-4">
                    {/* Visual Media or Document Render */}
                    {selectedFile.previewUrl ? (
                      <div className="rounded-xl overflow-hidden border border-slate-800 bg-black flex items-center justify-center p-2 relative group">
                        <img
                          src={selectedFile.previewUrl}
                          alt={selectedFile.filename}
                          className="max-h-52 object-contain rounded-lg"
                        />
                        <button
                          onClick={() => setPreviewingFile(selectedFile)}
                          className="absolute bottom-4 right-4 px-3 py-1.5 rounded-lg bg-black/80 hover:bg-cyan-500 text-white hover:text-slate-950 text-xs font-bold border border-cyan-500/40 flex items-center gap-1.5 transition-all shadow-lg backdrop-blur-sm"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                          Expand Image
                        </button>
                      </div>
                    ) : selectedFile.fileType === "MP4" ? (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-purple-400">
                          <span className="font-bold flex items-center gap-2">
                            <Film className="w-4 h-4" />
                            Recovered Video Container (1080p AVC H.264)
                          </span>
                          <span className="text-[10px] text-slate-400">Duration: 00:24</span>
                        </div>
                        <pre className="text-slate-300 text-[11px] whitespace-pre-wrap bg-slate-900/80 p-3 rounded-lg border border-slate-800 font-mono-forensic">
                          {selectedFile.contentSnippet}
                        </pre>
                      </div>
                    ) : selectedFile.fileType === "MP3" ? (
                      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                        <div className="flex items-center justify-between text-amber-400">
                          <span className="font-bold flex items-center gap-2">
                            <Music className="w-4 h-4" />
                            Recovered Audio Intercept (MP3 128 kbps)
                          </span>
                          <span className="text-[10px] text-slate-400">Duration: 01:42</span>
                        </div>
                        <div className="h-12 bg-slate-900 rounded-lg border border-slate-800 flex items-center px-3 gap-1">
                          {Array.from({ length: 32 }).map((_, i) => (
                            <div
                              key={i}
                              className="flex-1 bg-amber-400/80 rounded-full"
                              style={{ height: `${(i * 13) % 80 + 20}%` }}
                            />
                          ))}
                        </div>
                        <pre className="text-slate-300 text-[11px] whitespace-pre-wrap bg-slate-900/80 p-3 rounded-lg border border-slate-800 font-mono-forensic max-h-40 overflow-y-auto">
                          {selectedFile.contentSnippet}
                        </pre>
                      </div>
                    ) : (
                      <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono-forensic text-xs text-slate-200">
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-cyan-400 font-bold">
                          <span>DOCUMENT / TEXT STREAM EXCERPT</span>
                          <span className="text-[10px] text-slate-500">In-App Cleartext</span>
                        </div>
                        <pre className="whitespace-pre-wrap text-cyan-100 text-[11px] leading-relaxed max-h-48 overflow-y-auto select-text">
                          {selectedFile.contentSnippet || "Binary artifact without plaintext stream."}
                        </pre>
                      </div>
                    )}

                    {/* Metadata Specs Grid */}
                    {selectedFile.metadata && (
                      <div className="grid grid-cols-2 gap-2 text-[11px] font-mono-forensic">
                        {Object.entries(selectedFile.metadata).slice(0, 4).map(([k, v]) => (
                          <div key={k} className="p-2 rounded-lg bg-slate-900/70 border border-slate-800">
                            <span className="text-slate-500 block text-[9px] uppercase">{k}</span>
                            <span className="text-slate-200 font-semibold truncate block">{String(v)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {inlineTab === "TEXT" && (
                  <div className="space-y-2 font-mono-forensic">
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
                      <span>Extracted Forensic Plaintext Stream</span>
                      <button
                        onClick={() => {
                          if (selectedFile.contentSnippet) {
                            navigator.clipboard.writeText(selectedFile.contentSnippet);
                          }
                        }}
                        className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px]"
                      >
                        <Copy className="w-3 h-3" />
                        Copy Text
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap text-xs text-slate-200 bg-slate-950 p-4 rounded-xl border border-slate-800 select-text leading-relaxed max-h-72 overflow-y-auto">
                      {selectedFile.contentSnippet || "No extracted plaintext available for this binary stream."}
                    </pre>
                  </div>
                )}

                {inlineTab === "HEX" && (
                  <div className="space-y-2 font-mono-forensic">
                    <div className="flex items-center justify-between text-xs text-slate-400 pb-1 border-b border-slate-800">
                      <span className="text-cyan-400 font-bold">16-Byte Aligned Hexadecimal Dump</span>
                      <span className="text-slate-500">Offset: {selectedFile.offset}</span>
                    </div>
                    <pre className="text-[11px] text-cyan-300 bg-slate-950 p-3.5 rounded-xl border border-slate-800 overflow-x-auto select-text">
                      {selectedFile.hexDump ||
`00000000  50 4B 03 04 14 00 06 00  08 00 00 00 21 00 E8 29  |PK..........!..)|
00000010  6E 5E F8 01 00 00 D4 05  00 00 13 00 08 02 5B 43  |n^............[C|
00000020  6F 6E 74 65 6E 74 5F 54  79 70 65 73 5D 2E 78 6D  |ontent_Types].xm|`}
                    </pre>
                  </div>
                )}

                {/* Validation & Forensic Integrity Footer */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 font-bold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Cryptographic Evidence Seal
                    </span>
                    <span className="text-emerald-400 text-[10px] font-bold">COURT ADMISSIBLE</span>
                  </div>

                  <div className="flex items-center justify-between gap-2 p-2 rounded bg-slate-900 border border-slate-800 font-mono-forensic text-[10px] text-cyan-300">
                    <span className="truncate select-all">{selectedFile.sha256}</span>
                    <button
                      onClick={() => handleCopyHash(selectedFile.sha256)}
                      className="text-slate-400 hover:text-white shrink-0"
                      title="Copy SHA-256"
                    >
                      {copiedHash ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  <p className="text-slate-400 text-[10px] leading-relaxed">
                    {selectedFile.validationDetails}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-500 font-mono-forensic flex flex-col items-center justify-center space-y-3">
              <FolderOpen className="w-10 h-10 text-slate-600" />
              <span>Select an artifact on the left to inspect its contents without download.</span>
            </div>
          )}
        </div>
      </div>

      {/* DEDICATED IN-TOOL FILE PREVIEW MODAL */}
      {previewingFile && (
        <ForensicFilePreviewModal
          artifact={previewingFile}
          onClose={() => setPreviewingFile(null)}
        />
      )}
    </div>
  );
};
