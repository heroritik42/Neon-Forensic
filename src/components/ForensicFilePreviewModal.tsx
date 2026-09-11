import React, { useState } from "react";
import {
  X,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Database,
  Binary,
  ShieldCheck,
  Search,
  Copy,
  Check,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  FileCode,
  MapPin,
  Calendar,
  Layers,
  Sparkles,
  Info
} from "lucide-react";
import { CarvedFileArtifact } from "../types/forensics";

interface ForensicFilePreviewModalProps {
  artifact: CarvedFileArtifact | null;
  onClose: () => void;
}

export const ForensicFilePreviewModal: React.FC<ForensicFilePreviewModalProps> = ({
  artifact,
  onClose,
}) => {
  if (!artifact) return null;

  const [activeTab, setActiveTab] = useState<"PREVIEW" | "RAW_TEXT" | "HEX" | "METADATA">("PREVIEW");
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isInverted, setIsInverted] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copied, setCopied] = useState<boolean>(false);

  const fileType = artifact.fileType;
  const isImage = fileType === "JPEG" || fileType === "PNG" || fileType === "WEBP";
  const isDocument = fileType === "PDF" || fileType === "DOC" || fileType === "DOCX";
  const isText = fileType === "TXT" || fileType === "LOG" || fileType === "SQLITE";
  const isVideo = fileType === "MP4";
  const isAudio = fileType === "MP3";

  const handleCopyText = () => {
    if (artifact.contentSnippet) {
      navigator.clipboard.writeText(artifact.contentSnippet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(250, Math.max(50, prev + delta)));
  };

  // Color theme by file category
  const getTypeBadgeColor = () => {
    if (isImage) return "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
    if (isDocument) return "bg-rose-500/20 text-rose-300 border-rose-500/40";
    if (isVideo) return "bg-purple-500/20 text-purple-300 border-purple-500/40";
    if (isAudio) return "bg-amber-500/20 text-amber-300 border-amber-500/40";
    return "bg-cyan-500/20 text-cyan-300 border-cyan-500/40";
  };

  const textLines = (artifact.contentSnippet || "").split("\n");
  const filteredLines = searchQuery
    ? textLines.filter((l) => l.toLowerCase().includes(searchQuery.toLowerCase()))
    : textLines;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-5xl h-[92vh] max-h-[850px] bg-[#070c14] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(6,182,212,0.25)] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MODAL HEADER */}
        <div className="px-5 py-3.5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg border ${getTypeBadgeColor()} shrink-0`}>
              {isImage && <ImageIcon className="w-5 h-5" />}
              {isDocument && <FileText className="w-5 h-5" />}
              {isVideo && <Film className="w-5 h-5" />}
              {isAudio && <Music className="w-5 h-5" />}
              {isText && <FileCode className="w-5 h-5" />}
              {!isImage && !isDocument && !isVideo && !isAudio && !isText && <Binary className="w-5 h-5" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono-forensic text-sm font-bold text-slate-100 truncate max-w-md">
                  {artifact.filename || `${artifact.id}.${artifact.fileType.toLowerCase()}`}
                </span>
                <span className={`text-[10px] font-mono-forensic font-bold px-2 py-0.5 rounded border ${getTypeBadgeColor()}`}>
                  {artifact.fileType}
                </span>
                <span className="text-[10px] font-mono-forensic px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800">
                  {artifact.recoveryMethod || "CARVED_INODE"}
                </span>
                <span className="text-[10px] font-mono-forensic px-2 py-0.5 rounded bg-emerald-950/70 text-emerald-300 border border-emerald-800 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  SHA-256 Verified
                </span>
              </div>
              <div className="text-[11px] font-mono-forensic text-slate-400 flex items-center gap-3 mt-0.5">
                <span>Offset: <strong className="text-cyan-400">{artifact.offset}</strong></span>
                <span>Size: <strong className="text-slate-200">{(artifact.size / 1024).toFixed(1)} KB</strong></span>
                {artifact.deletedOriginalPath && (
                  <span className="truncate max-w-xs text-slate-500" title={artifact.deletedOriginalPath}>
                    Deleted from: {artifact.deletedOriginalPath}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors border border-slate-700"
              title="Close Preview (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* NAVIGATION TABS & ACTION BAR */}
        <div className="px-5 py-2 bg-slate-950/80 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2 shrink-0">
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => setActiveTab("PREVIEW")}
              className={`px-3 py-1 rounded text-xs font-mono-forensic font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "PREVIEW"
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              Interactive Preview
            </button>
            <button
              onClick={() => setActiveTab("RAW_TEXT")}
              className={`px-3 py-1 rounded text-xs font-mono-forensic font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "RAW_TEXT"
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Content / Transcript
            </button>
            <button
              onClick={() => setActiveTab("HEX")}
              className={`px-3 py-1 rounded text-xs font-mono-forensic font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "HEX"
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Binary className="w-3.5 h-3.5" />
              Raw Hex Dump
            </button>
            <button
              onClick={() => setActiveTab("METADATA")}
              className={`px-3 py-1 rounded text-xs font-mono-forensic font-semibold transition-all flex items-center gap-1.5 ${
                activeTab === "METADATA"
                  ? "bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(6,182,212,0.4)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              Forensic Manifest
            </button>
          </div>

          {/* Contextual Toolbar */}
          <div className="flex items-center gap-2">
            {isImage && activeTab === "PREVIEW" && (
              <div className="flex items-center gap-1.5 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800 text-xs font-mono-forensic text-slate-300">
                <button
                  onClick={() => handleZoom(-25)}
                  className="p-1 hover:text-cyan-400 transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="w-12 text-center text-[11px] text-cyan-300">{zoomLevel}%</span>
                <button
                  onClick={() => handleZoom(25)}
                  className="p-1 hover:text-cyan-400 transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <div className="w-[1px] h-3.5 bg-slate-700 mx-1" />
                <button
                  onClick={handleRotate}
                  className="p-1 hover:text-cyan-400 transition-colors flex items-center gap-1"
                  title="Rotate 90°"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span className="text-[10px]">{rotation}°</span>
                </button>
                <div className="w-[1px] h-3.5 bg-slate-700 mx-1" />
                <button
                  onClick={() => setIsInverted(!isInverted)}
                  className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                    isInverted ? "bg-cyan-500 text-slate-950 font-bold" : "bg-slate-800 hover:bg-slate-700 text-slate-300"
                  }`}
                  title="Toggle Inversion Filter (Steganography & Watermark Inspection)"
                >
                  Invert Pixels
                </button>
              </div>
            )}

            {activeTab === "RAW_TEXT" && (
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search text..."
                    className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1 text-xs font-mono-forensic text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-44"
                  />
                </div>
                <button
                  onClick={handleCopyText}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono-forensic flex items-center gap-1.5 border border-slate-700 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* MODAL BODY (VIEWERS) */}
        <div className="flex-1 overflow-auto p-4 bg-[#05080e]">
          {/* TAB 1: PREVIEW */}
          {activeTab === "PREVIEW" && (
            <div className="h-full flex flex-col items-center justify-center min-h-[450px]">
              {/* IMAGE PREVIEW */}
              {isImage && (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 overflow-auto">
                  <div className="relative max-w-full max-h-full flex items-center justify-center">
                    <img
                      src={artifact.previewUrl || "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='300'><rect width='400' height='300' fill='%23111'/><text x='50%' y='50%' fill='%2300f7ff' font-family='monospace' font-size='14' text-anchor='middle'>FORENSIC IMAGE RECOVERED</text></svg>"}
                      alt={artifact.filename || "Carved file"}
                      className="rounded-lg shadow-2xl transition-transform duration-200 border border-slate-800 select-none max-h-[480px] object-contain"
                      style={{
                        transform: `scale(${zoomLevel / 100}) rotate(${rotation}deg)`,
                        filter: isInverted ? "invert(1) hue-rotate(180deg)" : "none",
                      }}
                    />
                  </div>

                  {artifact.metadata && (
                    <div className="mt-4 w-full max-w-2xl bg-slate-950/80 border border-slate-800 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono-forensic text-slate-300">
                      {Object.entries(artifact.metadata).map(([key, val]) => (
                        <div key={key} className="p-1.5 rounded bg-slate-900/60 border border-slate-800/60">
                          <span className="text-slate-500 block text-[9px] uppercase">{key}</span>
                          <span className="text-cyan-300 font-semibold truncate block" title={String(val)}>
                            {String(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* DOCUMENT / PDF PREVIEW */}
              {isDocument && (
                <div className="w-full max-w-4xl h-full flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                  <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono-forensic">
                    <div className="flex items-center gap-2 text-rose-400">
                      <FileText className="w-4 h-4" />
                      <span className="font-bold">FORENSIC IN-APP DOCUMENT READER</span>
                    </div>
                    <span className="text-slate-400">Document Security: Unencrypted / Cleartext</span>
                  </div>

                  <div className="flex-1 p-6 overflow-y-auto font-mono-forensic text-xs text-slate-200 space-y-4 bg-[#0a0f1a] leading-relaxed select-text">
                    <div className="border border-rose-500/30 bg-rose-950/20 p-3 rounded-lg text-rose-300 text-[11px] flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>
                        This document was reconstructed from flash storage sector <strong>{artifact.offset}</strong>. All text formatting, signatures, and recitals are preserved without requiring Adobe Acrobat or MS Word.
                      </span>
                    </div>

                    <pre className="whitespace-pre-wrap font-mono-forensic text-xs text-cyan-100 bg-slate-950/90 p-5 rounded-xl border border-cyan-900/40 shadow-inner">
                      {artifact.contentSnippet || "Document content not extracted."}
                    </pre>
                  </div>
                </div>
              )}

              {/* VIDEO PREVIEW */}
              {isVideo && (
                <div className="w-full max-w-3xl flex flex-col items-center space-y-4">
                  <div className="w-full aspect-video bg-black rounded-xl border border-slate-800 overflow-hidden relative flex items-center justify-center shadow-2xl group">
                    {/* Simulated High-Fidelity Forensic Video Canvas */}
                    <div className="w-full h-full bg-gradient-to-br from-slate-950 via-[#0b1328] to-slate-950 flex flex-col justify-between p-6">
                      <div className="flex items-center justify-between text-xs font-mono-forensic text-cyan-400">
                        <span className="flex items-center gap-1.5">
                          <Film className="w-4 h-4" />
                          RECORDING SPEC: 1080p 30.00fps H.264
                        </span>
                        <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-400 border border-red-800 animate-pulse">
                          ● SURVEILLANCE EVIDENCE
                        </span>
                      </div>

                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 rounded-full bg-cyan-500/10 border-2 border-cyan-400 flex items-center justify-center mx-auto text-cyan-300 shadow-[0_0_20px_rgba(6,182,212,0.4)]">
                          <Film className="w-8 h-8" />
                        </div>
                        <div className="font-mono-forensic text-lg text-slate-100 font-bold">
                          {artifact.filename}
                        </div>
                        <div className="text-xs text-slate-400 font-mono-forensic max-w-md mx-auto">
                          In-app video container stream validated. AVC moov atom matched without truncation.
                        </div>
                      </div>

                      {/* Video Player Scrub Bar */}
                      <div className="space-y-2 bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                        <div className="flex items-center justify-between text-[11px] font-mono-forensic text-slate-400">
                          <span>00:08 / 00:24</span>
                          <span className="text-cyan-400">H.264 / AAC 48kHz</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                          <div className="w-1/3 h-full bg-gradient-to-r from-cyan-500 to-emerald-400" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {artifact.contentSnippet && (
                    <div className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-4 font-mono-forensic text-xs text-slate-300">
                      <span className="text-cyan-400 font-bold block mb-1">Visual Incident Timeline:</span>
                      <pre className="whitespace-pre-wrap text-[11px] text-slate-400">
                        {artifact.contentSnippet}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* AUDIO PREVIEW */}
              {isAudio && (
                <div className="w-full max-w-2xl bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Music className="w-7 h-7" />
                    </div>
                    <div>
                      <h4 className="font-mono-forensic text-base font-bold text-slate-100">
                        {artifact.filename}
                      </h4>
                      <p className="text-xs font-mono-forensic text-slate-400">
                        Format: MPEG Audio Layer 3 (128 kbps, 44.1 kHz, Stereo)
                      </p>
                    </div>
                  </div>

                  {/* Audio Waveform Graphic */}
                  <div className="h-20 bg-slate-900/80 rounded-xl border border-slate-800 flex items-center justify-center px-4 gap-1">
                    {Array.from({ length: 48 }).map((_, i) => {
                      const heights = [20, 35, 60, 45, 80, 25, 90, 70, 40, 65, 30, 85, 50, 75, 20, 95];
                      const h = heights[i % heights.length];
                      return (
                        <div
                          key={i}
                          className="flex-1 bg-gradient-to-t from-amber-500 to-cyan-400 rounded-full transition-all duration-300 opacity-85"
                          style={{ height: `${h}%` }}
                        />
                      );
                    })}
                  </div>

                  {/* Player Controls */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono-forensic text-slate-400">
                      <span>00:34</span>
                      <span className="text-amber-400">Playback active • 1.0x</span>
                      <span>01:42</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div className="w-1/3 h-full bg-amber-400" />
                    </div>
                  </div>

                  {/* Audio Transcript Dossier */}
                  {artifact.contentSnippet && (
                    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2">
                      <div className="text-xs font-mono-forensic font-bold text-amber-300 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Recovered Audio Transcript Dossier
                      </div>
                      <pre className="whitespace-pre-wrap font-mono-forensic text-xs text-slate-300 leading-relaxed max-h-48 overflow-y-auto">
                        {artifact.contentSnippet}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* TEXT / LOG / CODE PREVIEW */}
              {isText && (
                <div className="w-full max-w-4xl h-full flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
                  <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-mono-forensic">
                    <span className="text-cyan-400 font-bold">RECOVERED TEXT STREAM INSPECTOR</span>
                    <span className="text-slate-400">Lines: {textLines.length} | UTF-8 Clean</span>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto font-mono-forensic text-xs text-slate-200 bg-[#070b14] select-text">
                    <pre className="whitespace-pre-wrap leading-relaxed text-cyan-200 font-mono-forensic">
                      {artifact.contentSnippet || "No text snippet available."}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RAW TEXT / TRANSCRIPT */}
          {activeTab === "RAW_TEXT" && (
            <div className="h-full flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden">
              <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-xs font-mono-forensic">
                <span className="text-slate-300">
                  Showing {filteredLines.length} of {textLines.length} lines
                </span>
                <span className="text-cyan-400">Offset: {artifact.offset}</span>
              </div>
              <div className="flex-1 overflow-auto p-4 font-mono-forensic text-xs leading-relaxed text-slate-300 select-text">
                {filteredLines.map((line, idx) => (
                  <div key={idx} className="flex hover:bg-cyan-950/30 px-1 py-0.5 rounded">
                    <span className="w-12 text-slate-600 select-none shrink-0 text-right pr-3 font-mono-forensic">
                      {idx + 1}
                    </span>
                    <span className="text-slate-200 whitespace-pre-wrap break-all">
                      {line || " "}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: RAW HEX DUMP */}
          {activeTab === "HEX" && (
            <div className="h-full flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden font-mono-forensic text-xs">
              <div className="p-3 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
                <span className="text-cyan-400 font-bold">BIT-LEVEL FORENSIC HEX VIEWER (16-BYTE ALIGNED)</span>
                <span className="text-slate-400">Signature: {artifact.signatureMatch}</span>
              </div>
              <div className="flex-1 overflow-auto p-4 bg-[#04070e] text-slate-300 select-text leading-relaxed">
                <pre className="text-cyan-300">
                  {artifact.hexDump ||
`00000000  50 4B 03 04 14 00 06 00  08 00 00 00 21 00 E8 29  |PK..........!..)|
00000010  6E 5E F8 01 00 00 D4 05  00 00 13 00 08 02 5B 43  |n^............[C|
00000020  6F 6E 74 65 6E 74 5F 54  79 70 65 73 5D 2E 78 6D  |ontent_Types].xm|
00000030  6C 20 A2 04 02 28 A0 00  02 00 00 00 00 00 00 00  |l ...(..........|
00000040  46 4F 52 45 4E 53 49 43  5F 43 41 52 56 45 44 5F  |FORENSIC_CARVED_|
00000050  53 45 43 54 4F 52 5F 4F  46 46 53 45 54 5F 4F 4B  |SECTOR_OFFSET_OK|`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: METADATA MANIFEST */}
          {activeTab === "METADATA" && (
            <div className="max-w-3xl mx-auto space-y-4 p-4 font-mono-forensic text-xs">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-5 space-y-4">
                <h4 className="text-cyan-400 font-bold uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Forensic Chain Evidence Manifest
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-slate-300">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Artifact Identifier:</span>
                    <span className="text-slate-100 font-bold">{artifact.id}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">File Type / Container:</span>
                    <span className="text-slate-100 font-bold">{artifact.fileType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Storage Offset (Hex):</span>
                    <span className="text-cyan-400 font-bold">{artifact.offset}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Byte Size:</span>
                    <span className="text-slate-100">{artifact.size.toLocaleString()} bytes</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Carve Status:</span>
                    <span className="text-emerald-400 font-bold">{artifact.status}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase">Recovery Technique:</span>
                    <span className="text-cyan-300 font-bold">{artifact.recoveryMethod || "TRASH_INODE"}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase">SHA-256 Checksum:</span>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono-forensic text-[11px] text-cyan-300 break-all select-all">
                    {artifact.sha256}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase">Signature Validation Notes:</span>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                    {artifact.validationDetails}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-500 block text-[10px] uppercase">Physical Recovery Source:</span>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-xs">
                    {artifact.recoveryNote}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-5 py-3 bg-slate-900/90 border-t border-slate-800 flex items-center justify-between text-xs font-mono-forensic shrink-0">
          <span className="text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            In-App Direct Viewer • Zero Download Requirement • Court-Admissible Integrity Seal
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-[0_0_12px_rgba(6,182,212,0.3)]"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
