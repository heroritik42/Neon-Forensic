import React, { useState } from "react";
import {
  Download,
  Terminal,
  X,
  Check,
  Copy,
  ExternalLink,
  ShieldCheck,
  FolderArchive,
  HardDrive,
  Cpu,
} from "lucide-react";
import JSZip from "jszip";

interface LinuxDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LinuxDownloadModal: React.FC<LinuxDownloadModalProps> = ({ isOpen, onClose }) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isPackaging, setIsPackaging] = useState(false);

  if (!isOpen) return null;

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleDownloadInstallerScript = () => {
    const scriptContent = `#!/usr/bin/env bash
# NEON FORENSIC - Linux Quick Installer & USB ADB Setup
set -e
echo "[+] Initializing NEON FORENSIC Linux Station..."
sudo apt-get update && sudo apt-get install -y android-tools-adb adb curl wget git libusb-1.0-0-dev || true
echo "[+] Setting up /etc/udev/rules.d/51-android.rules..."
sudo bash -c 'cat << "EOF" > /etc/udev/rules.d/51-android.rules
SUBSYSTEM=="usb", ATTR{idVendor}=="18d1", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="04e8", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="2717", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="22d9", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="22b8", MODE="0666", GROUP="plugdev"
EOF'
sudo groupadd -f plugdev
sudo usermod -aG plugdev "$USER" || true
sudo udevadm control --reload-rules || true
sudo udevadm trigger || true
npm install
npm run build
npm start
`;
    const blob = new Blob([scriptContent], { type: "application/x-sh" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "install-linux.sh";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadFullZip = async () => {
    setIsPackaging(true);
    try {
      const zip = new JSZip();

      // README
      zip.file(
        "README-LINUX.md",
        `# NEON FORENSIC (Linux Edition)
Authorized Android Evidence Acquisition & Analysis Platform

## Quick Start on Linux (Ubuntu, Debian, Kali, Fedora, Arch)

### Option 1: Native Installation
1. Extract this package into your desired forensic folder:
   \`\`\`bash
   cd neon-forensic-linux
   chmod +x install-linux.sh
   ./install-linux.sh
   \`\`\`
2. The script will automatically:
   - Install 'android-tools-adb' and USB communication libraries
   - Configure udev rules (/etc/udev/rules.d/51-android.rules) for non-root ADB access
   - Compile the forensic workstation
   - Create a desktop launcher in ~/.local/share/applications/neon-forensic.desktop
3. Open your browser to: http://localhost:3000

### Option 2: Docker Workstation (with USB Passthrough)
\`\`\`bash
docker-compose up -d
\`\`\`

## System Requirements
- OS: Ubuntu 20.04+, Debian 11+, Kali Linux 2022+, Fedora 38+, or Arch Linux
- Node.js: v20 LTS or newer
- USB: USB 2.0/3.0 port with ADB debugging enabled on the target Android device
`
      );

      // Desktop file
      zip.file(
        "neon-forensic.desktop",
        `[Desktop Entry]
Version=1.0
Type=Application
Name=NEON FORENSIC
Comment=Authorized Android Evidence Acquisition & Analysis Platform
Exec=bash -c "npm start"
Icon=utilities-terminal
Terminal=true
Categories=Development;Security;System;Forensics;
Keywords=Android;Forensics;ADB;Acquisition;Evidence;
StartupNotify=true
`
      );

      // udev rules
      zip.file(
        "51-android.rules",
        `# Android USB Rules for Forensic Workstations
SUBSYSTEM=="usb", ATTR{idVendor}=="18d1", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="04e8", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="2717", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="22d9", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="22b8", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="12d1", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="0fce", MODE="0666", GROUP="plugdev"
SUBSYSTEM=="usb", ATTR{idVendor}=="1004", MODE="0666", GROUP="plugdev"
`
      );

      // Installer script
      zip.file(
        "install-linux.sh",
        `#!/usr/bin/env bash
set -e
echo "Installing NEON FORENSIC dependencies..."
sudo apt-get update && sudo apt-get install -y android-tools-adb adb curl wget git libusb-1.0-0-dev || true
sudo cp 51-android.rules /etc/udev/rules.d/51-android.rules
sudo groupadd -f plugdev
sudo usermod -aG plugdev "$USER" || true
sudo udevadm control --reload-rules || true
sudo udevadm trigger || true
npm install
npm run build
cp neon-forensic.desktop ~/.local/share/applications/ || true
echo "Installation complete! Starting NEON FORENSIC on http://localhost:3000..."
npm start
`
      );

      // Dockerfile
      zip.file(
        "Dockerfile",
        `FROM node:20-slim
WORKDIR /app
RUN apt-get update && apt-get install -y android-tools-adb android-tools-fastboot usbutils udev curl
COPY . .
RUN npm install && npm run build
EXPOSE 3000
CMD ["node", "dist/server.cjs"]
`
      );

      // docker-compose.yml
      zip.file(
        "docker-compose.yml",
        `version: '3.8'
services:
  neon-forensic:
    build: .
    ports:
      - "3000:3000"
    privileged: true
    volumes:
      - /dev/bus/usb:/dev/bus/usb
    environment:
      - NODE_ENV=production
`
      );

      const content = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(content);
      const a = document.createElement("a");
      a.href = url;
      a.download = "neon-forensic-linux-suite.zip";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPackaging(false);
    }
  };

  const codeSnippets = [
    {
      title: "1. Automated Native Linux Installer (Debian / Ubuntu / Kali / Arch)",
      cmd: `git clone <YOUR_REPO_URL> neon-forensic && cd neon-forensic\nchmod +x scripts/install-linux.sh && ./scripts/install-linux.sh`,
    },
    {
      title: "2. Docker Run with Host USB/ADB Passthrough",
      cmd: `docker build -t neon-forensic .\ndocker run -d --privileged -v /dev/bus/usb:/dev/bus/usb -p 3000:3000 --name neon-forensic neon-forensic`,
    },
    {
      title: "3. Direct Production Start (Port 3000)",
      cmd: `npm install && npm run build && npm start`,
    },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 font-mono-forensic text-xs">
      <div className="w-full max-w-3xl bg-[#080d16] border border-cyan-500/50 rounded-xl overflow-hidden shadow-[0_0_35px_rgba(6,182,212,0.25)] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white tracking-wider flex items-center gap-2">
                <span>NEON FORENSIC FOR LINUX</span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">
                  NATIVE &amp; DOCKER
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                Linux Desktop Deployment, USB ADB udev rules &amp; Standalone Packages
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-5 overflow-y-auto">
          {/* Download Buttons Bar */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-cyan-950/50 via-slate-900 to-purple-950/50 border border-cyan-500/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="text-white font-bold text-sm">Download Linux Deployment Package</div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Includes automated setup script, desktop launcher, Dockerfile, and Android udev permissions.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleDownloadFullZip}
                disabled={isPackaging}
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              >
                <FolderArchive className="w-4 h-4" />
                <span>{isPackaging ? "Generating Zip..." : "Download Linux Suite (.zip)"}</span>
              </button>

              <button
                onClick={handleDownloadInstallerScript}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500/50 text-slate-300 text-xs transition-colors"
                title="Download install-linux.sh"
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>.sh Script</span>
              </button>
            </div>
          </div>

          {/* Cloud Live Links */}
          <div className="p-4 rounded-xl bg-[#0c121e] border border-slate-800 space-y-2">
            <div className="text-white font-bold flex items-center justify-between">
              <span>Cloud &amp; Live Deployment Links:</span>
              <span className="text-[10px] text-emerald-400">● LIVE RUNNING</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded bg-slate-950 border border-slate-850 flex items-center justify-between">
                <div className="overflow-hidden">
                  <span className="text-slate-500 text-[10px] block">Live Shared Web App:</span>
                  <a
                    href="https://ais-pre-tt62giw74xh3gkayphycv3-721602695027.asia-east1.run.app"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline truncate block"
                  >
                    https://ais-pre-tt62giw74xh3gkayphycv3-...
                  </a>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-2" />
              </div>

              <div className="p-2.5 rounded bg-slate-950 border border-slate-850 flex items-center justify-between">
                <div className="overflow-hidden">
                  <span className="text-slate-500 text-[10px] block">Development Endpoint:</span>
                  <a
                    href="https://ais-dev-tt62giw74xh3gkayphycv3-721602695027.asia-east1.run.app"
                    target="_blank"
                    rel="noreferrer"
                    className="text-purple-400 hover:underline truncate block"
                  >
                    https://ais-dev-tt62giw74xh3gkayphycv3-...
                  </a>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500 shrink-0 ml-2" />
              </div>
            </div>
            <div className="p-2.5 rounded bg-slate-950/80 border border-slate-900 text-slate-400 text-[11px]">
              <span className="text-cyan-300 font-semibold">Tip for Complete Source Export:</span> You can also export the entire project as a ZIP archive or commit directly to GitHub anytime using the <span className="text-white font-bold">Settings (⚙️) menu &gt; Export to GitHub / Download ZIP</span> at the top of AI Studio.
            </div>
          </div>

          {/* Terminal Command Snippets */}
          <div className="space-y-3">
            <div className="text-white font-bold text-xs uppercase tracking-wider text-slate-400">
              Linux Terminal Quick-Launch Snippets
            </div>
            {codeSnippets.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="text-cyan-400 text-[11px] font-semibold">{item.title}</div>
                <div className="relative p-3 rounded-lg bg-slate-950 border border-slate-850">
                  <pre className="text-slate-200 text-[11px] overflow-x-auto whitespace-pre-wrap font-mono-forensic">
                    {item.cmd}
                  </pre>
                  <button
                    onClick={() => handleCopy(item.cmd, idx)}
                    className="absolute top-2 right-2 p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-400 hover:text-white transition-colors"
                    title="Copy command"
                  >
                    {copiedIndex === idx ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-500">
          <span>Linux Architecture: x86_64, aarch64 / ARM64</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 text-slate-300 hover:text-white"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
