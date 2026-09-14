import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

// Ensure storage vault directory exists
const VAULT_DIR = path.join(process.cwd(), "evidence_vault");
if (!fs.existsSync(VAULT_DIR)) {
  fs.mkdirSync(VAULT_DIR, { recursive: true });
}

const DB_PATH = path.join(VAULT_DIR, "forensics.db");
const db = new DatabaseSync(DB_PATH);

// Initialize Forensic Relational Schema
export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      investigator TEXT NOT NULL,
      organization TEXT NOT NULL,
      authorization_status TEXT NOT NULL,
      authorization_notes TEXT,
      hash_algorithm TEXT NOT NULL DEFAULT 'SHA-256',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS devices (
      serial TEXT PRIMARY KEY,
      model TEXT,
      manufacturer TEXT,
      market_name TEXT,
      android_version TEXT,
      sdk_version INTEGER,
      build_number TEXT,
      security_patch TEXT,
      battery_level INTEGER,
      is_charging INTEGER,
      root_status TEXT,
      adb_state TEXT,
      usb_vid TEXT,
      usb_pid TEXT,
      encryption_type TEXT,
      connected_at TEXT,
      last_seen TEXT
    );

    CREATE TABLE IF NOT EXISTS evidence_files (
      id TEXT PRIMARY KEY,
      case_id TEXT,
      filename TEXT NOT NULL,
      source TEXT,
      destination TEXT,
      sha256 TEXT NOT NULL,
      sha512 TEXT,
      size INTEGER NOT NULL,
      acquired_at TEXT NOT NULL,
      method TEXT NOT NULL,
      source_device TEXT,
      mime_type TEXT,
      category TEXT,
      status TEXT NOT NULL,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      case_id TEXT,
      name TEXT NOT NULL,
      phone TEXT,
      email TEXT,
      last_contacted TEXT,
      times_contacted INTEGER DEFAULT 0,
      raw_id TEXT
    );

    CREATE TABLE IF NOT EXISTS sms_messages (
      id TEXT PRIMARY KEY,
      case_id TEXT,
      address TEXT NOT NULL,
      body TEXT NOT NULL,
      date TEXT NOT NULL,
      type TEXT NOT NULL,
      read_status INTEGER DEFAULT 1,
      thread_id TEXT
    );

    CREATE TABLE IF NOT EXISTS call_logs (
      id TEXT PRIMARY KEY,
      case_id TEXT,
      number TEXT NOT NULL,
      name TEXT,
      date TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      call_type TEXT NOT NULL,
      cached_location TEXT
    );

    CREATE TABLE IF NOT EXISTS installed_apps (
      id TEXT PRIMARY KEY,
      case_id TEXT,
      package_name TEXT NOT NULL,
      app_name TEXT,
      version TEXT,
      install_time TEXT,
      uid INTEGER,
      is_system INTEGER DEFAULT 0,
      permissions_json TEXT,
      findings_json TEXT
    );

    CREATE TABLE IF NOT EXISTS timeline_events (
      id TEXT PRIMARY KEY,
      case_id TEXT,
      date_time TEXT NOT NULL,
      type TEXT NOT NULL,
      event_description TEXT NOT NULL,
      source TEXT NOT NULL,
      device TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS chain_of_custody (
      id TEXT PRIMARY KEY,
      case_id TEXT,
      timestamp TEXT NOT NULL,
      investigator TEXT NOT NULL,
      action TEXT NOT NULL,
      evidence_id TEXT,
      previous_hash TEXT NOT NULL,
      current_hash TEXT NOT NULL,
      verification_status TEXT NOT NULL DEFAULT 'VERIFIED'
    );

    CREATE TABLE IF NOT EXISTS adb_command_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      device_serial TEXT,
      command TEXT NOT NULL,
      result TEXT NOT NULL,
      output_snippet TEXT
    );
  `);

  // Ensure default active case exists if table is empty
  const countRow = db.prepare("SELECT COUNT(*) as count FROM cases").get() as { count: number };
  if (countRow.count === 0) {
    const genesisTime = new Date().toISOString();
    const caseId = "CASE-LIVE-001";
    db.prepare(`
      INSERT INTO cases (id, name, investigator, organization, authorization_status, authorization_notes, hash_algorithm, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      caseId,
      "Active Incident Triage",
      "Lead Examiner",
      "Digital Forensics & Incident Response Unit",
      "AUTHORIZED",
      "Physical and logical acquisition authorized under official examination protocol.",
      "SHA-256",
      genesisTime,
      genesisTime
    );

    // Initial Genesis block for Chain of Custody
    const genesisHash = crypto.createHash("sha256").update(`GENESIS-${caseId}-${genesisTime}`).digest("hex");
    db.prepare(`
      INSERT INTO chain_of_custody (id, case_id, timestamp, investigator, action, evidence_id, previous_hash, current_hash, verification_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      "COC-01",
      caseId,
      genesisTime,
      "System Genesis",
      "Initialized forensic case container & SQLite evidence vault.",
      caseId,
      "0000000000000000000000000000000000000000000000000000000000000000",
      genesisHash,
      "VERIFIED"
    );
  }

  // Remove legacy placeholder dummy device if present so real Kali devices are accurately displayed
  try {
    db.prepare("DELETE FROM devices WHERE serial = '39241FDJE00388'").run();
  } catch {}
}

// Queries & Operations
export function getActiveCase() {
  return db.prepare("SELECT * FROM cases ORDER BY updated_at DESC LIMIT 1").get();
}

export function updateCase(data: any) {
  const now = new Date().toISOString();
  db.prepare(`
    UPDATE cases 
    SET name = ?, investigator = ?, organization = ?, authorization_status = ?, authorization_notes = ?, hash_algorithm = ?, updated_at = ?
    WHERE id = ?
  `).run(
    data.name,
    data.investigator,
    data.organization,
    data.authorizationStatus || data.authorization_status,
    data.authorizationNotes || data.authorization_notes,
    data.hashAlgorithm || data.hash_algorithm || "SHA-256",
    now,
    data.id
  );
  return getActiveCase();
}

export function getAllDevices() {
  return db.prepare("SELECT * FROM devices ORDER BY last_seen DESC").all();
}

export function saveDevice(dev: any) {
  const stmt = db.prepare(`
    INSERT INTO devices (serial, model, manufacturer, market_name, android_version, sdk_version, build_number, security_patch, battery_level, is_charging, root_status, adb_state, usb_vid, usb_pid, encryption_type, connected_at, last_seen)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(serial) DO UPDATE SET
      model = excluded.model,
      manufacturer = excluded.manufacturer,
      market_name = excluded.market_name,
      android_version = excluded.android_version,
      sdk_version = excluded.sdk_version,
      build_number = excluded.build_number,
      security_patch = excluded.security_patch,
      battery_level = excluded.battery_level,
      is_charging = excluded.is_charging,
      root_status = excluded.root_status,
      adb_state = excluded.adb_state,
      usb_vid = excluded.usb_vid,
      usb_pid = excluded.usb_pid,
      encryption_type = excluded.encryption_type,
      last_seen = excluded.last_seen
  `);

  stmt.run(
    dev.serial,
    dev.model || null,
    dev.manufacturer || null,
    dev.marketName || dev.market_name || null,
    dev.androidVersion || dev.android_version || null,
    dev.sdkVersion || dev.sdk_version || null,
    dev.buildNumber || dev.build_number || null,
    dev.securityPatch || dev.security_patch || null,
    dev.batteryLevel !== undefined ? dev.batteryLevel : dev.battery_level !== undefined ? dev.battery_level : 0,
    dev.isCharging ? 1 : 0,
    dev.rootStatus || dev.root_status || "UNROOTED_SELINUX_ENFORCING",
    dev.adbState || dev.adb_state || "CONNECTED",
    dev.usbVid || dev.usb_vid || null,
    dev.usbPid || dev.usb_pid || null,
    dev.encryptionType || dev.encryption_type || "FBE",
    dev.connectedAt || dev.connected_at || new Date().toISOString(),
    new Date().toISOString()
  );
}

export function getAllEvidenceFiles() {
  return db.prepare("SELECT * FROM evidence_files ORDER BY acquired_at DESC").all();
}

export function insertEvidenceFile(file: any) {
  const stmt = db.prepare(`
    INSERT INTO evidence_files (id, case_id, filename, source, destination, sha256, sha512, size, acquired_at, method, source_device, mime_type, category, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    file.id,
    file.caseId || file.case_id,
    file.filename,
    file.source,
    file.destination,
    file.sha256,
    file.sha512 || null,
    file.size,
    file.acquiredAt || file.acquired_at || new Date().toISOString(),
    file.method,
    file.sourceDevice || file.source_device || null,
    file.mimeType || file.mime_type || null,
    file.category || "General",
    file.status || "ACQUIRED",
    file.notes || null
  );
}

export function getAllArtifacts() {
  const contacts = db.prepare("SELECT * FROM contacts ORDER BY name ASC").all();
  const sms = db.prepare("SELECT * FROM sms_messages ORDER BY date DESC").all();
  const calls = db.prepare("SELECT * FROM call_logs ORDER BY date DESC").all();
  const apps = db.prepare("SELECT * FROM installed_apps ORDER BY app_name ASC").all().map((app: any) => ({
    ...app,
    isSystem: app.is_system === 1,
    permissions: app.permissions_json ? JSON.parse(app.permissions_json) : [],
    suspiciousFindings: app.findings_json ? JSON.parse(app.findings_json) : []
  }));

  return { contacts, sms, calls, apps };
}

export function getAllTimelineEvents() {
  return db.prepare("SELECT * FROM timeline_events ORDER BY date_time DESC").all().map((e: any) => ({
    id: e.id,
    caseId: e.case_id,
    dateTime: e.date_time,
    type: e.type,
    eventDescription: e.event_description,
    source: e.source,
    device: e.device
  }));
}

export function insertTimelineEvent(evt: any) {
  db.prepare(`
    INSERT INTO timeline_events (id, case_id, date_time, type, event_description, source, device)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    evt.id,
    evt.caseId || evt.case_id,
    evt.dateTime || evt.date_time,
    evt.type,
    evt.eventDescription || evt.event_description,
    evt.source,
    evt.device
  );
}

export function getAllChainOfCustody() {
  return db.prepare("SELECT * FROM chain_of_custody ORDER BY timestamp ASC").all().map((r: any) => ({
    id: r.id,
    caseId: r.case_id,
    timestamp: r.timestamp,
    investigator: r.investigator,
    action: r.action,
    evidenceId: r.evidence_id,
    previousEventHash: r.previous_hash,
    currentEventHash: r.current_hash,
    verificationStatus: r.verification_status
  }));
}

export function addChainOfCustodyRecord(rec: any) {
  // Compute valid cryptographic link if not present
  const lastRecord = db.prepare("SELECT current_hash FROM chain_of_custody ORDER BY timestamp DESC LIMIT 1").get() as { current_hash: string } | undefined;
  const prevHash = lastRecord?.current_hash || "0000000000000000000000000000000000000000000000000000000000000000";
  const timestamp = rec.timestamp || new Date().toISOString();
  const currentHash = rec.currentEventHash || crypto.createHash("sha256").update(`${prevHash}-${timestamp}-${rec.investigator}-${rec.action}-${rec.evidenceId || ""}`).digest("hex");

  const id = rec.id || `COC-${Date.now().toString().slice(-4)}`;
  db.prepare(`
    INSERT INTO chain_of_custody (id, case_id, timestamp, investigator, action, evidence_id, previous_hash, current_hash, verification_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    rec.caseId || "CASE-LIVE-001",
    timestamp,
    rec.investigator || "Examiner",
    rec.action,
    rec.evidenceId || null,
    prevHash,
    currentHash,
    "VERIFIED"
  );

  return {
    id,
    timestamp,
    previousEventHash: prevHash,
    currentEventHash: currentHash,
    verificationStatus: "VERIFIED"
  };
}

export function insertContact(c: { id?: string; caseId?: string; name: string; phone?: string; email?: string; lastContacted?: string; timesContacted?: number; rawId?: string }) {
  const id = c.id || `C-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  db.prepare(`
    INSERT INTO contacts (id, case_id, name, phone, email, last_contacted, times_contacted, raw_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, c.caseId || "CASE-LIVE-001", c.name, c.phone || null, c.email || null, c.lastContacted || null, c.timesContacted || 0, c.rawId || null);
}

export function insertSms(s: { id?: string; caseId?: string; address: string; body: string; date: string; type: string; readStatus?: number; threadId?: string }) {
  const id = s.id || `SMS-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  db.prepare(`
    INSERT INTO sms_messages (id, case_id, address, body, date, type, read_status, thread_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, s.caseId || "CASE-LIVE-001", s.address, s.body, s.date, s.type, s.readStatus ?? 1, s.threadId || null);
}

export function insertCallLog(c: { id?: string; caseId?: string; number: string; name?: string; date: string; durationSeconds: number; callType: string; cachedLocation?: string }) {
  const id = c.id || `CALL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  db.prepare(`
    INSERT INTO call_logs (id, case_id, number, name, date, duration_seconds, call_type, cached_location)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, c.caseId || "CASE-LIVE-001", c.number, c.name || null, c.date, c.durationSeconds, c.callType, c.cachedLocation || null);
}

export function insertInstalledApp(a: { id?: string; caseId?: string; packageName: string; appName?: string; version?: string; installTime?: string; uid?: number; isSystem?: boolean; permissions?: string[]; suspiciousFindings?: string[] }) {
  const id = a.id || `APP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  db.prepare(`
    INSERT INTO installed_apps (id, case_id, package_name, app_name, version, install_time, uid, is_system, permissions_json, findings_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id,
    a.caseId || "CASE-LIVE-001",
    a.packageName,
    a.appName || a.packageName.split(".").pop() || a.packageName,
    a.version || "1.0",
    a.installTime || new Date().toISOString(),
    a.uid || 10000,
    a.isSystem ? 1 : 0,
    JSON.stringify(a.permissions || []),
    JSON.stringify(a.suspiciousFindings || [])
  );
}

export function getAdbLogs(limit = 100) {
  return db.prepare("SELECT * FROM adb_command_logs ORDER BY timestamp DESC LIMIT ?").all(limit).map((l: any) => ({
    id: l.id,
    timestamp: l.timestamp,
    deviceSerial: l.device_serial,
    command: l.command,
    result: l.result,
    outputSnippet: l.output_snippet
  }));
}

export function logAdbCommand(log: any) {
  db.prepare(`
    INSERT INTO adb_command_logs (id, timestamp, device_serial, command, result, output_snippet)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    log.id || `LOG-${Date.now().toString().slice(-4)}`,
    log.timestamp || new Date().toISOString(),
    log.deviceSerial || null,
    log.command,
    log.result || "SUCCESS",
    log.outputSnippet || ""
  );
}

// Reset database to completely empty state (for beginning fresh investigation)
export function resetDatabase() {
  db.exec(`
    DELETE FROM evidence_files;
    DELETE FROM contacts;
    DELETE FROM sms_messages;
    DELETE FROM call_logs;
    DELETE FROM installed_apps;
    DELETE FROM timeline_events;
    DELETE FROM chain_of_custody;
    DELETE FROM adb_command_logs;
  `);

  const genesisTime = new Date().toISOString();
  const caseRow = getActiveCase() as any;
  const caseId = caseRow ? caseRow.id : "CASE-LIVE-001";
  const genesisHash = crypto.createHash("sha256").update(`GENESIS-${caseId}-${genesisTime}`).digest("hex");

  db.prepare(`
    INSERT INTO chain_of_custody (id, case_id, timestamp, investigator, action, evidence_id, previous_hash, current_hash, verification_status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    "COC-01",
    caseId,
    genesisTime,
    "Examiner",
    "Evidence vault initialized. Clean slate for new target acquisition.",
    caseId,
    "0000000000000000000000000000000000000000000000000000000000000000",
    genesisHash,
    "VERIFIED"
  );
}

// Optional: Explicitly populate simulated lab training dataset ONLY when requested
export function seedSampleTrainingCase() {
  resetDatabase();

  const caseId = "CASE-LIVE-001";
  const now = new Date().toISOString();

  // 1. Evidence Files
  const sampleFiles = [
    {
      id: "EV-001",
      case_id: caseId,
      filename: "mmssms.db",
      source: "/data/user_de/0/com.android.providers.telephony/databases/mmssms.db",
      destination: "/evidence_vault/cases/CASE-LIVE-001/telephony/mmssms.db",
      sha256: "9e3c98d6411d3bbca818bf5d398f6d8959d68541e457f50a80e1bb188f8d68ef",
      sha512: "a430ffbc8c7407a51804c81a5a7df42718ec25f9b421a1b41ecab9d5e305e5812d4d9b3a0e1c0c29f27022d41b539c2794ebf2ffac3e488107a783a30554db25",
      size: 262144,
      acquired_at: now,
      method: "LOGICAL_ADB_PULL",
      source_device: "Pixel_Test_Target",
      mime_type: "application/vnd.sqlite3",
      category: "Databases",
      status: "ACQUIRED",
      notes: "Telephony SMS/MMS content store acquired under consent."
    },
    {
      id: "EV-002",
      case_id: caseId,
      filename: "contacts2.db",
      source: "/data/data/com.android.providers.contacts/databases/contacts2.db",
      destination: "/evidence_vault/cases/CASE-LIVE-001/contacts/contacts2.db",
      sha256: "3d508493cd6de4a22ad39a2b85e053a479b188c03e878e146747df5a2da13251",
      size: 524288,
      acquired_at: now,
      method: "LOGICAL_ADB_PULL",
      source_device: "Pixel_Test_Target",
      mime_type: "application/vnd.sqlite3",
      category: "Databases",
      status: "ACQUIRED",
      notes: "Address book & aggregated raw contacts."
    }
  ];

  for (const f of sampleFiles) {
    db.prepare(`
      INSERT INTO evidence_files (id, case_id, filename, source, destination, sha256, sha512, size, acquired_at, method, source_device, mime_type, category, status, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(f.id, f.case_id, f.filename, f.source, f.destination, f.sha256, f.sha512 || null, f.size, f.acquired_at, f.method, f.source_device, f.mime_type, f.category, f.status, f.notes);
  }

  // 2. Apps
  const apps = [
    {
      id: "APP-01",
      case_id: caseId,
      package_name: "com.cryptocore.vault",
      app_name: "CryptoCore Vault",
      version: "1.4.2",
      install_time: "2026-09-08 19:40:00",
      uid: 10245,
      is_system: 0,
      permissions_json: JSON.stringify(["android.permission.INTERNET", "android.permission.RECEIVE_BOOT_COMPLETED", "android.permission.READ_EXTERNAL_STORAGE"]),
      findings_json: JSON.stringify(["Sideloaded APK outside Google Play", "Self-signed certificate", "Hardcoded C2 endpoint: 185.220.101.42"])
    },
    {
      id: "APP-02",
      case_id: caseId,
      package_name: "org.thoughtcrime.securesms",
      app_name: "Signal Messenger",
      version: "7.12.0",
      install_time: "2025-11-12 11:20:00",
      uid: 10189,
      is_system: 0,
      permissions_json: JSON.stringify(["android.permission.CAMERA", "android.permission.RECORD_AUDIO", "android.permission.INTERNET"]),
      findings_json: JSON.stringify([])
    }
  ];

  for (const a of apps) {
    db.prepare(`
      INSERT INTO installed_apps (id, case_id, package_name, app_name, version, install_time, uid, is_system, permissions_json, findings_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(a.id, a.case_id, a.package_name, a.app_name, a.version, a.install_time, a.uid, a.is_system, a.permissions_json, a.findings_json);
  }

  // 3. Contacts
  db.prepare(`
    INSERT INTO contacts (id, case_id, name, phone, email, last_contacted, times_contacted, raw_id)
    VALUES ('C-01', ?, 'Alex Vance', '+1-555-019-2831', 'alex.vance@blackmesa.org', '2026-09-10 14:15:00', 14, '101'),
           ('C-02', ?, 'Marcus Sterling', '+44-7911-123456', 'm.sterling@swissvault.ch', '2026-09-08 03:19:00', 5, '102')
  `).run(caseId, caseId);

  // 4. SMS
  db.prepare(`
    INSERT INTO sms_messages (id, case_id, address, body, date, type, read_status, thread_id)
    VALUES ('SMS-01', ?, '+44-7911-123456', 'Payload transfer initiated. Access token expires in 15 minutes.', '2026-09-08 03:19:22', 'INCOMING', 1, '12'),
           ('SMS-02', ?, '+44-7911-123456', 'Confirmed. Archive downloaded and SHA-256 verified.', '2026-09-08 03:22:10', 'OUTGOING', 1, '12')
  `).run(caseId, caseId);

  // 5. Calls
  db.prepare(`
    INSERT INTO call_logs (id, case_id, number, name, date, duration_seconds, call_type, cached_location)
    VALUES ('CALL-01', ?, '+44-7911-123456', 'Marcus Sterling', '2026-09-08 03:15:10', 214, 'INCOMING', 'International Roaming (+44)'),
           ('CALL-02', ?, '+1-555-019-2831', 'Alex Vance', '2026-09-07 18:42:00', 88, 'OUTGOING', 'San Francisco, CA')
  `).run(caseId, caseId);

  // 6. Timeline
  db.prepare(`
    INSERT INTO timeline_events (id, case_id, date_time, type, event_description, source, device)
    VALUES ('EVT-01', ?, '2026-09-08T03:19:22Z', 'SMS', 'Incoming SMS from Marcus Sterling regarding payload transfer', 'mmssms.db', 'Pixel_Target'),
           ('EVT-02', ?, '2026-09-08T19:40:00Z', 'APPLICATION', 'Sideloaded installation: com.cryptocore.vault', 'PackageInstaller', 'Pixel_Target')
  `).run(caseId, caseId);

  // 7. Chain of Custody
  addChainOfCustodyRecord({
    caseId,
    investigator: "Lead Examiner",
    action: "Loaded sample demonstration case for forensic workstation calibration.",
    evidenceId: caseId
  });
}
