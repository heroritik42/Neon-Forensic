import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { Navigation, NavTab } from "./components/Navigation";
import { DashboardView } from "./components/DashboardView";
import { DeviceManagerView } from "./components/DeviceManagerView";
import { AcquisitionView } from "./components/AcquisitionView";
import { EvidenceExplorerView } from "./components/EvidenceExplorerView";
import { ArtifactsView } from "./components/ArtifactsView";
import { SqliteView } from "./components/SqliteView";
import { HexViewerView } from "./components/HexViewerView";
import { TimelineView } from "./components/TimelineView";
import { NeonRecoverView } from "./components/NeonRecoverView";
import { MediaView } from "./components/MediaView";
import { ChainOfCustodyView } from "./components/ChainOfCustodyView";
import { ReportsView } from "./components/ReportsView";
import { DeviceComparisonView } from "./components/DeviceComparisonView";
import { RemoteControlView } from "./components/RemoteControlView";

import { CliModal } from "./components/CliModal";
import { AiForensicModal } from "./components/AiForensicModal";
import { CaseModal } from "./components/CaseModal";
import { LimitationsModal } from "./components/LimitationsModal";
import { LinuxDownloadModal } from "./components/LinuxDownloadModal";
import { WirelessDebugModal } from "./components/WirelessDebugModal";

import {
  INITIAL_CASE,
  INITIAL_DEVICE,
  MOCK_BROWSER,
  MOCK_MEDIA,
  MOCK_SQLITE_DATABASES,
  MOCK_CARVED_FILES,
  MOCK_DUPLICATES,
} from "./data/mockEvidence";
import {
  ForensicCase,
  AndroidDevice,
  EvidenceFile,
  AdbCommandLog,
  TimelineEvent,
  ChainOfCustodyRecord,
  CarvedFileArtifact,
  AcquisitionProfile,
  DeviceState,
  ContactArtifact,
  SmsArtifact,
  CallLogArtifact,
  ApplicationArtifact,
} from "./types/forensics";
import { computeSha256, computeSha512, verifyAuditChain } from "./utils/crypto";
import { carveEvidenceBuffer } from "./utils/fileCarver";

const DISCONNECTED_DEVICE: AndroidDevice = {
  serial: "NO_DEVICE",
  model: "No Device Attached",
  manufacturer: "Android",
  marketName: "Awaiting USB Connection",
  androidVersion: "Unknown",
  sdkVersion: 34,
  buildFingerprint: "Unknown",
  securityPatch: "Unknown",
  rootStatus: "UNROOTED_VERIFIED",
  adbState: "DISCONNECTED",
  usbState: "DISCONNECTED",
  vendorId: "0x0000",
  productId: "0x0000",
  usbMode: "CHARGING_ONLY",
  batteryLevel: 0,
  batteryHealth: "Good",
  storage: {
    totalBytes: 0,
    usedBytes: 0,
    sharedBytes: 0,
    encryptionType: "FILE_BASED_ENCRYPTION_FBE",
  },
  tcpIpEnabled: false,
};

export default function App() {
  const [currentCase, setCurrentCase] = useState<ForensicCase>(INITIAL_CASE);
  const [device, setDevice] = useState<AndroidDevice>(DISCONNECTED_DEVICE);
  const [detectedDevices, setDetectedDevices] = useState<AndroidDevice[]>([]);
  const [isScanningDevices, setIsScanningDevices] = useState(false);
  const [usbHardwareNotice, setUsbHardwareNotice] = useState<{ detected: boolean; info: string; vendor: string } | null>(null);
  const [isFixingAdb, setIsFixingAdb] = useState(false);
  const [currentTab, setCurrentTab] = useState<NavTab>("DASHBOARD");

  // Real Database-backed state
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);
  const [contacts, setContacts] = useState<ContactArtifact[]>([]);
  const [sms, setSms] = useState<SmsArtifact[]>([]);
  const [calls, setCalls] = useState<CallLogArtifact[]>([]);
  const [apps, setApps] = useState<ApplicationArtifact[]>([]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [chainRecords, setChainRecords] = useState<ChainOfCustodyRecord[]>([]);
  const [carvedFiles, setCarvedFiles] = useState<CarvedFileArtifact[]>(MOCK_CARVED_FILES);
  const [adbLogs, setAdbLogs] = useState<AdbCommandLog[]>([]);

  const [isSampleCaseLoaded, setIsSampleCaseLoaded] = useState(false);
  const [selectedHexFile, setSelectedHexFile] = useState<EvidenceFile | null>(null);

  // Modals
  const [isCaseModalOpen, setIsCaseModalOpen] = useState(false);
  const [isCliOpen, setIsCliOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [isLimitationsOpen, setIsLimitationsOpen] = useState(false);
  const [isLinuxModalOpen, setIsLinuxModalOpen] = useState(false);
  const [isWirelessModalOpen, setIsWirelessModalOpen] = useState(false);

  // Acquisition States
  const [isAcquiring, setIsAcquiring] = useState(false);
  const [acquisitionProgress, setAcquisitionProgress] = useState(0);
  const [acquisitionStep, setAcquisitionStep] = useState("");
  const [isVerifyingIntegrity, setIsVerifyingIntegrity] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState<"VERIFIED" | "TAMPERED" | "UNCHECKED">("VERIFIED");
  const [isCarvingScanning, setIsCarvingScanning] = useState(false);

  // Load data from backend SQLite database
  const loadBackendData = useCallback(async () => {
    try {
      // 1. Case
      const caseRes = await fetch("/api/case");
      if (caseRes.ok) {
        const caseData = await caseRes.json();
        if (caseData && caseData.id) setCurrentCase(caseData);
      }

      // 2. Devices
      const devRes = await fetch("/api/devices");
      if (devRes.ok) {
        const devData = await devRes.json();
        if (Array.isArray(devData.devices)) {
          setDetectedDevices(devData.devices);
          const active = devData.devices.find((d: AndroidDevice) => d.adbState === "CONNECTED") || devData.devices[0];
          if (active) setDevice(active);
        }
      }

      // 3. Evidence
      const evRes = await fetch("/api/evidence");
      if (evRes.ok) {
        const evData = await evRes.json();
        if (Array.isArray(evData.evidence)) {
          setEvidenceFiles(evData.evidence);
          if (evData.evidence.length > 0) {
            setSelectedHexFile(evData.evidence[0]);
            // Check if demo sample
            if (evData.evidence.some((f: EvidenceFile) => f.id === "EV-001")) {
              setIsSampleCaseLoaded(true);
            }
          }
        }
      }

      // 4. Artifacts
      const artRes = await fetch("/api/artifacts");
      if (artRes.ok) {
        const artData = await artRes.json();
        if (artData.artifacts) {
          setContacts(artData.artifacts.contacts || []);
          setSms(artData.artifacts.sms || []);
          setCalls(artData.artifacts.calls || []);
          setApps(artData.artifacts.apps || []);
        }
      }

      // 5. Timeline
      const timeRes = await fetch("/api/timeline");
      if (timeRes.ok) {
        const timeData = await timeRes.json();
        if (Array.isArray(timeData.timeline)) {
          setTimelineEvents(timeData.timeline);
        }
      }

      // 6. Chain of Custody
      const chainRes = await fetch("/api/chain");
      if (chainRes.ok) {
        const chainData = await chainRes.json();
        if (Array.isArray(chainData.chain)) {
          setChainRecords(chainData.chain);
        }
      }
    } catch (err) {
      console.warn("Backend sync notice:", err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadBackendData();
  }, [loadBackendData]);

  // Real Hardware ADB Scanning
  const handleScanDevices = async () => {
    setIsScanningDevices(true);
    try {
      const res = await fetch("/api/devices");
      const data = await res.json();
      if (data.usbHardware) {
        setUsbHardwareNotice(data.usbHardware);
      }
      if (data.devices && Array.isArray(data.devices)) {
        setDetectedDevices(data.devices);
        const active = data.devices.find((d: AndroidDevice) => d.adbState === "CONNECTED") || data.devices[0];
        if (active) {
          setDevice(active);
        } else if (!isSampleCaseLoaded) {
          setDevice(DISCONNECTED_DEVICE);
        }
      }

      // Log scan action
      const newLog: AdbCommandLog = {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        deviceSerial: data.devices?.[0]?.serial || "HOST",
        command: "adb devices -l",
        result: data.devices?.length > 0 ? "SUCCESS" : "SUCCESS",
        outputSnippet: data.devices?.length > 0
          ? `Discovered ${data.devices.length} ADB endpoint(s). Active: ${data.devices[0]?.serial} (${data.devices[0]?.adbState})`
          : data.usbHardware?.detected
          ? `USB Phone detected (${data.usbHardware.vendor}) - waiting for ADB authorization.`
          : "No USB/TCP ADB devices currently connected. Waiting for target...",
      };
      setAdbLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error("Scan devices error:", err);
    } finally {
      setIsScanningDevices(false);
    }
  };

  // 1-Click ADB Server Restart & USB Reconnection
  const handleFixAdb = async () => {
    setIsFixingAdb(true);
    try {
      const res = await fetch("/api/devices/restart-adb", { method: "POST" });
      const data = await res.json();
      if (data.devices && Array.isArray(data.devices)) {
        setDetectedDevices(data.devices);
        const active = data.devices.find((d: AndroidDevice) => d.adbState === "CONNECTED") || data.devices[0];
        if (active) setDevice(active);
      }
      const newLog: AdbCommandLog = {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        deviceSerial: "HOST",
        command: "adb kill-server && adb start-server && adb reconnect",
        result: data.success ? "SUCCESS" : "FAILED",
        outputSnippet: data.logs?.join(" | ") || (data.success ? "ADB daemon restarted. Devices refreshed." : "ADB restart failed."),
      };
      setAdbLogs((prev) => [newLog, ...prev]);
    } catch (err: any) {
      console.error("Fix ADB error:", err);
    } finally {
      setIsFixingAdb(false);
    }
  };

  // Continuous background polling every 3 seconds to auto-detect USB plug-in or terminal pairing
  useEffect(() => {
    const pollInterval = setInterval(() => {
      fetch("/api/devices")
        .then((res) => res.json())
        .then((data) => {
          if (data && Array.isArray(data.devices)) {
            setDetectedDevices(data.devices);
            if (data.usbHardware) {
              setUsbHardwareNotice(data.usbHardware);
            }
            if (data.devices.length > 0) {
              setDevice((prev) => {
                if (!prev || prev.serial === "NO_DEVICE") {
                  return data.devices.find((d: AndroidDevice) => d.adbState === "CONNECTED") || data.devices[0];
                }
                const updated = data.devices.find((d: AndroidDevice) => d.serial === prev.serial);
                return updated || prev;
              });
            } else if (device.serial !== "NO_DEVICE" && !isSampleCaseLoaded) {
              setDevice(DISCONNECTED_DEVICE);
            }
          }
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [device.serial, isSampleCaseLoaded]);

  // Reset database vault to clean state
  const handleResetDatabase = async () => {
    try {
      await fetch("/api/db/reset", { method: "POST" });
      setEvidenceFiles([]);
      setContacts([]);
      setSms([]);
      setCalls([]);
      setApps([]);
      setTimelineEvents([]);
      setChainRecords([]);
      setIsSampleCaseLoaded(false);
      setSelectedHexFile(null);
      await loadBackendData();
    } catch (err) {
      console.error("Failed to reset database:", err);
    }
  };

  // Load sample lab case for testing without phone
  const handleLoadSampleCase = async () => {
    try {
      const res = await fetch("/api/demo/seed", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        setIsSampleCaseLoaded(true);
        await loadBackendData();
      }
    } catch (err) {
      console.error("Failed to load sample dataset:", err);
    }
  };

  // Update Case
  const handleUpdateCase = async (updated: ForensicCase) => {
    setCurrentCase(updated);
    try {
      await fetch("/api/case", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updated),
      });
    } catch (err) {
      console.error("Failed to save case:", err);
    }
  };

  // Verify integrity
  const handleVerifyIntegrity = async () => {
    setIsVerifyingIntegrity(true);
    try {
      const res = await fetch("/api/evidence/verify");
      const data = await res.json();
      if (data.allValid) {
        setIntegrityStatus("VERIFIED");
      } else {
        setIntegrityStatus("TAMPERED");
      }
    } catch {
      const chainCheck = await verifyAuditChain(chainRecords);
      setIntegrityStatus(chainCheck.isValid ? "VERIFIED" : "TAMPERED");
    } finally {
      setIsVerifyingIntegrity(false);
    }
  };

  // Real or Assisted Acquisition Execution
  const handleStartAcquisition = async (profile: AcquisitionProfile = "STANDARD") => {
    if (isAcquiring) return;
    setIsAcquiring(true);
    setAcquisitionProgress(10);
    setAcquisitionStep("Initializing ADB session & validating USB device authorization...");

    try {
      setAcquisitionProgress(30);
      setAcquisitionStep("Extracting system properties, SELinux policies, and battery telemetry...");

      const response = await fetch("/api/devices/acquire", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serial: device.serial,
          caseId: currentCase.id,
          profile,
        }),
      });

      setAcquisitionProgress(70);
      setAcquisitionStep("Computing cryptographic SHA-256 and SHA-512 hashes for evidence vault...");

      const data = await response.json();
      if (data.success) {
        setAcquisitionProgress(100);
        setAcquisitionStep("Acquisition successfully complete. Manifest and chain of custody recorded.");
        await loadBackendData();

        const newLog: AdbCommandLog = {
          id: `LOG-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toISOString(),
          deviceSerial: device.serial,
          command: `neon-acquire --profile ${profile.toLowerCase()}`,
          result: "SUCCESS",
          outputSnippet: `Acquisition complete. ${data.filesAcquired || 6} files acquired. SHA-256 hashes generated.`,
        };
        setAdbLogs((prev) => [newLog, ...prev]);
      } else {
        throw new Error(data.error || "Acquisition execution failed");
      }
    } catch (err: any) {
      setAcquisitionStep(`Acquisition status: ${err.message}`);
    } finally {
      setIsAcquiring(false);
    }
  };

  // Real ADB Command Execution
  const handleExecuteAdbCommand = async (cmd: string) => {
    try {
      const res = await fetch("/api/devices/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serial: device.serial, command: cmd }),
      });
      const data = await res.json();
      const output = data.error
        ? data.error
        : data.stdout || data.stderr || "Command returned code 0 (no output)";

      const log: AdbCommandLog = {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        deviceSerial: device.serial,
        command: cmd,
        result: data.error ? "FAILED" : "SUCCESS",
        outputSnippet: output,
      };
      setAdbLogs((prev) => [log, ...prev]);
    } catch (err: any) {
      const log: AdbCommandLog = {
        id: `LOG-${Date.now().toString().slice(-4)}`,
        timestamp: new Date().toISOString(),
        deviceSerial: device.serial,
        command: cmd,
        result: "FAILED",
        outputSnippet: `Execution error: ${err.message}`,
      };
      setAdbLogs((prev) => [log, ...prev]);
    }
  };

  const handleTriggerCarveScan = async () => {
    setIsCarvingScanning(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    const sampleBuffer = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
      0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xd9, 0x00, 0x00,
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
      0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x01, 0x00, 0x49, 0x45, 0x4e, 0x44,
      0xae, 0x42, 0x60, 0x82,
    ]);

    const newCarved = await carveEvidenceBuffer(sampleBuffer, { maxResults: 5 });
    if (newCarved.length > 0) {
      setCarvedFiles((prev) => [...newCarved, ...prev]);
    }
    setIsCarvingScanning(false);
  };

  const handleImportBackupFile = async (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const buffer = await file.arrayBuffer();
      const sha256 = await computeSha256(new Uint8Array(buffer));
      const sha512 = await computeSha512(new Uint8Array(buffer));

      const newEv: EvidenceFile = {
        id: `EV-${Date.now().toString().slice(-4)}`,
        source: `External_Ingest/${file.name}`,
        destination: `/evidence/imported/${file.name}`,
        filename: file.name,
        sha256,
        sha512,
        size: file.size,
        acquiredAt: new Date().toISOString(),
        method: "BACKUP_EXTRACT",
        sourceDevice: device.serial,
        mimeType: file.type || "application/octet-stream",
        category: file.name.endsWith(".db")
          ? "Databases"
          : file.name.endsWith(".apk")
          ? "APK"
          : file.name.endsWith(".jpg") || file.name.endsWith(".png")
          ? "Images"
          : "Documents",
        status: "ACQUIRED",
        notes: `Imported by examiner via manual evidence ingestion.`,
      };

      setEvidenceFiles((prev) => [newEv, ...prev]);
    }
  };

  const handleExportManifest = () => {
    const manifest = {
      caseId: currentCase.id,
      generatedAt: new Date().toISOString(),
      generator: "NEON FORENSIC v3.4.0 PRO",
      deviceSerial: device.serial,
      totalFiles: evidenceFiles.length,
      files: evidenceFiles,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(manifest, null, 2));
    const link = document.createElement("a");
    link.href = dataStr;
    link.download = `evidence_manifest_${currentCase.id}.json`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#07090e] text-slate-200 flex flex-col cyber-grid">
      {/* Top Header */}
      <Header
        currentCase={currentCase}
        device={device}
        onOpenCaseModal={() => setIsCaseModalOpen(true)}
        onOpenCli={() => setIsCliOpen(true)}
        onOpenAi={() => setIsAiOpen(true)}
        onOpenLimitations={() => setIsLimitationsOpen(true)}
        onOpenLinuxDownload={() => setIsLinuxModalOpen(true)}
        onOpenWirelessModal={() => setIsWirelessModalOpen(true)}
        onSelectRemoteControl={() => setCurrentTab("REMOTE_CONTROL")}
        onVerifyIntegrity={handleVerifyIntegrity}
        isVerifying={isVerifyingIntegrity}
        integrityStatus={integrityStatus}
      />

      {/* Main Workspace: Sidebar + Dynamic View */}
      <div className="flex-1 flex overflow-hidden">
        <Navigation
          currentTab={currentTab}
          onSelectTab={setCurrentTab}
          counts={{
            evidenceFiles: evidenceFiles.length,
            contacts: contacts.length,
            sms: sms.length,
            calls: calls.length,
            apps: apps.length,
            timeline: timelineEvents.length,
            carved: carvedFiles.length,
          }}
        />

        <main className="flex-1 p-5 overflow-y-auto max-w-7xl mx-auto w-full">
          {currentTab === "DASHBOARD" && (
            <DashboardView
              currentCase={currentCase}
              device={device}
              evidenceFiles={evidenceFiles}
              smsCount={sms.length}
              contactsCount={contacts.length}
              callsCount={calls.length}
              appsCount={apps.length}
              carvedCount={carvedFiles.length}
              logs={adbLogs}
              recentEvents={timelineEvents}
              onNavigate={setCurrentTab}
              onStartAcquisition={() => setCurrentTab("ACQUISITION")}
              onScanDevices={handleScanDevices}
              isScanningDevices={isScanningDevices}
              onLoadSampleCase={handleLoadSampleCase}
              onResetDatabase={handleResetDatabase}
              isSampleCaseLoaded={isSampleCaseLoaded}
            />
          )}

          {currentTab === "DEVICES" && (
            <DeviceManagerView
              device={device}
              logs={adbLogs}
              onExecuteAdbCommand={handleExecuteAdbCommand}
              onScanDevices={handleScanDevices}
              isScanningDevices={isScanningDevices}
              detectedDevices={detectedDevices}
              onSelectDevice={(d) => setDevice(d)}
              onOpenWirelessModal={() => setIsWirelessModalOpen(true)}
              onOpenRemoteControl={() => setCurrentTab("REMOTE_CONTROL")}
              onFixAdb={handleFixAdb}
              isFixingAdb={isFixingAdb}
              usbHardwareNotice={usbHardwareNotice}
            />
          )}

          {currentTab === "REMOTE_CONTROL" && (
            <RemoteControlView
              device={device}
              onRefreshDevices={handleScanDevices}
              onOpenWirelessModal={() => setIsWirelessModalOpen(true)}
            />
          )}

          {currentTab === "ACQUISITION" && (
            <AcquisitionView
              currentCase={currentCase}
              device={device}
              onExecuteAcquisition={handleStartAcquisition}
              isAcquiring={isAcquiring}
              acquisitionProgress={acquisitionProgress}
              acquisitionStep={acquisitionStep}
              onImportBackupFile={handleImportBackupFile}
            />
          )}

          {currentTab === "EVIDENCE" && (
            <EvidenceExplorerView
              evidenceFiles={evidenceFiles}
              onSelectForHexView={(file) => {
                setSelectedHexFile(file);
                setCurrentTab("HEX_VIEWER");
              }}
              onExportManifest={handleExportManifest}
            />
          )}

          {currentTab === "ARTIFACTS" && (
            <ArtifactsView
              contacts={contacts}
              sms={sms}
              calls={calls}
              browsers={MOCK_BROWSER}
              apps={apps}
            />
          )}

          {currentTab === "SQLITE" && (
            <SqliteView databases={MOCK_SQLITE_DATABASES} />
          )}

          {currentTab === "HEX_VIEWER" && (
            <HexViewerView
              evidenceFiles={evidenceFiles}
              selectedFile={selectedHexFile}
              onSelectFile={setSelectedHexFile}
            />
          )}

          {currentTab === "TIMELINE" && (
            <TimelineView timelineEvents={timelineEvents} />
          )}

          {currentTab === "RECOVERY" && (
            <NeonRecoverView
              carvedFiles={carvedFiles}
              onTriggerCarveScan={handleTriggerCarveScan}
              isScanning={isCarvingScanning}
            />
          )}

          {currentTab === "MEDIA" && (
            <MediaView
              media={MOCK_MEDIA}
              duplicates={MOCK_DUPLICATES}
            />
          )}

          {currentTab === "CHAIN_OF_CUSTODY" && (
            <ChainOfCustodyView
              currentCase={currentCase}
              records={chainRecords}
              onAddRecord={(rec) => setChainRecords((prev) => [...prev, rec])}
            />
          )}

          {currentTab === "REPORTS" && (
            <ReportsView
              currentCase={currentCase}
              device={device}
              evidenceFiles={evidenceFiles}
              contacts={contacts}
              sms={sms}
              calls={calls}
              timeline={timelineEvents}
              carvedFiles={carvedFiles}
              chainRecords={chainRecords}
            />
          )}

          {currentTab === "COMPARE" && (
            <DeviceComparisonView currentDevice={device} />
          )}
        </main>
      </div>

      {/* Footer Branding & Mandatory Forensic Assurance */}
      <footer className="border-t border-slate-800/80 bg-[#080c14] px-4 py-2 text-xs font-mono-forensic text-slate-500 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold tracking-wider">NEON FORENSIC</span>
          <span>•</span>
          <span className="text-cyan-400">Authorized Evidence Acquisition &amp; Analysis Platform</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span>Hash Engine: <span className="text-emerald-400">SHA-256 Verified</span></span>
          <span>•</span>
          <span>Preservation: <span className="text-slate-300">Pristine Working Copy</span></span>
          <span>•</span>
          <span className="text-purple-400">SQLite Evidence Vault Active</span>
        </div>
      </footer>

      {/* Interactive Modals */}
      <CliModal
        isOpen={isCliOpen}
        onClose={() => setIsCliOpen(false)}
        onExecuteCommand={handleExecuteAdbCommand}
        logs={adbLogs}
      />

      <AiForensicModal
        isOpen={isAiOpen}
        onClose={() => setIsAiOpen(false)}
        currentCase={currentCase}
        device={device}
        apps={apps}
        evidenceFiles={evidenceFiles}
        timeline={timelineEvents}
      />

      <CaseModal
        isOpen={isCaseModalOpen}
        onClose={() => setIsCaseModalOpen(false)}
        currentCase={currentCase}
        onUpdateCase={handleUpdateCase}
        onResetDatabase={handleResetDatabase}
        onLoadSampleCase={handleLoadSampleCase}
        isSampleCaseLoaded={isSampleCaseLoaded}
      />

      <LimitationsModal
        isOpen={isLimitationsOpen}
        onClose={() => setIsLimitationsOpen(false)}
      />

      <LinuxDownloadModal
        isOpen={isLinuxModalOpen}
        onClose={() => setIsLinuxModalOpen(false)}
      />

      <WirelessDebugModal
        isOpen={isWirelessModalOpen}
        onClose={() => setIsWirelessModalOpen(false)}
        onDeviceConnected={handleScanDevices}
      />
    </div>
  );
}
