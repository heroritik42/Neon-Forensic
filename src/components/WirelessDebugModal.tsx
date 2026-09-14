import React, { useState, useEffect } from "react";
import {
  Wifi,
  QrCode,
  Smartphone,
  CheckCircle2,
  AlertTriangle,
  X,
  RefreshCw,
  Copy,
  Check,
  Shield,
  Unplug,
  Radio,
  ExternalLink,
  ChevronRight,
  Terminal
} from "lucide-react";
import QRCode from "qrcode";

interface WirelessDebugModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeviceConnected?: () => void;
}

export const WirelessDebugModal: React.FC<WirelessDebugModalProps> = ({
  isOpen,
  onClose,
  onDeviceConnected,
}) => {
  const [mode, setMode] = useState<"QR_PAIR" | "CODE_PAIR" | "DIRECT_IP">("CODE_PAIR");

  // Code Pairing fields (Android 11+)
  const [pairIp, setPairIp] = useState("192.168.1.");
  const [pairPort, setPairPort] = useState("37000");
  const [connectPortVal, setConnectPortVal] = useState("");
  const [pairCode, setPairCode] = useState("");
  const [isScanningMdns, setIsScanningMdns] = useState(false);
  const [discoveredMdnsList, setDiscoveredMdnsList] = useState<Array<{ ip: string; port: number; service: string; raw: string }>>([]);

  // Direct IP connect fields
  const [connectIp, setConnectIp] = useState("192.168.1.");
  const [connectPort, setConnectPort] = useState("5555");

  // State & Feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error" | "info"; text: string } | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string>("");
  const [copiedText, setCopiedText] = useState(false);

  // QR Code Data URL state
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [pairingPassword, setPairingPassword] = useState("neonforensic");
  const [pairingServiceName, setPairingServiceName] = useState("NEON-ADB-WS");

  // Generate QR code for Wireless Debugging
  useEffect(() => {
    async function generateQr() {
      try {
        // Standard Android 11+ ADB pairing QR payload format:
        // WIFI:T:ADB;S:<service_name>;P:<password>;;
        const payload = `WIFI:T:ADB;S:${pairingServiceName};P:${pairingPassword};;`;
        const url = await QRCode.toDataURL(payload, {
          width: 260,
          margin: 1.5,
          color: {
            dark: "#080c14",
            light: "#22d3ee",
          },
        });
        setQrDataUrl(url);
      } catch (err) {
        console.error("QR Code generation error:", err);
      }
    }
    generateQr();
  }, [pairingServiceName, pairingPassword]);

  if (!isOpen) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  // 1. Submit Pair with 6-digit Code
  const handlePairWithCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pairIp.trim() || !pairPort.trim() || !pairCode.trim()) {
      setStatusMessage({ type: "error", text: "Please enter Target IP, Pairing Port, and 6-digit pairing code." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage({ type: "info", text: `Pairing with ${pairIp}:${pairPort} using code ${pairCode}...` });
    setConsoleOutput("");

    try {
      const res = await fetch("/api/devices/wireless/pair", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: pairIp.trim(),
          pairingPort: pairPort.trim(),
          connectPort: connectPortVal.trim() || undefined,
          code: pairCode.trim(),
        }),
      });
      const data = await res.json();
      setConsoleOutput(data.output || JSON.stringify(data, null, 2));

      if (data.success) {
        setStatusMessage({
          type: "success",
          text: `Successfully paired & connected to ${data.endpoint || pairIp}! Device is now fully active in the application.`,
        });
        if (onDeviceConnected) onDeviceConnected();
      } else {
        setStatusMessage({
          type: "error",
          text: `Pairing result: ${data.output || data.error || "Device refused connection. Check if IP/Port changed on phone."}`,
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Failed to reach workstation ADB server." });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Discover devices on Wi-Fi via mDNS
  const handleDiscoverMdns = async () => {
    setIsScanningMdns(true);
    setStatusMessage({ type: "info", text: "Querying ADB mDNS services on local network..." });
    try {
      const res = await fetch("/api/devices/mdns");
      const data = await res.json();
      if (data.services && Array.isArray(data.services) && data.services.length > 0) {
        setDiscoveredMdnsList(data.services);
        const first = data.services[0];
        setPairIp(first.ip);
        setConnectIp(first.ip);
        if (first.service === "TLS_CONNECT") {
          setConnectPortVal(String(first.port));
          setConnectPort(String(first.port));
        } else if (first.service === "TLS_PAIRING") {
          setPairPort(String(first.port));
        }
        setStatusMessage({
          type: "success",
          text: `Discovered Android wireless target at ${first.ip}:${first.port} (${first.service})! Auto-filled fields.`
        });
      } else {
        setStatusMessage({
          type: "info",
          text: "No mDNS broadcast detected yet. Ensure Wireless Debugging is toggled ON on your phone."
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: "mDNS query failed: " + err.message });
    } finally {
      setIsScanningMdns(false);
    }
  };

  // 1-Click Sync with devices already paired or connected in Kali Terminal
  const handleSyncKaliTerminal = async () => {
    setIsSubmitting(true);
    setStatusMessage({ type: "info", text: "Syncing with Kali Linux ADB daemon and refreshing endpoints..." });
    try {
      const res = await fetch("/api/devices/kali-sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setConsoleOutput(data.logs?.join("\n") || "Synced with Kali ADB bridge.");
      if (data.devices && data.devices.length > 0) {
        setStatusMessage({
          type: "success",
          text: `Found and synchronized ${data.devices.length} active device(s) from Kali Linux host! Linked successfully.`
        });
        if (onDeviceConnected) onDeviceConnected();
      } else {
        setStatusMessage({
          type: "info",
          text: "Host ADB synchronized. If you ran 'adb pair' in terminal, run 'adb connect <IP>:<PORT>' in terminal or connect tab."
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Direct IP:PORT connect (e.g. port 5555)
  const handleDirectConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!connectIp.trim() || !connectPort.trim()) {
      setStatusMessage({ type: "error", text: "Please provide target IP address and port." });
      return;
    }

    setIsSubmitting(true);
    setStatusMessage({ type: "info", text: `Connecting ADB daemon to ${connectIp}:${connectPort}...` });
    setConsoleOutput("");

    try {
      const res = await fetch("/api/devices/wireless/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ip: connectIp.trim(),
          port: connectPort.trim(),
        }),
      });
      const data = await res.json();
      setConsoleOutput(data.output || JSON.stringify(data, null, 2));

      if (data.success) {
        setStatusMessage({
          type: "success",
          text: `Connected to ${connectIp}:${connectPort} over Wi-Fi successfully!`,
        });
        if (onDeviceConnected) onDeviceConnected();
      } else {
        setStatusMessage({
          type: "error",
          text: `Connection failed: ${data.output || data.error || "Ensure phone and workstation are on the same Wi-Fi."}`,
        });
      }
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Workstation network error." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#0b101b] border border-cyan-500/40 rounded-xl w-full max-w-2xl shadow-[0_0_40px_rgba(6,182,212,0.25)] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/20 bg-gradient-to-r from-cyan-950/40 via-slate-900 to-purple-950/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_12px_rgba(6,182,212,0.3)]">
              <Wifi className="w-5 h-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono-forensic">
                  WIRELESS ADB DEBUGGING &amp; PAIRING
                </h3>
                <span className="text-[10px] font-mono-forensic uppercase font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Android 11+ Wi-Fi
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                Connect target Android device without physical USB cable using secure TLS pairing
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/60 px-4 pt-2 gap-2">
          <button
            onClick={() => {
              setMode("CODE_PAIR");
              setStatusMessage(null);
            }}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-mono-forensic font-semibold rounded-t-md border-t border-x transition-all ${
              mode === "CODE_PAIR"
                ? "bg-[#0b101b] border-cyan-500/50 text-cyan-300 border-b-transparent -mb-[1px] shadow-[0_-2px_10px_rgba(6,182,212,0.15)]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>Pair with 6-Digit Code</span>
          </button>

          <button
            onClick={() => {
              setMode("QR_PAIR");
              setStatusMessage(null);
            }}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-mono-forensic font-semibold rounded-t-md border-t border-x transition-all ${
              mode === "QR_PAIR"
                ? "bg-[#0b101b] border-cyan-500/50 text-cyan-300 border-b-transparent -mb-[1px] shadow-[0_-2px_10px_rgba(6,182,212,0.15)]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>QR Code Pairing (Camera)</span>
          </button>

          <button
            onClick={() => {
              setMode("DIRECT_IP");
              setStatusMessage(null);
            }}
            className={`flex items-center gap-2 px-3 py-2 text-xs font-mono-forensic font-semibold rounded-t-md border-t border-x transition-all ${
              mode === "DIRECT_IP"
                ? "bg-[#0b101b] border-cyan-500/50 text-cyan-300 border-b-transparent -mb-[1px] shadow-[0_-2px_10px_rgba(6,182,212,0.15)]"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wifi className="w-3.5 h-3.5" />
            <span>Direct IP:Port Connect</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 font-sans">
          {/* Instructions Banner */}
          <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="text-[11px] font-mono-forensic uppercase font-bold text-cyan-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              <span>Android Phone Preparation Checklist:</span>
            </div>
            <ol className="list-decimal list-inside space-y-0.5 text-slate-400 text-[11px] leading-relaxed">
              <li>Connect target phone to the <strong className="text-slate-200">same Wi-Fi network</strong> as your Kali/Linux workstation.</li>
              <li>Open phone <strong className="text-slate-200">Settings &gt; Developer Options</strong>.</li>
              <li>Toggle <strong className="text-slate-200">Wireless Debugging</strong> to <span className="text-emerald-400 font-semibold">ON</span>.</li>
              <li>Tap <strong className="text-slate-200">&quot;Pair device with pairing code&quot;</strong> or <strong className="text-slate-200">&quot;Pair device with QR code&quot;</strong>.</li>
            </ol>
          </div>

          {/* TAB 1: CODE PAIRING */}
          {mode === "CODE_PAIR" && (
            <div className="space-y-4">
              {/* Quick Action Tools */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] font-mono-forensic text-slate-400">Quick Tools:</span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDiscoverMdns}
                    disabled={isScanningMdns}
                    className="px-2.5 py-1 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono-forensic hover:bg-cyan-900 flex items-center gap-1 transition-all"
                  >
                    <RefreshCw className={`w-3 h-3 ${isScanningMdns ? "animate-spin text-cyan-400" : ""}`} />
                    <span>Auto-Detect Wi-Fi (mDNS)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSyncKaliTerminal}
                    disabled={isSubmitting}
                    className="px-2.5 py-1 rounded bg-purple-950 border border-purple-500/40 text-purple-300 text-[11px] font-mono-forensic hover:bg-purple-900 flex items-center gap-1 transition-all"
                  >
                    <Terminal className="w-3 h-3" />
                    <span>Sync with Kali Terminal ADB</span>
                  </button>
                </div>
              </div>

              {discoveredMdnsList.length > 0 && (
                <div className="p-2 rounded bg-cyan-950/40 border border-cyan-500/30 text-xs">
                  <span className="text-cyan-400 font-mono-forensic text-[11px] font-bold">Detected Services: </span>
                  {discoveredMdnsList.map((srv, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setPairIp(srv.ip);
                        setConnectIp(srv.ip);
                        if (srv.service === "TLS_CONNECT") {
                          setConnectPortVal(String(srv.port));
                          setConnectPort(String(srv.port));
                        } else {
                          setPairPort(String(srv.port));
                        }
                      }}
                      className="inline-block m-1 px-2 py-0.5 rounded bg-cyan-900/60 hover:bg-cyan-800 text-cyan-200 font-mono-forensic text-[10px]"
                    >
                      {srv.ip}:{srv.port} ({srv.service})
                    </button>
                  ))}
                </div>
              )}

              <form onSubmit={handlePairWithCode} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-1">
                    <label className="block text-[11px] font-mono-forensic text-slate-400 uppercase tracking-wider mb-1">
                      Phone IP Address
                    </label>
                    <input
                      type="text"
                      value={pairIp}
                      onChange={(e) => setPairIp(e.target.value)}
                      placeholder="e.g. 192.168.1.104"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono-forensic text-xs focus:outline-none focus:border-cyan-400"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono-forensic text-slate-400 uppercase tracking-wider mb-1">
                      Pairing Port (Popup)
                    </label>
                    <input
                      type="text"
                      value={pairPort}
                      onChange={(e) => setPairPort(e.target.value)}
                      placeholder="e.g. 37829"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono-forensic text-xs focus:outline-none focus:border-cyan-400"
                      required
                    />
                    <span className="text-[10px] text-slate-500 font-mono-forensic">From "Pair with code" popup</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono-forensic text-slate-400 uppercase tracking-wider mb-1">
                      Connect Port (Optional)
                    </label>
                    <input
                      type="text"
                      value={connectPortVal}
                      onChange={(e) => setConnectPortVal(e.target.value)}
                      placeholder="e.g. 41029 (from main Wi-Fi screen)"
                      className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono-forensic text-xs focus:outline-none focus:border-cyan-400"
                    />
                    <span className="text-[10px] text-slate-500 font-mono-forensic">Auto-detected if empty</span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-mono-forensic text-slate-400 uppercase tracking-wider mb-1">
                    6-Digit Wi-Fi Pairing Code (shown on phone dialog)
                  </label>
                  <input
                    type="text"
                    value={pairCode}
                    onChange={(e) => setPairCode(e.target.value)}
                    placeholder="e.g. 849201"
                    maxLength={6}
                    className="w-full px-3 py-2.5 rounded-lg bg-slate-950 border border-cyan-500/50 text-cyan-300 font-mono-forensic text-base tracking-widest text-center font-bold focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div className="text-[11px] text-slate-500 font-mono-forensic">
                    Executes: <code>adb pair {pairIp || "IP"}:{pairPort || "PORT"} {pairCode || "CODE"}</code>
                  </div>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 text-slate-950 font-mono-forensic font-bold text-xs hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>PAIRING &amp; CONNECTING...</span>
                      </>
                    ) : (
                      <>
                        <Wifi className="w-3.5 h-3.5" />
                        <span>PAIR &amp; CONNECT DEVICE</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB 2: QR CODE PAIRING */}
          {mode === "QR_PAIR" && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-center gap-6 p-4 rounded-xl bg-slate-950/80 border border-cyan-500/30">
                {/* QR Code Container */}
                <div className="p-3 bg-[#080c14] border border-cyan-400/40 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.3)] flex flex-col items-center shrink-0">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Wireless ADB Pairing QR"
                      className="w-48 h-48 rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-cyan-400 font-mono-forensic text-xs">
                      Generating QR...
                    </div>
                  )}
                  <span className="text-[10px] font-mono-forensic text-cyan-300 mt-2 font-bold tracking-wider">
                    SCAN WITH ANDROID PHONE
                  </span>
                </div>

                {/* Instructions on right */}
                <div className="space-y-2.5 text-xs text-slate-300">
                  <h4 className="font-bold text-white font-mono-forensic text-sm flex items-center gap-2">
                    <QrCode className="w-4 h-4 text-cyan-400" />
                    How to Scan with Target Device:
                  </h4>
                  <p className="text-slate-400 text-xs">
                    In your Android phone, go to:
                  </p>
                  <div className="p-2.5 rounded bg-slate-900 border border-slate-800 font-mono-forensic text-[11px] text-cyan-300 space-y-1">
                    <div>Settings &gt; Developer options</div>
                    <div className="text-slate-400">&gt; Wireless debugging</div>
                    <div className="text-emerald-400 font-semibold">&gt; Pair device with QR code</div>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Point your phone camera at this QR code. The phone will instantly recognize the workstation and negotiate an encrypted TLS adb session.
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setPairingPassword("neon_" + Math.random().toString(36).substring(2, 8));
                      }}
                      className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono-forensic underline"
                    >
                      Regenerate Pairing Key
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: DIRECT IP:PORT CONNECT */}
          {mode === "DIRECT_IP" && (
            <form onSubmit={handleDirectConnect} className="space-y-3.5">
              <p className="text-xs text-slate-400">
                Use this option if your target phone is already paired, or running Android 10 and below with TCP/IP port 5555 activated.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-mono-forensic text-slate-400 uppercase tracking-wider mb-1">
                    Target Phone IP
                  </label>
                  <input
                    type="text"
                    value={connectIp}
                    onChange={(e) => setConnectIp(e.target.value)}
                    placeholder="e.g. 192.168.1.104"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono-forensic text-xs focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono-forensic text-slate-400 uppercase tracking-wider mb-1">
                    Port
                  </label>
                  <input
                    type="text"
                    value={connectPort}
                    onChange={(e) => setConnectPort(e.target.value)}
                    placeholder="5555"
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-100 font-mono-forensic text-xs focus:outline-none focus:border-cyan-400"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[11px] text-slate-500 font-mono-forensic">
                  Executes: <code>adb connect {connectIp || "IP"}:{connectPort || "5555"}</code>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 text-slate-950 font-mono-forensic font-bold text-xs hover:bg-cyan-400 transition-all shadow-[0_0_15px_rgba(6,182,212,0.4)] disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>CONNECTING...</span>
                    </>
                  ) : (
                    <>
                      <Wifi className="w-3.5 h-3.5" />
                      <span>CONNECT TO TARGET IP</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                statusMessage.type === "success"
                  ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300"
                  : statusMessage.type === "error"
                  ? "bg-rose-950/50 border-rose-500/50 text-rose-300"
                  : "bg-cyan-950/40 border-cyan-500/40 text-cyan-300"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div className="flex-1 font-mono-forensic text-[11px] leading-relaxed">
                {statusMessage.text}
              </div>
            </div>
          )}

          {/* Console Command Log Snippet */}
          {consoleOutput && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[10px] font-mono-forensic text-slate-500 uppercase tracking-wider">
                <span>ADB Daemon Terminal Response:</span>
                <button
                  onClick={() => copyToClipboard(consoleOutput)}
                  className="hover:text-cyan-400 flex items-center gap-1"
                >
                  {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedText ? "Copied" : "Copy"}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono-forensic text-slate-300 overflow-x-auto max-h-28">
                {consoleOutput}
              </pre>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800/80 bg-slate-950/70 flex items-center justify-between text-xs font-mono-forensic text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <span>Wi-Fi Discovery Daemon Listening</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
