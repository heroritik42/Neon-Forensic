import React, { useState, useEffect, useRef } from "react";
import {
  Smartphone,
  RotateCcw,
  Power,
  Volume2,
  Volume1,
  Sun,
  Lock,
  Camera,
  Bell,
  BellOff,
  CornerDownLeft,
  Delete,
  Send,
  Sliders,
  Settings,
  Globe,
  Phone,
  FileText,
  Play,
  RefreshCw,
  Eye,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Wifi,
  ExternalLink,
  Keyboard,
  MousePointer,
  Sparkles
} from "lucide-react";
import { AndroidDevice } from "../types/forensics";

interface RemoteControlViewProps {
  device: AndroidDevice;
  onRefreshDevices?: () => void;
  onOpenWirelessModal?: () => void;
}

export const RemoteControlView: React.FC<RemoteControlViewProps> = ({
  device,
  onRefreshDevices,
  onOpenWirelessModal,
}) => {
  // Device resolution state
  const [resolution, setResolution] = useState<{ width: number; height: number; density: number }>({
    width: 1080,
    height: 2400,
    density: 420,
  });

  // Screen refresh & capture state
  const [autoRefreshRate, setAutoRefreshRate] = useState<number>(1500); // ms (0 = paused)
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState<number>(Date.now());
  const [activeScreenSrc, setActiveScreenSrc] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureError, setCaptureError] = useState<string | null>(null);
  const [realScreenAvailable, setRealScreenAvailable] = useState<boolean>(false);
  const isRefreshingRef = useRef(false);

  // Touch & interaction feedback
  const [touchIndicator, setTouchIndicator] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);

  // Remote text input
  const [remoteText, setRemoteText] = useState("");
  const [isSendingAction, setIsSendingAction] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  // Command execution history
  const [commandLogs, setCommandLogs] = useState<Array<{ time: string; action: string; status: "OK" | "FAIL" }>>([]);

  const screenContainerRef = useRef<HTMLDivElement>(null);

  const isConnected = device && device.serial !== "NO_DEVICE" && device.adbState === "CONNECTED";

  // Fetch resolution on load or device change
  useEffect(() => {
    async function fetchResolution() {
      if (!isConnected) return;
      try {
        const res = await fetch(`/api/devices/resolution?serial=${encodeURIComponent(device.serial)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.width && data.height) {
            setResolution(data);
          }
        }
      } catch (e) {
        console.error("Resolution query error:", e);
      }
    }
    fetchResolution();
  }, [device.serial, isConnected]);

  // Periodic Screen Capture polling
  useEffect(() => {
    if (!isConnected || autoRefreshRate <= 0) return;

    const interval = setInterval(() => {
      refreshScreen();
    }, autoRefreshRate);

    return () => clearInterval(interval);
  }, [isConnected, autoRefreshRate, device.serial]);

  const refreshScreen = async () => {
    if (!isConnected || isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    setIsCapturing(true);
    const ts = Date.now();
    const frameUrl = `/api/devices/screen?serial=${encodeURIComponent(device.serial)}&t=${ts}`;

    try {
      // Preload and decode image off-screen before swapping DOM element to eliminate flicker and layout shift
      const img = new Image();
      img.onload = () => {
        if (typeof img.decode === "function") {
          img.decode().then(() => {
            setActiveScreenSrc(frameUrl);
            setRealScreenAvailable(true);
            setCaptureError(null);
            setLastRefreshTimestamp(ts);
            setIsCapturing(false);
            isRefreshingRef.current = false;
          }).catch(() => {
            setActiveScreenSrc(frameUrl);
            setRealScreenAvailable(true);
            setCaptureError(null);
            setLastRefreshTimestamp(ts);
            setIsCapturing(false);
            isRefreshingRef.current = false;
          });
        } else {
          setActiveScreenSrc(frameUrl);
          setRealScreenAvailable(true);
          setCaptureError(null);
          setLastRefreshTimestamp(ts);
          setIsCapturing(false);
          isRefreshingRef.current = false;
        }
      };
      img.onerror = () => {
        // Keep previous frame visible if temporary network hiccup occurs to avoid jumping
        setIsCapturing(false);
        isRefreshingRef.current = false;
      };
      img.src = frameUrl;
    } catch (e) {
      setIsCapturing(false);
      isRefreshingRef.current = false;
    }
  };

  const addLog = (action: string, status: "OK" | "FAIL") => {
    const time = new Date().toLocaleTimeString();
    setCommandLogs((prev) => [{ time, action, status }, ...prev.slice(0, 19)]);
  };

  // Helper to send key event
  const sendKey = async (keycode: number, label: string) => {
    setIsSendingAction(true);
    setActionFeedback(`Sending Key: ${label} (${keycode})...`);
    try {
      const res = await fetch("/api/devices/control/key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial: device.serial, keycode }),
      });
      if (res.ok) {
        addLog(`Key: ${label} (#${keycode})`, "OK");
        setActionFeedback(`Executed: ${label}`);
        setTimeout(refreshScreen, 300);
      } else {
        addLog(`Key: ${label} (#${keycode})`, "FAIL");
      }
    } catch (e: any) {
      addLog(`Key: ${label}`, "FAIL");
    } finally {
      setIsSendingAction(false);
      setTimeout(() => setActionFeedback(null), 2500);
    }
  };

  // Helper to send intent
  const sendIntent = async (action: string, label: string, uri?: string) => {
    setIsSendingAction(true);
    setActionFeedback(`Launching ${label}...`);
    try {
      const res = await fetch("/api/devices/control/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial: device.serial, action, uri }),
      });
      if (res.ok) {
        addLog(`Intent: ${label}`, "OK");
        setActionFeedback(`Launched ${label}`);
        setTimeout(refreshScreen, 700);
      } else {
        addLog(`Intent: ${label}`, "FAIL");
      }
    } catch (e) {
      addLog(`Intent: ${label}`, "FAIL");
    } finally {
      setIsSendingAction(false);
      setTimeout(() => setActionFeedback(null), 2500);
    }
  };

  // Helper to send typed text
  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!remoteText.trim()) return;
    setIsSendingAction(true);
    setActionFeedback(`Typing text into device...`);
    try {
      const res = await fetch("/api/devices/control/text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial: device.serial, text: remoteText }),
      });
      if (res.ok) {
        addLog(`Text: "${remoteText.slice(0, 15)}..."`, "OK");
        setActionFeedback(`Text injected into device`);
        setRemoteText("");
        setTimeout(refreshScreen, 400);
      } else {
        addLog(`Text Injection`, "FAIL");
      }
    } catch (e) {
      addLog(`Text Injection`, "FAIL");
    } finally {
      setIsSendingAction(false);
      setTimeout(() => setActionFeedback(null), 2500);
    }
  };

  // Click / Touch on Screen to Tap
  const handleScreenMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!screenContainerRef.current) return;
    const rect = screenContainerRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const normX = Math.max(0, Math.min(1, clickX / rect.width));
    const normY = Math.max(0, Math.min(1, clickY / rect.height));

    const realX = Math.round(normX * resolution.width);
    const realY = Math.round(normY * resolution.height);

    setTouchIndicator({ x: clickX, y: clickY });
    setTimeout(() => setTouchIndicator(null), 500);

    setIsDragging(true);
    setDragStart({ x: realX, y: realY });
  };

  const handleScreenMouseUp = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || !screenContainerRef.current) {
      setIsDragging(false);
      return;
    }

    const rect = screenContainerRef.current.getBoundingClientRect();
    const endX = Math.round(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * resolution.width);
    const endY = Math.round(Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height)) * resolution.height);

    setIsDragging(false);

    const dist = Math.hypot(endX - dragStart.x, endY - dragStart.y);

    if (dist < 20) {
      // Single Tap
      try {
        await fetch("/api/devices/control/tap", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ serial: device.serial, x: dragStart.x, y: dragStart.y }),
        });
        addLog(`Tap @ (${dragStart.x}, ${dragStart.y})`, "OK");
        setTimeout(refreshScreen, 300);
      } catch (e) {
        addLog(`Tap @ (${dragStart.x}, ${dragStart.y})`, "FAIL");
      }
    } else {
      // Swipe / Drag
      try {
        await fetch("/api/devices/control/swipe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            serial: device.serial,
            x1: dragStart.x,
            y1: dragStart.y,
            x2: endX,
            y2: endY,
            duration: 350,
          }),
        });
        addLog(`Swipe (${dragStart.x}, ${dragStart.y}) → (${endX}, ${endY})`, "OK");
        setTimeout(refreshScreen, 450);
      } catch (e) {
        addLog(`Swipe Gesture`, "FAIL");
      }
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-slate-900 via-[#0a1120] to-cyan-950/40 border border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
            <Smartphone className="w-5 h-5 text-cyan-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white font-mono-forensic tracking-wide">
                ANDROID FULL REMOTE CONTROL &amp; LIVE MIRROR
              </h2>
              <span
                className={`text-[10px] font-mono-forensic uppercase font-bold px-2 py-0.5 rounded border ${
                  isConnected
                    ? "bg-emerald-950/70 text-emerald-300 border-emerald-500/40"
                    : "bg-amber-950/70 text-amber-300 border-amber-500/40"
                }`}
              >
                {isConnected ? "LIVE ADB CONNECTED" : "LAB DEMO / STANDBY"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive low-latency touch navigation, hardware keys, intent execution, and live screen preview
            </p>
          </div>
        </div>

        {/* Quick controls on top right */}
        <div className="flex items-center gap-2 flex-wrap">
          {onOpenWirelessModal && (
            <button
              onClick={onOpenWirelessModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900/50 text-xs font-mono-forensic transition-all shadow-[0_0_10px_rgba(6,182,212,0.2)]"
            >
              <Wifi className="w-3.5 h-3.5 text-cyan-400" />
              <span>Wireless Debugging (Wi-Fi)</span>
            </button>
          )}

          {/* Refresh screen button */}
          <button
            onClick={refreshScreen}
            disabled={isCapturing}
            className="flex items-center justify-center gap-1.5 w-[96px] h-[32px] shrink-0 px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 text-xs font-mono-forensic transition-colors select-none"
            title="Force immediate screenshot refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${isCapturing ? "animate-spin text-cyan-400" : ""}`} />
            <span className="w-14 text-center truncate select-none">{isCapturing ? "Syncing" : "Refresh"}</span>
          </button>

          {/* Auto refresh rate dropdown */}
          <div className="flex items-center gap-1.5 text-xs font-mono-forensic text-slate-400 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
            <Radio className="w-3 h-3 text-cyan-400" />
            <span>Stream:</span>
            <select
              value={autoRefreshRate}
              onChange={(e) => setAutoRefreshRate(Number(e.target.value))}
              className="bg-transparent text-cyan-300 font-semibold focus:outline-none cursor-pointer"
            >
              <option value={500} className="bg-slate-900 text-white">Ultra (0.5s)</option>
              <option value={1500} className="bg-slate-900 text-white">Normal (1.5s)</option>
              <option value={3000} className="bg-slate-900 text-white">Eco (3.0s)</option>
              <option value={0} className="bg-slate-900 text-white">Paused (Manual)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Phone Bezel Mirror, Right = Control Suite */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start" style={{ overflowAnchor: "none" }}>
        {/* COLUMN 1: LIVE PHONE SCREEN MIRROR & NAVIGATION BAR (5 cols on lg) */}
        <div className="lg:col-span-5 flex flex-col items-center self-start" style={{ contain: "layout", overflowAnchor: "none" }}>
          <div className="w-full max-w-[320px] bg-[#050811] p-3 rounded-[32px] border-4 border-slate-800 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_25px_rgba(6,182,212,0.15)] relative select-none flex-shrink-0" style={{ contain: "paint layout" }}>
            {/* Phone Speaker & Camera Notch */}
            <div className="flex items-center justify-between px-6 pt-1 pb-2">
              <div className="text-[10px] font-mono-forensic font-bold text-slate-400">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
              <div className="w-4 h-4 rounded-full bg-black border border-slate-800 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-950 border border-cyan-800" />
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono-forensic">
                <Wifi className="w-3 h-3 text-cyan-400" />
                <span>{device.batteryLevel > 0 ? `${device.batteryLevel}%` : "88%"}</span>
              </div>
            </div>

            {/* SCREEN CANVAS AREA - STRICT PIXEL-LOCKED DIMENSIONS TO ELIMINATE ALL LAYOUT SHIFTING */}
            <div
              ref={screenContainerRef}
              onMouseDown={handleScreenMouseDown}
              onMouseUp={handleScreenMouseUp}
              className="relative w-full h-[520px] rounded-[22px] overflow-hidden bg-slate-950 cursor-pointer border border-slate-800/80 group select-none flex-shrink-0"
              style={{
                height: "520px",
                minHeight: "520px",
                maxHeight: "520px",
                contain: "strict",
                overflowAnchor: "none"
              }}
              title="Click or drag anywhere on screen to touch & gesture on target phone"
            >
              {/* If real ADB screenshot is available - retain it persistently across refreshes */}
              {activeScreenSrc ? (
                <img
                  key="live-android-screen-stream"
                  src={activeScreenSrc}
                  alt="Live Android Screen"
                  className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                  draggable={false}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover"
                  }}
                />
              ) : (
                /* Simulated High-Fidelity Android OS Screen */
                <div className="w-full h-full flex flex-col justify-between p-4 bg-gradient-to-b from-[#0e1628] via-[#090e1a] to-[#04060c] text-white select-none">
                  {/* Top Status & Date */}
                  <div className="text-center pt-8 space-y-1">
                    <div className="text-4xl font-extralight font-mono-forensic text-cyan-200">
                      {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    <div className="text-xs text-slate-400 font-sans">
                      {new Date().toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
                    </div>
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-[10px] font-mono-forensic text-cyan-300 mt-2">
                      <Sparkles className="w-3 h-3" />
                      <span>{device.marketName || "Android Live Mirror"}</span>
                    </div>
                  </div>

                  {/* App Grid on Screen */}
                  <div className="grid grid-cols-4 gap-3 px-2 py-4">
                    {[
                      { name: "Settings", icon: Settings, color: "bg-slate-800 text-cyan-400" },
                      { name: "Phone", icon: Phone, color: "bg-emerald-950 text-emerald-400" },
                      { name: "Messages", icon: FileText, color: "bg-blue-950 text-blue-400" },
                      { name: "Browser", icon: Globe, color: "bg-purple-950 text-purple-400" },
                      { name: "Camera", icon: Camera, color: "bg-rose-950 text-rose-400" },
                      { name: "Files", icon: Sliders, color: "bg-amber-950 text-amber-400" },
                      { name: "Termux", icon: Eye, color: "bg-cyan-950 text-cyan-300" },
                      { name: "Wi-Fi", icon: Wifi, color: "bg-indigo-950 text-indigo-400" },
                    ].map((app, i) => {
                      const Icon = app.icon;
                      return (
                        <div key={i} className="flex flex-col items-center gap-1 group/app">
                          <div
                            className={`w-11 h-11 rounded-2xl ${app.color} flex items-center justify-center border border-white/10 shadow-lg group-hover/app:scale-105 transition-transform`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <span className="text-[10px] text-slate-300 font-medium truncate max-w-[50px]">
                            {app.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Dock Area */}
                  <div className="p-2 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-around mb-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-600/80 flex items-center justify-center">
                      <Phone className="w-4 h-4 text-white" />
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-blue-600/80 flex items-center justify-center">
                      <Globe className="w-4 h-4 text-white" />
                    </div>
                    <div className="w-9 h-9 rounded-xl bg-purple-600/80 flex items-center justify-center">
                      <Settings className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* Touch Visual Ripple */}
              {touchIndicator && (
                <div
                  className="absolute pointer-events-none w-8 h-8 rounded-full border-2 border-cyan-400 bg-cyan-400/30 animate-ping -translate-x-1/2 -translate-y-1/2 shadow-[0_0_15px_rgba(6,182,212,0.8)]"
                  style={{ left: `${touchIndicator.x}px`, top: `${touchIndicator.y}px` }}
                />
              )}

              {/* Hover Cursor overlay indicator */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-end justify-center pb-12">
                <span className="px-2 py-1 rounded bg-black/70 border border-cyan-500/40 text-[10px] font-mono-forensic text-cyan-300 backdrop-blur-sm">
                  Click / Drag to Touch
                </span>
              </div>
            </div>

            {/* ANDROID 3-BUTTON NAVIGATION BAR AT BOTTOM */}
            <div className="flex items-center justify-around py-3 px-4 mt-1 border-t border-slate-800/80">
              {/* Back button (Keycode 4) */}
              <button
                onClick={() => sendKey(4, "BACK")}
                disabled={isSendingAction}
                className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-all active:scale-90"
                title="Android Back Button (Keycode 4)"
              >
                <CornerDownLeft className="w-5 h-5" />
              </button>

              {/* Home button (Keycode 3) */}
              <button
                onClick={() => sendKey(3, "HOME")}
                disabled={isSendingAction}
                className="w-10 h-10 rounded-full border border-slate-700 hover:border-cyan-400 flex items-center justify-center text-slate-300 hover:text-cyan-400 hover:bg-slate-800/80 transition-all active:scale-90 shadow-md"
                title="Android Home Button (Keycode 3)"
              >
                <div className="w-3.5 h-3.5 rounded-full border-2 border-current" />
              </button>

              {/* Recents / App Switcher (Keycode 187) */}
              <button
                onClick={() => sendKey(187, "APP_SWITCH")}
                disabled={isSendingAction}
                className="p-2 rounded-xl text-slate-400 hover:text-cyan-400 hover:bg-slate-800/80 transition-all active:scale-90"
                title="Android Recents / Task Switcher (Keycode 187)"
              >
                <div className="w-4 h-4 rounded-sm border-2 border-current" />
              </button>
            </div>
          </div>

          <div className="text-[11px] font-mono-forensic text-slate-500 mt-2 text-center">
            Virtual Digitizer: {resolution.width} x {resolution.height} @ {resolution.density} dpi
          </div>
        </div>

        {/* COLUMN 2: HARDWARE ACTION DECK & REMOTE SUITE (7 cols on lg) */}
        <div className="lg:col-span-7 space-y-4 self-start" style={{ overflowAnchor: "none", contain: "layout" }}>
          {/* Action Feedback Banner - Fixed Height to prevent any layout shifting */}
          <div className="h-9 flex items-center">
            {actionFeedback ? (
              <div className="w-full px-3 py-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/50 text-cyan-300 text-xs font-mono-forensic flex items-center gap-2 animate-in fade-in duration-150 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">{actionFeedback}</span>
              </div>
            ) : (
              <div className="w-full px-3 py-1.5 rounded-lg bg-slate-950/40 border border-slate-800/50 text-slate-500 text-[11px] font-mono-forensic flex items-center gap-2">
                <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>Device bridge active • Direct ADB hardware bus</span>
              </div>
            )}
          </div>

          {/* Hardware Button Deck */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono-forensic font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-cyan-400" />
                Physical Hardware Controls
              </span>
              <span className="text-[10px] font-mono-forensic text-slate-500">
                Direct ADB Keyevents
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                onClick={() => sendKey(26, "POWER")}
                disabled={isSendingAction}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500/50 text-rose-400 hover:bg-rose-950/20 text-xs font-mono-forensic font-semibold transition-all"
              >
                <Power className="w-3.5 h-3.5" />
                <span>Power Button</span>
              </button>

              <button
                onClick={() => sendKey(224, "WAKEUP")}
                disabled={isSendingAction}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/50 text-amber-300 hover:bg-amber-950/20 text-xs font-mono-forensic font-semibold transition-all"
              >
                <Sun className="w-3.5 h-3.5" />
                <span>Wake Screen</span>
              </button>

              <button
                onClick={() => sendKey(223, "SLEEP")}
                disabled={isSendingAction}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-indigo-500/50 text-indigo-300 hover:bg-indigo-950/20 text-xs font-mono-forensic font-semibold transition-all"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Lock Screen</span>
              </button>

              <button
                onClick={() => sendKey(120, "SYSRQ / SNAPSHOT")}
                disabled={isSendingAction}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/20 text-xs font-mono-forensic font-semibold transition-all"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Screenshot</span>
              </button>

              <button
                onClick={() => sendKey(24, "VOLUME UP")}
                disabled={isSendingAction}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-emerald-300 hover:bg-emerald-950/20 text-xs font-mono-forensic font-semibold transition-all"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>Volume +</span>
              </button>

              <button
                onClick={() => sendKey(25, "VOLUME DOWN")}
                disabled={isSendingAction}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/50 text-emerald-300 hover:bg-emerald-950/20 text-xs font-mono-forensic font-semibold transition-all"
              >
                <Volume1 className="w-3.5 h-3.5" />
                <span>Volume -</span>
              </button>

              <button
                onClick={async () => {
                  setIsSendingAction(true);
                  try {
                    await fetch("/api/devices/exec", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        serial: device.serial,
                        command: "cmd statusbar expand-notifications",
                      }),
                    });
                    addLog("Expand Notifications", "OK");
                    setTimeout(refreshScreen, 400);
                  } catch (e) {
                    addLog("Expand Notifications", "FAIL");
                  } finally {
                    setIsSendingAction(false);
                  }
                }}
                disabled={isSendingAction}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/50 text-cyan-300 hover:bg-cyan-950/20 text-xs font-mono-forensic font-semibold transition-all"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>Pull Shade</span>
              </button>

              <button
                onClick={async () => {
                  setIsSendingAction(true);
                  try {
                    await fetch("/api/devices/exec", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        serial: device.serial,
                        command: "cmd statusbar collapse",
                      }),
                    });
                    addLog("Collapse Notifications", "OK");
                    setTimeout(refreshScreen, 400);
                  } catch (e) {
                    addLog("Collapse Notifications", "FAIL");
                  } finally {
                    setIsSendingAction(false);
                  }
                }}
                disabled={isSendingAction}
                className="flex items-center justify-center gap-2 p-2.5 rounded-lg bg-slate-950 border border-slate-800 hover:border-slate-600 text-slate-300 hover:bg-slate-800 text-xs font-mono-forensic font-semibold transition-all"
              >
                <BellOff className="w-3.5 h-3.5" />
                <span>Hide Shade</span>
              </button>
            </div>
          </div>

          {/* Remote Keyboard & Text Input */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="text-xs font-mono-forensic font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-cyan-400" />
              Remote Text Injection
            </span>

            <form onSubmit={handleSendText} className="flex gap-2">
              <input
                type="text"
                value={remoteText}
                onChange={(e) => setRemoteText(e.target.value)}
                placeholder="Type text, search term, or URL to type into focused field..."
                className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-xs font-mono-forensic text-slate-100 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                disabled={isSendingAction || !remoteText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-cyan-500 text-slate-950 text-xs font-mono-forensic font-bold hover:bg-cyan-400 disabled:opacity-40 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Send</span>
              </button>
            </form>

            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] text-slate-500 font-mono-forensic mr-1">Special Keys:</span>
              <button
                onClick={() => sendKey(66, "ENTER")}
                className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono-forensic text-slate-300 hover:border-cyan-400"
              >
                ↵ Enter
              </button>
              <button
                onClick={() => sendKey(67, "BACKSPACE")}
                className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono-forensic text-slate-300 hover:border-cyan-400"
              >
                ⌫ Backspace
              </button>
              <button
                onClick={() => sendKey(62, "SPACE")}
                className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono-forensic text-slate-300 hover:border-cyan-400"
              >
                ␣ Space
              </button>
              <button
                onClick={() => sendKey(61, "TAB")}
                className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono-forensic text-slate-300 hover:border-cyan-400"
              >
                ⇥ Tab
              </button>
              <button
                onClick={() => sendKey(111, "ESCAPE")}
                className="px-2 py-1 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono-forensic text-slate-300 hover:border-cyan-400"
              >
                ⎋ Esc
              </button>
            </div>
          </div>

          {/* Quick Activity Launchers (Intents) */}
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="text-xs font-mono-forensic font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Play className="w-4 h-4 text-purple-400" />
              Forensic Activity &amp; Settings Shortcuts
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <button
                onClick={() => sendIntent("android.settings.SETTINGS", "Settings")}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-cyan-500/40 text-xs font-mono-forensic text-slate-300 hover:text-cyan-300 text-left"
              >
                <Settings className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate">Open Settings</span>
              </button>

              <button
                onClick={() => sendIntent("com.android.settings.APPLICATION_DEVELOPMENT_SETTINGS", "Developer Options")}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-purple-500/40 text-xs font-mono-forensic text-slate-300 hover:text-purple-300 text-left"
              >
                <Sliders className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                <span className="truncate">Dev Options</span>
              </button>

              <button
                onClick={() => sendIntent("android.intent.action.DIAL", "Phone Dialer")}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-emerald-500/40 text-xs font-mono-forensic text-slate-300 hover:text-emerald-300 text-left"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Open Dialer</span>
              </button>

              <button
                onClick={() => sendIntent("android.intent.action.VIEW", "Web Browser", "https://google.com")}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-blue-500/40 text-xs font-mono-forensic text-slate-300 hover:text-blue-300 text-left"
              >
                <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                <span className="truncate">Open Browser</span>
              </button>

              <button
                onClick={() => sendIntent("android.media.action.IMAGE_CAPTURE", "Camera")}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-rose-500/40 text-xs font-mono-forensic text-slate-300 hover:text-rose-300 text-left"
              >
                <Camera className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                <span className="truncate">Open Camera</span>
              </button>

              <button
                onClick={() => sendIntent("android.intent.action.VIEW_DOWNLOADS", "Downloads Manager")}
                className="flex items-center gap-2 p-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/40 text-xs font-mono-forensic text-slate-300 hover:text-amber-300 text-left"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">Downloads</span>
              </button>
            </div>
          </div>

          {/* Command execution audit feed - Fixed height and scroll anchor disabled */}
          <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-2" style={{ overflowAnchor: "none" }}>
            <div className="flex items-center justify-between text-[11px] font-mono-forensic text-slate-400 uppercase">
              <span className="flex items-center gap-1.5">
                <Radio className="w-3 h-3 text-cyan-400" />
                Touch &amp; Key Event Stream
              </span>
              <span className="text-cyan-400">{commandLogs.length} events</span>
            </div>
            <div className="space-y-1 h-28 overflow-y-auto font-mono-forensic text-[10px] pr-1" style={{ overflowAnchor: "none" }}>
              {commandLogs.length === 0 ? (
                <div className="text-slate-600 italic py-1">
                  Ready. Click on the screen or press buttons above to interact with the device.
                </div>
              ) : (
                commandLogs.map((log, idx) => (
                  <div key={idx} className="flex items-center justify-between text-slate-400">
                    <span className="text-slate-500">{log.time}</span>
                    <span className="text-slate-300 font-medium">{log.action}</span>
                    <span
                      className={`px-1 rounded ${
                        log.status === "OK" ? "text-emerald-400 bg-emerald-950/40" : "text-rose-400 bg-rose-950/40"
                      }`}
                    >
                      {log.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
