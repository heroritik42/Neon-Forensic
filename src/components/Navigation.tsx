import React from "react";
import {
  LayoutDashboard,
  Smartphone,
  DownloadCloud,
  FolderTree,
  MessageSquare,
  Database,
  Binary,
  Clock,
  Sparkles,
  Image,
  FileText,
  Link2,
  GitCompare,
} from "lucide-react";

export type NavTab =
  | "DASHBOARD"
  | "DEVICES"
  | "ACQUISITION"
  | "EVIDENCE"
  | "ARTIFACTS"
  | "SQLITE"
  | "HEX_VIEWER"
  | "TIMELINE"
  | "RECOVERY"
  | "MEDIA"
  | "CHAIN_OF_CUSTODY"
  | "REPORTS"
  | "COMPARE";

interface NavigationProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  counts: {
    evidenceFiles: number;
    contacts: number;
    sms: number;
    calls: number;
    apps: number;
    timeline: number;
    carved: number;
  };
}

export const Navigation: React.FC<NavigationProps> = ({
  currentTab,
  onSelectTab,
  counts,
}) => {
  const navItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ElementType;
    badge?: number;
    color?: string;
  }> = [
    { id: "DASHBOARD", label: "Dashboard", icon: LayoutDashboard },
    { id: "DEVICES", label: "Device & ADB", icon: Smartphone },
    { id: "ACQUISITION", label: "Acquisition", icon: DownloadCloud, color: "text-cyan-400" },
    { id: "EVIDENCE", label: "Evidence Files", icon: FolderTree, badge: counts.evidenceFiles },
    { id: "ARTIFACTS", label: "Artifacts (SMS/Calls)", icon: MessageSquare, badge: counts.sms + counts.contacts + counts.calls },
    { id: "SQLITE", label: "SQLite Forensics", icon: Database },
    { id: "HEX_VIEWER", label: "Hex Viewer", icon: Binary },
    { id: "TIMELINE", label: "Timeline Engine", icon: Clock, badge: counts.timeline },
    { id: "RECOVERY", label: "NEON Recover", icon: Sparkles, badge: counts.carved, color: "text-purple-400" },
    { id: "MEDIA", label: "Media & Duplicates", icon: Image },
    { id: "CHAIN_OF_CUSTODY", label: "Chain of Custody", icon: Link2, color: "text-emerald-400" },
    { id: "REPORTS", label: "Reports & Export", icon: FileText },
    { id: "COMPARE", label: "Device Comparison", icon: GitCompare },
  ];

  return (
    <aside className="w-64 shrink-0 bg-[#090d16] border-r border-slate-800/80 flex flex-col justify-between p-3 select-none">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[10px] font-mono-forensic uppercase tracking-wider text-slate-500 font-bold">
          Investigation Modules
        </div>
        <nav className="space-y-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all ${
                  active
                    ? "bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.15)]"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      active ? "text-cyan-400" : item.color || "text-slate-400"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-mono-forensic px-1.5 py-0.2 rounded ${
                      active
                        ? "bg-cyan-500/20 text-cyan-300"
                        : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Forensic Principle Reminder Box */}
      <div className="mt-4 p-3 rounded-md bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 leading-relaxed font-mono-forensic">
        <div className="text-[10px] text-cyan-400 font-bold tracking-wider uppercase mb-1">
          Forensic Integrity
        </div>
        Pristine write-block active. All operations applied on certified working copies.
      </div>
    </aside>
  );
};
