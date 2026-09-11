import React, { useState } from "react";
import { GitCompare, Smartphone, Check, X, AlertTriangle, Layers, Wifi, Shield } from "lucide-react";
import { AndroidDevice } from "../types/forensics";

interface DeviceComparisonViewProps {
  currentDevice: AndroidDevice;
}

export const DeviceComparisonView: React.FC<DeviceComparisonViewProps> = ({ currentDevice }) => {
  // Simulated comparison against historical baseline or second device
  const baselineDevice: AndroidDevice = {
    ...currentDevice,
    serial: "BASELINE-SNAPSHOT-AUG",
    androidVersion: "14.0 (UQ1A.240105.002)",
    securityPatch: "2026-07-05",
    batteryLevel: 68,
  };

  const appComparison = [
    { name: "CryptoCore Vault", pkg: "com.cryptocore.vault", status: "ADDED_IN_CURRENT", note: "Newly sideloaded APK since last baseline" },
    { name: "Signal Messenger", pkg: "org.thoughtcrime.securesms", status: "UNCHANGED", note: "Identical build and signature" },
    { name: "Google Messages", pkg: "com.google.android.apps.messaging", status: "UPDATED", note: "Security patch release updated" },
    { name: "ProtonVPN", pkg: "ch.protonvpn.android", status: "REMOVED_IN_CURRENT", note: "Present in August extraction, uninstalled prior to incident" },
  ];

  const networkComparison = [
    { ssid: "CORP_CORP_SECURE_WPA3", current: true, baseline: true },
    { ssid: "SwissVault_Guest_Public", current: true, baseline: false, flag: "New external network connection recorded" },
    { ssid: "SFO_Airport_Free_WiFi", current: true, baseline: true },
  ];

  return (
    <div className="space-y-6 font-mono-forensic text-xs">
      {/* Header */}
      <div className="p-5 rounded-xl bg-[#0c121e] border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-cyan-950/60 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <GitCompare className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">
              Cross-Device &amp; Baseline Delta Comparison
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Compare current device acquisition against prior extraction snapshot to isolate state changes.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-xs font-bold">
          DELTA AUDIT ACTIVE
        </span>
      </div>

      {/* Side-by-side Device Specs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Baseline */}
        <div className="p-4 rounded-xl bg-[#090d16] border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 font-bold">
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-slate-500" />
              Baseline Snapshot (2026-08-01)
            </span>
            <span className="text-[10px] text-slate-500">HISTORICAL EXTRACTION</span>
          </div>
          <div className="space-y-1.5 text-slate-300">
            <div>Device: {baselineDevice.manufacturer} {baselineDevice.model}</div>
            <div>OS Build: {baselineDevice.androidVersion}</div>
            <div>Patch: <span className="text-slate-400">{baselineDevice.securityPatch}</span></div>
            <div>Installed 3rd Party Packages: 14 apps</div>
          </div>
        </div>

        {/* Current Target */}
        <div className="p-4 rounded-xl bg-[#0c121e] border border-cyan-500/40 space-y-3 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-cyan-400 font-bold">
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              Target Acquisition (Current Incident)
            </span>
            <span className="text-[10px] text-emerald-400 font-bold">● ACTIVE TARGET</span>
          </div>
          <div className="space-y-1.5 text-slate-200">
            <div>Device: {currentDevice.manufacturer} {currentDevice.model}</div>
            <div>OS Build: {currentDevice.androidVersion}</div>
            <div>Patch: <span className="text-emerald-400 font-bold">{currentDevice.securityPatch} (Updated)</span></div>
            <div>Installed 3rd Party Packages: 15 apps</div>
          </div>
        </div>
      </div>

      {/* Package Delta Table */}
      <div className="rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between text-slate-400 font-bold">
          <span className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            Application Delta Analysis
          </span>
          <span className="text-[10px] text-slate-500">Isolates newly sideloaded or wiped packages</span>
        </div>

        <div className="divide-y divide-slate-850 max-h-72 overflow-y-auto">
          {appComparison.map((item) => (
            <div key={item.pkg} className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-900/40">
              <div>
                <div className="text-white font-bold flex items-center gap-2">
                  <span>{item.name}</span>
                  <span className="text-slate-500 text-[11px] font-normal">({item.pkg})</span>
                </div>
                <div className="text-slate-400 text-[11px] mt-0.5">{item.note}</div>
              </div>

              <div>
                {item.status === "ADDED_IN_CURRENT" ? (
                  <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 font-bold text-[10px] flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3" />
                    NEWLY INSTALLED
                  </span>
                ) : item.status === "REMOVED_IN_CURRENT" ? (
                  <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-bold text-[10px]">
                    WIPED / UNINSTALLED
                  </span>
                ) : item.status === "UPDATED" ? (
                  <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold text-[10px]">
                    VERSION UPDATED
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-400 text-[10px]">
                    UNCHANGED
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Delta Table */}
      <div className="rounded-xl bg-[#090d16] border border-slate-800 overflow-hidden">
        <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex justify-between text-slate-400 font-bold">
          <span className="flex items-center gap-2">
            <Wifi className="w-4 h-4 text-purple-400" />
            Wireless Network Profiles &amp; SSID Connections
          </span>
          <span className="text-[10px] text-slate-500">Wi-Fi Configuration History</span>
        </div>

        <div className="divide-y divide-slate-850">
          {networkComparison.map((net) => (
            <div key={net.ssid} className="p-3 flex items-center justify-between">
              <div>
                <div className="text-slate-200 font-bold">{net.ssid}</div>
                {net.flag && <div className="text-amber-400 text-[11px] mt-0.5">{net.flag}</div>}
              </div>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="text-slate-500">Baseline: {net.baseline ? "YES" : "NO"}</span>
                <span className="text-slate-500">|</span>
                <span className="text-cyan-400 font-bold">Current: {net.current ? "YES" : "NO"}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
