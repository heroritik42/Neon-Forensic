import React, { useState } from "react";
import {
  MessageSquare,
  Users,
  PhoneCall,
  Globe,
  Layers,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldAlert,
} from "lucide-react";
import {
  ContactArtifact,
  SmsArtifact,
  CallLogArtifact,
  BrowserArtifact,
  ApplicationArtifact,
} from "../types/forensics";

interface ArtifactsViewProps {
  contacts: ContactArtifact[];
  sms: SmsArtifact[];
  calls: CallLogArtifact[];
  browsers: BrowserArtifact[];
  apps: ApplicationArtifact[];
}

export const ArtifactsView: React.FC<ArtifactsViewProps> = ({
  contacts,
  sms,
  calls,
  browsers,
  apps,
}) => {
  const [activeSubtab, setActiveSubtab] = useState<"SMS" | "CONTACTS" | "CALLS" | "BROWSER" | "APPS">("SMS");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSms = sms.filter(
    (s) =>
      s.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.recipient.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.phone && c.phone.includes(searchQuery)) ||
      (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredCalls = calls.filter(
    (c) =>
      c.number.includes(searchQuery) ||
      (c.contactName && c.contactName.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredBrowser = browsers.filter(
    (b) =>
      b.url.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.searchTerms && b.searchTerms.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredApps = apps.filter(
    (a) =>
      a.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top Controls: Search + Subtabs */}
      <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 flex flex-wrap items-center justify-between gap-3 font-mono-forensic text-xs">
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 flex-wrap">
          <button
            onClick={() => setActiveSubtab("SMS")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeSubtab === "SMS"
                ? "bg-cyan-600 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            SMS / MMS ({sms.length})
          </button>
          <button
            onClick={() => setActiveSubtab("CONTACTS")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeSubtab === "CONTACTS"
                ? "bg-cyan-600 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            Contacts ({contacts.length})
          </button>
          <button
            onClick={() => setActiveSubtab("CALLS")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeSubtab === "CALLS"
                ? "bg-cyan-600 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            Call Logs ({calls.length})
          </button>
          <button
            onClick={() => setActiveSubtab("BROWSER")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeSubtab === "BROWSER"
                ? "bg-cyan-600 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Browser History ({browsers.length})
          </button>
          <button
            onClick={() => setActiveSubtab("APPS")}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors ${
              activeSubtab === "APPS"
                ? "bg-cyan-600 text-slate-950 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Applications ({apps.length})
          </button>
        </div>

        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Filter ${activeSubtab.toLowerCase()} records...`}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-md text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Subtab 1: SMS / MMS Messages */}
      {activeSubtab === "SMS" && (
        <div className="rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden font-mono-forensic text-xs">
          <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between text-slate-400 font-bold">
            <span>Telephony Message Records (mmssms.db)</span>
            <span className="text-[10px] text-slate-500">{filteredSms.length} messages parsed</span>
          </div>
          <div className="divide-y divide-slate-850 max-h-[580px] overflow-y-auto">
            {filteredSms.map((msg) => (
              <div key={msg.id} className="p-4 hover:bg-slate-900/30 flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    <span
                      className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        msg.direction === "INCOMING"
                          ? "bg-emerald-950/80 text-emerald-300 border border-emerald-800"
                          : "bg-blue-950/80 text-blue-300 border border-blue-800"
                      }`}
                    >
                      {msg.direction === "INCOMING" ? (
                        <ArrowDownLeft className="w-3 h-3" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3" />
                      )}
                      {msg.direction}
                    </span>
                    <span className="text-slate-300 font-bold">
                      {msg.direction === "INCOMING" ? `From: ${msg.sender}` : `To: ${msg.recipient}`}
                    </span>
                    <span className="text-slate-500">| Thread #{msg.threadId}</span>
                  </div>
                  <div className="text-slate-400 flex items-center gap-1.5">
                    <Clock className="w-3 h-3 text-slate-500" />
                    <span>{msg.timestamp.replace("T", " ").replace("Z", "")}</span>
                  </div>
                </div>

                <div className="p-2.5 rounded bg-slate-950 border border-slate-900 text-slate-200 text-xs leading-relaxed">
                  {msg.message}
                </div>
                <div className="text-[10px] text-slate-500 flex justify-between">
                  <span>Source: {msg.sourceDatabase}</span>
                  <span className="text-cyan-400">Status: {msg.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 2: Contacts */}
      {activeSubtab === "CONTACTS" && (
        <div className="rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden font-mono-forensic text-xs">
          <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between text-slate-400 font-bold">
            <span>Contacts &amp; Phonebook Entities (contacts2.db)</span>
            <span className="text-[10px] text-slate-500">{filteredContacts.length} contacts</span>
          </div>
          <div className="divide-y divide-slate-850 max-h-[580px] overflow-y-auto">
            {filteredContacts.map((c) => (
              <div key={c.id} className="p-3.5 hover:bg-slate-900/30 flex items-center justify-between gap-4">
                <div>
                  <div className="text-white font-bold text-sm flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-400" />
                    {c.name}
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 mt-1">
                    <span>Phone: <span className="text-cyan-300">{c.phone || "N/A"}</span></span>
                    <span>Email: <span className="text-slate-300">{c.email || "N/A"}</span></span>
                  </div>
                </div>
                <div className="text-right text-[11px]">
                  <div className="text-slate-300 font-semibold">Contacted {c.timesContacted} times</div>
                  {c.lastContactedTime && (
                    <div className="text-slate-500 mt-0.5">
                      Last: {c.lastContactedTime.replace("T", " ").replace("Z", "")}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 3: Call History */}
      {activeSubtab === "CALLS" && (
        <div className="rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden font-mono-forensic text-xs">
          <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between text-slate-400 font-bold">
            <span>Telephony Call Records (calllog.db)</span>
            <span className="text-[10px] text-slate-500">{filteredCalls.length} logs</span>
          </div>
          <div className="divide-y divide-slate-850 max-h-[580px] overflow-y-auto">
            {filteredCalls.map((call) => (
              <div key={call.id} className="p-3.5 hover:bg-slate-900/30 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      call.callType === "MISSED"
                        ? "bg-rose-950/80 text-rose-400 border border-rose-800"
                        : call.callType === "INCOMING"
                        ? "bg-emerald-950/80 text-emerald-400 border border-emerald-800"
                        : "bg-blue-950/80 text-blue-400 border border-blue-800"
                    }`}
                  >
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-white font-bold flex items-center gap-2">
                      <span>{call.contactName || "Unknown Caller"}</span>
                      <span className="text-cyan-300 font-normal">({call.number})</span>
                    </div>
                    <div className="text-slate-500 text-[11px] mt-0.5">
                      {call.locationTag || "Cellular Network"}
                    </div>
                  </div>
                </div>
                <div className="text-right text-[11px]">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      call.callType === "MISSED"
                        ? "bg-rose-950 text-rose-300"
                        : "bg-slate-900 text-slate-300"
                    }`}
                  >
                    {call.callType} ({call.durationSeconds}s)
                  </span>
                  <div className="text-slate-400 mt-1">
                    {call.timestamp.replace("T", " ").replace("Z", "")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 4: Browser History */}
      {activeSubtab === "BROWSER" && (
        <div className="rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden font-mono-forensic text-xs">
          <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between text-slate-400 font-bold">
            <span>Browser URLs &amp; Search Queries</span>
            <span className="text-[10px] text-slate-500">{filteredBrowser.length} visited sites</span>
          </div>
          <div className="divide-y divide-slate-850 max-h-[580px] overflow-y-auto">
            {filteredBrowser.map((b) => (
              <div key={b.id} className="p-3.5 hover:bg-slate-900/30 flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-white font-bold text-xs">{b.title}</span>
                  <span className="text-slate-500">{b.visitTimestamp.replace("T", " ").replace("Z", "")}</span>
                </div>
                <div className="text-cyan-400 break-all text-[11px] hover:underline cursor-pointer">
                  {b.url}
                </div>
                {b.searchTerms && (
                  <div className="p-1.5 rounded bg-slate-950 border border-slate-900 text-amber-300 text-[11px] flex items-center gap-2">
                    <Search className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Search Query: <span className="font-bold">"{b.searchTerms}"</span></span>
                  </div>
                )}
                <div className="text-[10px] text-slate-500 flex justify-between mt-1">
                  <span>Profile: {b.browserProfile} (Visits: {b.visitCount})</span>
                  <span>Database: {b.sourceDatabase}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Subtab 5: Applications & Security Triage (Section 19) */}
      {activeSubtab === "APPS" && (
        <div className="space-y-4">
          <div className="rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden font-mono-forensic text-xs">
            <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between text-slate-400 font-bold">
              <span>Installed Package Inventory &amp; Suspicious APK Flags</span>
              <span className="text-[10px] text-slate-500">{filteredApps.length} packages parsed</span>
            </div>
            <div className="divide-y divide-slate-850 max-h-[580px] overflow-y-auto">
              {filteredApps.map((app) => (
                <div key={app.packageName} className="p-4 hover:bg-slate-900/30 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-white font-bold text-sm flex items-center gap-2">
                        <Layers className="w-4 h-4 text-amber-400" />
                        {app.appName}
                        <span className="text-slate-500 text-xs font-normal">
                          ({app.packageName} v{app.versionName})
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        UID: {app.uid} | APK Size: {(app.fileSize / 1e6).toFixed(1)} MB | Path: {app.apkPath}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        SHA-256: {app.sha256}
                      </div>
                    </div>

                    {app.suspiciousFindings.length > 0 && (
                      <span className="px-2 py-1 rounded bg-rose-950 border border-rose-800 text-rose-300 font-bold text-[10px] flex items-center gap-1.5 shrink-0 animate-pulse">
                        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                        SUSPICIOUS FINDINGS ({app.suspiciousFindings.length})
                      </span>
                    )}
                  </div>

                  {/* Suspicious Findings Alerts */}
                  {app.suspiciousFindings.length > 0 && (
                    <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/40 space-y-1.5">
                      <div className="text-rose-400 font-bold text-[11px] flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Automated Static Security Triage:
                      </div>
                      {app.suspiciousFindings.map((f, idx) => (
                        <div key={idx} className="text-rose-200 text-xs flex items-start gap-2">
                          <span className="text-rose-400">•</span>
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Permissions Summary */}
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1.5">
                      Granted Manifest Permissions ({app.permissions.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {app.permissions.map((p, idx) => (
                        <span
                          key={idx}
                          className={`text-[10px] px-2 py-0.5 rounded font-mono-forensic ${
                            p.level === "DANGEROUS"
                              ? "bg-amber-950/80 text-amber-300 border border-amber-800"
                              : "bg-slate-900 text-slate-300 border border-slate-800"
                          }`}
                        >
                          {p.permission.replace("android.permission.", "")}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
