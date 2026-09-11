import React, { useState } from "react";
import { Brain, X, Send, Sparkles, AlertTriangle, ShieldCheck, RefreshCw, FileText } from "lucide-react";
import { ForensicCase, AndroidDevice, ApplicationArtifact, EvidenceFile, TimelineEvent } from "../types/forensics";

interface AiForensicModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCase: ForensicCase;
  device: AndroidDevice;
  apps: ApplicationArtifact[];
  evidenceFiles: EvidenceFile[];
  timeline: TimelineEvent[];
}

export const AiForensicModal: React.FC<AiForensicModalProps> = ({
  isOpen,
  onClose,
  currentCase,
  device,
  apps,
  evidenceFiles,
  timeline,
}) => {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; text: string; thoughts?: string }>>([
    {
      role: "assistant",
      text: `Hello Investigator. I am the NEON FORENSIC Intelligence Engine powered by Gemini 3.1 Pro with High Thinking mode. 

I am connected to the live case database **${currentCase.id}** (${device.serial !== "NO_DEVICE" ? `${device.manufacturer} ${device.model}` : "Awaiting Target Device"}). I have direct read access to current evidence files, SQLite stores, installed APKs, and timeline events.

How can I assist your investigation today?`,
    },
  ]);

  if (!isOpen) return null;

  const quickPrompts = [
    "Diagnose USB / ADB connection issues on Linux or Android",
    "Analyze installed packages for dangerous permissions & suspicious C2 endpoints",
    "Identify timeline anomalies and suspicious exfiltration patterns",
    "Draft a court-admissible executive forensic report for this case",
  ];

  const handleSend = async (userText: string) => {
    const textToSend = userText || query;
    if (!textToSend.trim() || isLoading) return;

    setMessages((prev) => [...prev, { role: "user", text: textToSend }]);
    setQuery("");
    setIsLoading(true);

    try {
      const response = await fetch("/api/gemini/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          query: textToSend,
          prompt: textToSend,
          caseMetadata: {
            id: currentCase.id,
            name: currentCase.name,
            investigator: currentCase.investigator,
            device: `${device.manufacturer} ${device.model} (Android ${device.androidVersion})`,
            serial: device.serial,
            encryption: device.storage.encryptionType,
            rootStatus: device.rootStatus,
          },
          artifactContext: {
            appsCount: apps.length,
            sampleApps: apps.slice(0, 15),
            evidenceFilesCount: evidenceFiles.length,
            timelineSample: timeline.slice(0, 10),
          },
        }),
      });

      const data = await response.json();
      if (data.analysis) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: data.analysis,
            thoughts: data.thinkingLevel ? `Engine Model: ${data.source} (Thinking: ${data.thinkingLevel})` : undefined,
          },
        ]);
      } else {
        throw new Error(data.error || "Analysis failed");
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: `Analysis error: ${err.message || "Failed to reach intelligence backend"}. Please verify server status.`,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono-forensic text-xs">
      <div className="w-full max-w-4xl h-[640px] bg-[#07090e] border border-purple-500/50 rounded-xl flex flex-col shadow-[0_0_35px_rgba(168,85,247,0.25)] overflow-hidden">
        {/* Title Bar */}
        <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1 rounded bg-purple-950 text-purple-400 border border-purple-800">
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-white tracking-wider">
                FORENSIC AI ASSISTANT &amp; DIAGNOSTICS
              </span>
              <span className="ml-2 text-[10px] text-purple-300 px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-700/50">
                GEMINI 3.1 PRO (HIGH REASONING)
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Prompts */}
        <div className="px-4 py-2 bg-slate-950 border-b border-slate-800 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider shrink-0">
            Suggested:
          </span>
          {quickPrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(p)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded bg-slate-900 hover:bg-purple-950/50 text-[11px] text-purple-200 border border-slate-800 hover:border-purple-500/50 transition-colors shrink-0 disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Chat Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#07090e]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col ${
                m.role === "user" ? "items-end" : "items-start"
              }`}
            >
              <div
                className={`max-w-[88%] p-4 rounded-xl leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-purple-950/60 border border-purple-500/40 text-purple-100"
                    : "bg-slate-900/90 border border-slate-800 text-slate-200"
                }`}
              >
                {m.thoughts && (
                  <div className="mb-2.5 pb-2 border-b border-slate-800 flex items-center gap-2 text-[10px] text-purple-400 font-bold uppercase">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{m.thoughts}</span>
                  </div>
                )}
                {m.text}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-purple-400 p-3 rounded-lg bg-slate-950/60 border border-purple-900/40 w-fit">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Analyzing case database &amp; hardware telemetry with High Thinking...</span>
            </div>
          )}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(query);
          }}
          className="p-3 bg-slate-950 border-t border-slate-800 flex gap-2"
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask AI Copilot regarding ADB commands, APK permissions, or case findings..."
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-500 font-mono-forensic text-xs focus:outline-none focus:border-purple-500/60"
          />
          <button
            type="submit"
            disabled={!query.trim() || isLoading}
            className="px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-bold flex items-center gap-1.5 transition-colors font-mono-forensic text-xs"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
