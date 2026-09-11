import React from "react";
import {
  Instagram,
  Youtube,
  Linkedin,
  Send,
  ExternalLink
} from "lucide-react";

// X (Twitter) Vector Icon
const XIcon: React.FC<{ className?: string }> = ({ className = "w-3.5 h-3.5" }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

export interface SocialLinkItem {
  id: string;
  name: string;
  handle: string;
  url: string;
  icon: React.ElementType;
  badgeStyle: string;
  activeTextColor: string;
  accentBorder: string;
}

export const SOCIAL_LINKS: SocialLinkItem[] = [
  {
    id: "instagram",
    name: "Instagram",
    handle: "@heroritik42",
    url: "https://instagram.com/heroritik42",
    icon: Instagram,
    badgeStyle:
      "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-pink-500/70 hover:bg-gradient-to-r hover:from-pink-900/40 hover:via-purple-900/30 hover:to-rose-900/40 hover:text-pink-300 hover:shadow-[0_0_15px_rgba(244,63,94,0.35)]",
    activeTextColor: "text-pink-400",
    accentBorder: "border-pink-500/40",
  },
  {
    id: "youtube",
    name: "YouTube",
    handle: "@NoenCoder",
    url: "https://youtube.com/@NoenCoder",
    icon: Youtube,
    badgeStyle:
      "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-red-500/70 hover:bg-gradient-to-r hover:from-red-950/50 hover:via-red-900/30 hover:to-rose-950/40 hover:text-red-300 hover:shadow-[0_0_15px_rgba(239,68,68,0.35)]",
    activeTextColor: "text-red-400",
    accentBorder: "border-red-500/40",
  },
  {
    id: "linkedin",
    name: "LinkedIn",
    handle: "neoncoder",
    url: "https://linkedin.com/in/neoncoder",
    icon: Linkedin,
    badgeStyle:
      "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-blue-500/70 hover:bg-gradient-to-r hover:from-blue-950/50 hover:via-sky-900/30 hover:to-cyan-950/40 hover:text-blue-300 hover:shadow-[0_0_15px_rgba(59,130,246,0.35)]",
    activeTextColor: "text-blue-400",
    accentBorder: "border-blue-500/40",
  },
  {
    id: "telegram",
    name: "Telegram",
    handle: "@heroritik42",
    url: "https://t.me/heroritik42",
    icon: Send,
    badgeStyle:
      "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-cyan-400/70 hover:bg-gradient-to-r hover:from-cyan-950/50 hover:via-teal-900/30 hover:to-sky-950/40 hover:text-cyan-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]",
    activeTextColor: "text-cyan-400",
    accentBorder: "border-cyan-400/40",
  },
  {
    id: "x",
    name: "X (Twitter)",
    handle: "@heroritik42",
    url: "https://x.com/heroritik42",
    icon: XIcon,
    badgeStyle:
      "bg-slate-900/90 text-slate-300 border-slate-800 hover:border-slate-400/70 hover:bg-gradient-to-r hover:from-slate-800/80 hover:via-zinc-800/60 hover:to-neutral-800/80 hover:text-slate-100 hover:shadow-[0_0_15px_rgba(148,163,184,0.3)]",
    activeTextColor: "text-slate-200",
    accentBorder: "border-slate-500/40",
  },
];

interface SocialLinksProps {
  variant?: "header" | "sidebar" | "banner" | "compact";
  className?: string;
}

export const SocialLinks: React.FC<SocialLinksProps> = ({
  variant = "header",
  className = "",
}) => {
  if (variant === "compact") {
    return (
      <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
        {SOCIAL_LINKS.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              title={`${item.name}: ${item.handle}`}
              className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono-forensic font-medium border transition-all duration-200 ${item.badgeStyle}`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">{item.handle}</span>
            </a>
          );
        })}
      </div>
    );
  }

  if (variant === "sidebar") {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center justify-between text-[10px] font-mono-forensic text-slate-400 uppercase tracking-wider font-semibold px-1">
          <span>Author &amp; Socials</span>
          <span className="text-[9px] text-cyan-400 font-normal">@NoenCoder</span>
        </div>
        <div className="flex flex-col gap-1">
          {SOCIAL_LINKS.map((item) => {
            const Icon = item.icon;
            return (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono-forensic border transition-all duration-200 ${item.badgeStyle}`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110" />
                  <span className="text-[11px] font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-1 text-[10px] opacity-70 group-hover:opacity-100">
                  <span>{item.handle}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </div>
              </a>
            );
          })}
        </div>
      </div>
    );
  }

  // Default: Header / Banner variant
  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {SOCIAL_LINKS.map((item) => {
        const Icon = item.icon;
        return (
          <a
            key={item.id}
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            title={`${item.name} — ${item.handle}`}
            className={`group inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono-forensic font-medium border transition-all duration-200 ${item.badgeStyle}`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-115" />
            <span className="text-[11px] tracking-tight">{item.handle}</span>
          </a>
        );
      })}
    </div>
  );
};
