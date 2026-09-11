import React, { useState } from "react";
import {
  Clock,
  Filter,
  Search,
  Download,
  Calendar,
  PhoneCall,
  MessageSquare,
  Globe,
  Image,
  Layers,
  FileText,
} from "lucide-react";
import { TimelineEvent } from "../types/forensics";

interface TimelineViewProps {
  timelineEvents: TimelineEvent[];
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timelineEvents }) => {
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const types = ["ALL", "CALL", "SMS", "BROWSER", "MEDIA", "APPLICATION", "LOG"];

  const filteredEvents = timelineEvents.filter((evt) => {
    const matchesType = selectedType === "ALL" || evt.type === selectedType;
    const matchesSearch =
      evt.eventDescription.toLowerCase().includes(searchQuery.toLowerCase()) ||
      evt.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStart = !startDate || evt.dateTime >= startDate;
    const matchesEnd = !endDate || evt.dateTime <= endDate;
    return matchesType && matchesSearch && matchesStart && matchesEnd;
  });

  const getEventIcon = (type: TimelineEvent["type"]) => {
    switch (type) {
      case "CALL":
        return <PhoneCall className="w-4 h-4 text-pink-400" />;
      case "SMS":
        return <MessageSquare className="w-4 h-4 text-indigo-400" />;
      case "BROWSER":
        return <Globe className="w-4 h-4 text-cyan-400" />;
      case "MEDIA":
        return <Image className="w-4 h-4 text-blue-400" />;
      case "APPLICATION":
        return <Layers className="w-4 h-4 text-amber-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleExportTimeline = () => {
    const headers = "ID,Timestamp,Type,Description,Source,Device\n";
    const rows = filteredEvents
      .map(
        (e) =>
          `"${e.id}","${e.dateTime}","${e.type}","${e.eventDescription.replace(/"/g, '""')}","${e.source}","${e.device}"`
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `forensic_timeline_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 font-mono-forensic text-xs">
      {/* Top Filter Bar */}
      <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 flex-wrap">
          <Filter className="w-3.5 h-3.5 text-slate-500 ml-1.5" />
          {types.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedType(t)}
              className={`px-2.5 py-1 rounded transition-colors ${
                selectedType === t
                  ? "bg-cyan-600 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative min-w-[220px]">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search timeline events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            onClick={handleExportTimeline}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950 text-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Chronological Event Stream */}
      <div className="rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between text-slate-400 font-bold">
          <span>Unified Chronological Event Timeline ({filteredEvents.length} events)</span>
          <span className="text-[10px] text-slate-500">Cross-Artifact Temporal Correlation</span>
        </div>

        <div className="p-4 max-h-[580px] overflow-y-auto space-y-3">
          {filteredEvents.map((evt, idx) => (
            <div
              key={evt.id}
              className="p-3 rounded-lg bg-slate-950/70 border border-slate-850 hover:border-cyan-500/40 transition-colors flex items-start gap-3.5"
            >
              <div className="p-2 rounded bg-slate-900 border border-slate-800 shrink-0 mt-0.5">
                {getEventIcon(evt.type)}
              </div>

              <div className="flex-1 overflow-hidden">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold uppercase">
                      {evt.type}
                    </span>
                    <span className="text-cyan-400 font-bold">
                      {evt.dateTime.replace("T", " ").replace("Z", " UTC")}
                    </span>
                  </div>
                  <span className="text-slate-500 text-[10px]">
                    Device: {evt.device}
                  </span>
                </div>

                <div className="text-slate-200 text-xs font-medium">
                  {evt.eventDescription}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 pt-1 border-t border-slate-900">
                  <span>Source Artifact: <span className="text-slate-400">{evt.source}</span></span>
                  {evt.evidenceFile && (
                    <span>Linked Evidence: <span className="text-cyan-400">{evt.evidenceFile}</span></span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
