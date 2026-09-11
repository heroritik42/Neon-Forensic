import React, { useState } from "react";
import {
  Image,
  MapPin,
  Camera,
  Copy,
  Sliders,
  CheckCircle2,
  FileCheck,
  Compass,
} from "lucide-react";
import { MediaArtifact, DuplicateDetectionItem } from "../types/forensics";

interface MediaViewProps {
  media: MediaArtifact[];
  duplicates: DuplicateDetectionItem[];
}

export const MediaView: React.FC<MediaViewProps> = ({ media, duplicates }) => {
  const [selectedMedia, setSelectedMedia] = useState<MediaArtifact>(media[0] || null);
  const [activeTab, setActiveTab] = useState<"MEDIA_GALLERY" | "DUPLICATES">("MEDIA_GALLERY");

  return (
    <div className="space-y-4 font-mono-forensic text-xs">
      {/* Top Bar: Tabs */}
      <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("MEDIA_GALLERY")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "MEDIA_GALLERY"
                ? "bg-cyan-600 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Image className="w-3.5 h-3.5" />
            Media &amp; EXIF Forensics ({media.length})
          </button>
          <button
            onClick={() => setActiveTab("DUPLICATES")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeTab === "DUPLICATES"
                ? "bg-cyan-600 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Copy className="w-3.5 h-3.5" />
            Duplicate Detection ({duplicates.length})
          </button>
        </div>
      </div>

      {activeTab === "MEDIA_GALLERY" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Gallery List (7 cols) */}
          <div className="lg:col-span-7 rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden">
            <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between text-slate-400 font-bold">
              <span>Acquired Media Artifacts ({media.length})</span>
              <span className="text-[10px] text-slate-500">EXIF / GPS Tag Extracted</span>
            </div>

            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[560px] overflow-y-auto">
              {media.map((item) => {
                const isSelected = selectedMedia?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedMedia(item)}
                    className={`p-3 rounded-lg border cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? "bg-cyan-950/40 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.2)]"
                        : "bg-slate-950 border-slate-850 hover:border-slate-700"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-10 h-10 rounded bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                        <Image className="w-5 h-5" />
                      </div>
                      <div className="overflow-hidden">
                        <div className="text-white font-bold truncate text-xs">
                          {item.filename}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {item.dimensions}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1 text-[10px] text-slate-400 border-t border-slate-900 pt-2">
                      <div>Camera: {item.cameraModel || "N/A"}</div>
                      {item.gps && (
                        <div className="text-emerald-400 flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          GPS: {item.gps.latitude.toFixed(4)}, {item.gps.longitude.toFixed(4)}
                        </div>
                      )}
                      <div>Captured: {item.createdTime.replace("T", " ").replace("Z", "")}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Media Inspector (5 cols) */}
          <div className="lg:col-span-5 rounded-xl bg-[#090d16] border border-slate-800 p-4 space-y-4">
            {selectedMedia ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider">
                    <Camera className="w-4 h-4" />
                    EXIF Metadata Inspector
                  </div>
                  <span className="text-slate-500 text-[10px]">{selectedMedia.id}</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="text-slate-500 text-[10px]">Source Path:</span>
                    <div className="text-slate-200 text-[11px] break-all">{selectedMedia.path}</div>
                  </div>

                  {/* GPS Coordinates Box */}
                  {selectedMedia.gps ? (
                    <div className="p-3 rounded-lg bg-emerald-950/30 border border-emerald-500/30 space-y-1.5">
                      <div className="text-emerald-300 font-bold flex items-center gap-1.5 text-[11px]">
                        <Compass className="w-3.5 h-3.5" />
                        Geolocation (GPS EXIF)
                      </div>
                      <div className="text-slate-200 text-xs">
                        Coordinates: <span className="text-emerald-400 font-bold">{selectedMedia.gps.latitude}, {selectedMedia.gps.longitude}</span>
                      </div>
                      {selectedMedia.gps.addressDescription && (
                        <div className="text-slate-400 text-[11px]">
                          Location: {selectedMedia.gps.addressDescription}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-500">
                        Altitude: {selectedMedia.gps.altitude} meters
                      </div>
                    </div>
                  ) : (
                    <div className="p-2.5 rounded bg-slate-950 text-slate-500 text-[11px]">
                      No GPS location tags embedded in image.
                    </div>
                  )}

                  {/* EXIF Key-Values */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1">
                      Camera Properties:
                    </span>
                    <div className="bg-slate-950 p-2 rounded border border-slate-900 space-y-1">
                      {Object.entries(selectedMedia.exif).map(([key, val]) => (
                        <div key={key} className="flex justify-between text-[11px] py-0.5 border-b border-slate-900">
                          <span className="text-slate-500">{key}:</span>
                          <span className="text-slate-300 font-semibold">{val}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Perceptual & Cryptographic Hashes */}
                  <div className="bg-slate-950 p-2.5 rounded border border-slate-900 space-y-1.5">
                    <div>
                      <span className="text-slate-500 text-[10px]">Perceptual Hash (pHash):</span>
                      <div className="text-purple-300 text-[11px]">{selectedMedia.perceptualHash}</div>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px]">SHA-256 Hash:</span>
                      <div className="text-slate-300 text-[10px] break-all select-all">
                        {selectedMedia.sha256}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-slate-500">
                Select a media file to inspect EXIF metadata
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Duplicate Detection (Section 22) */}
      {activeTab === "DUPLICATES" && (
        <div className="rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden">
          <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between text-slate-400 font-bold">
            <span>Cryptographic &amp; Perceptual Duplicate Detection</span>
            <span className="text-[10px] text-slate-500">{duplicates.length} duplicate pairs</span>
          </div>

          <div className="divide-y divide-slate-850 max-h-[500px] overflow-y-auto">
            {duplicates.map((dup) => (
              <div key={dup.id} className="p-4 hover:bg-slate-900/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold text-[10px]">
                    {dup.similarityType === "EXACT_SHA256"
                      ? "100% BIT-FOR-BIT EXACT DUPLICATE (SHA-256)"
                      : `PERCEPTUAL SIMILARITY (${dup.similarityScore}%)`}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    Size: {(dup.size / 1e3).toFixed(1)} KB
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-900">
                    <span className="text-slate-500 text-[10px] block mb-1">Original Evidence File:</span>
                    <div className="text-slate-200 font-semibold break-all">{dup.originalPath}</div>
                  </div>
                  <div className="p-2.5 rounded bg-slate-950 border border-slate-900">
                    <span className="text-slate-500 text-[10px] block mb-1">Detected Duplicate / Resized:</span>
                    <div className="text-cyan-300 font-semibold break-all">{dup.duplicatePath}</div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-500">
                  SHA-256: {dup.sha256}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
