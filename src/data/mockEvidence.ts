import {
  ForensicCase,
  AndroidDevice,
  AdbCommandLog,
  EvidenceFile,
  ContactArtifact,
  SmsArtifact,
  CallLogArtifact,
  BrowserArtifact,
  ApplicationArtifact,
  MediaArtifact,
  SQLiteDatabaseArtifact,
  TimelineEvent,
  CarvedFileArtifact,
  ChainOfCustodyRecord,
  DuplicateDetectionItem,
} from "../types/forensics";

export const INITIAL_CASE: ForensicCase = {
  id: "CASE-2026-0914-NF",
  name: "Operation Cygnus - Mobile Security Incident",
  investigator: "Special Agent R. Vance (Badge #7492)",
  organization: "Digital Forensics & Incident Response Lab (DFIR)",
  evidenceOwner: "Enterprise Asset Fleet (Auth #REQ-88210)",
  authorizationStatus: "AUTHORIZED",
  authorizationConfirmedAt: "2026-09-11T09:15:00Z",
  authorizationNotes:
    "Formal warrant & corporate forensics directive authenticated. Device submitted voluntarily by authorized system administrator.",
  deviceIdentifier: "Pixel_8_Pro_husky_990142A",
  acquisitionDateTime: "2026-09-11T09:30:22Z",
  timezone: "UTC-07:00 (Pacific Daylight Time)",
  notes:
    "Target examination for unauthorized data exfiltration, shadow APK installations, and suspicious external communications.",
  evidenceLocation: "/evidence/cases/2026-0914-NF/raw_working_copy",
  hashAlgorithm: "SHA-256",
  createdAt: "2026-09-11T09:15:00Z",
  status: "ACTIVE",
};

export const INITIAL_DEVICE: AndroidDevice = {
  serial: "39241FDJE00388",
  manufacturer: "Google",
  model: "Pixel 8 Pro",
  marketName: "Google Pixel 8 Pro (husky)",
  androidVersion: "14.0 (VanillaIceCream / API 34)",
  sdkVersion: 34,
  buildFingerprint:
    "google/husky/husky:14/UQ1A.240205.004/11269921:user/release-keys",
  securityPatch: "2026-08-05",
  adbState: "CONNECTED",
  usbState: "ATTACHED",
  vendorId: "0x18D1",
  productId: "0x4EE7",
  usbMode: "MTP",
  rootStatus: "SELINUX_ENFORCING",
  batteryLevel: 91,
  batteryHealth: "GOOD (4180 mV, 29.4°C)",
  storage: {
    totalBytes: 256000000000,
    usedBytes: 84200000000,
    sharedBytes: 42100000000,
    encryptionType: "FILE_BASED_ENCRYPTION_FBE",
  },
  tcpIpEnabled: true,
  ipAddress: "192.168.1.145",
  tcpPort: 5555,
};

export const MOCK_ADB_LOGS: AdbCommandLog[] = [
  {
    id: "LOG-001",
    timestamp: "2026-09-11T09:28:01Z",
    deviceSerial: "39241FDJE00388",
    command: "adb devices -l",
    result: "SUCCESS",
    outputSnippet: "39241FDJE00388 device usb:3-1 product:husky model:Pixel_8_Pro",
  },
  {
    id: "LOG-002",
    timestamp: "2026-09-11T09:28:04Z",
    deviceSerial: "39241FDJE00388",
    command: "adb shell getprop ro.build.fingerprint",
    result: "SUCCESS",
    outputSnippet: "google/husky/husky:14/UQ1A.240205.004/11269921:user/release-keys",
  },
  {
    id: "LOG-003",
    timestamp: "2026-09-11T09:28:10Z",
    deviceSerial: "39241FDJE00388",
    command: "adb shell pm list packages -f -3",
    result: "SUCCESS",
    outputSnippet: "package:/data/app/.../base.apk=org.thoughtcrime.securesms",
  },
  {
    id: "LOG-004",
    timestamp: "2026-09-11T09:28:15Z",
    deviceSerial: "39241FDJE00388",
    command: "adb shell dumpsys battery",
    result: "SUCCESS",
    outputSnippet: "AC powered: false, USB powered: true, level: 91, status: 2",
  },
  {
    id: "LOG-005",
    timestamp: "2026-09-11T09:29:40Z",
    deviceSerial: "39241FDJE00388",
    command: "adb pull /sdcard/DCIM/Camera /evidence/media/",
    result: "SUCCESS",
    outputSnippet: "pulled 18 files. 42.8 MB/s (184291882 bytes in 4.301s)",
  },
];

export const MOCK_EVIDENCE_FILES: EvidenceFile[] = [
  {
    id: "EV-01",
    source: "/sdcard/DCIM/Camera/IMG_20260909_142301.jpg",
    destination: "/evidence/media/IMG_20260909_142301.jpg",
    filename: "IMG_20260909_142301.jpg",
    sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    sha512: "ee26b0dd4af7e749aa1a8ee3c10ae9923f618980772e473f8819a5d4e2ee78c900455a1",
    size: 4289104,
    acquiredAt: "2026-09-11T09:31:02Z",
    method: "ADB_PULL",
    sourceDevice: "39241FDJE00388",
    mimeType: "image/jpeg",
    category: "Images",
    status: "ACQUIRED",
    notes: "Original photo with complete EXIF and GPS tags intact.",
    hexPreview: "FF D8 FF E1 18 32 45 78 69 66 00 00 4D 4D 00 2A 00 00 00 08 00 0B",
  },
  {
    id: "EV-02",
    source: "/data/data/com.android.providers.telephony/databases/mmssms.db",
    destination: "/evidence/databases/mmssms.db",
    filename: "mmssms.db",
    sha256: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    size: 524288,
    acquiredAt: "2026-09-11T09:32:15Z",
    method: "BACKUP_EXTRACT",
    sourceDevice: "39241FDJE00388",
    mimeType: "application/vnd.sqlite3",
    category: "Databases",
    status: "PARSED",
    notes: "Extracted via authorized backup provider. WAL journal merged.",
    hexPreview: "53 51 4C 69 74 65 20 66 6F 72 6D 61 74 20 33 00 10 00 01 01 00 40",
  },
  {
    id: "EV-03",
    source: "/data/data/com.android.providers.contacts/databases/contacts2.db",
    destination: "/evidence/databases/contacts2.db",
    filename: "contacts2.db",
    sha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    size: 1048576,
    acquiredAt: "2026-09-11T09:32:45Z",
    method: "BACKUP_EXTRACT",
    sourceDevice: "39241FDJE00388",
    mimeType: "application/vnd.sqlite3",
    category: "Databases",
    status: "PARSED",
    notes: "Main Android contacts store. 142 raw contact records.",
    hexPreview: "53 51 4C 69 74 65 20 66 6F 72 6D 61 74 20 33 00 10 00 01 01 00 40",
  },
  {
    id: "EV-04",
    source: "/data/app/~~shadowApp1029/com.cryptocore.vault-1/base.apk",
    destination: "/evidence/apks/com.cryptocore.vault.apk",
    filename: "com.cryptocore.vault.apk",
    sha256: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    size: 14829100,
    acquiredAt: "2026-09-11T09:33:10Z",
    method: "ADB_PULL",
    sourceDevice: "39241FDJE00388",
    mimeType: "application/vnd.android.package-archive",
    category: "APK",
    status: "PARSED",
    notes: "Sideloaded third-party vault application requesting dangerous SMS permissions.",
    hexPreview: "50 4B 03 04 14 00 08 00 08 00 E1 82 5B 58 8A 19 C0 42 20 1A 00 00",
  },
  {
    id: "EV-05",
    source: "/sdcard/Download/encrypted_exfil_bundle.tar.gz",
    destination: "/evidence/archives/encrypted_exfil_bundle.tar.gz",
    filename: "encrypted_exfil_bundle.tar.gz",
    sha256: "ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
    size: 3810492,
    acquiredAt: "2026-09-11T09:33:55Z",
    method: "ADB_PULL",
    sourceDevice: "39241FDJE00388",
    mimeType: "application/gzip",
    category: "Archives",
    status: "ENCRYPTED",
    notes: "GZIP archive with secondary password encryption. Contents cannot be read without key.",
    hexPreview: "1F 8B 08 00 00 00 00 00 00 03 ED BD 07 60 1C 49 96 25 26 2F 6D 98",
  },
  {
    id: "EV-06",
    source: "/data/data/com.whatsapp/databases/msgstore.db",
    destination: "/evidence/databases/msgstore.db",
    filename: "msgstore.db",
    sha256: "0000000000000000000000000000000000000000000000000000000000000000",
    size: 0,
    acquiredAt: "2026-09-11T09:34:20Z",
    method: "ADB_PULL",
    sourceDevice: "39241FDJE00388",
    mimeType: "application/octet-stream",
    category: "Databases",
    status: "INACCESSIBLE",
    notes: "ACCESS DENIED: Android application sandbox prevents non-root access without user backup authorization.",
    hexPreview: "",
  },
];

export const MOCK_CONTACTS: ContactArtifact[] = [
  {
    id: "CNT-01",
    name: "Elena Rostova",
    phone: "+1 (415) 892-0193",
    email: "e.rostova@corpglobal.ch",
    timesContacted: 48,
    lastContactedTime: "2026-09-10T22:15:30Z",
    sourceDatabase: "contacts2.db",
    status: "PARSED",
  },
  {
    id: "CNT-02",
    name: "Marcus Thorne (Ops)",
    phone: "+1 (202) 555-0149",
    email: "m.thorne@protonmail.com",
    timesContacted: 19,
    lastContactedTime: "2026-09-09T18:40:12Z",
    sourceDatabase: "contacts2.db",
    status: "PARSED",
  },
  {
    id: "CNT-03",
    name: "Dr. Sarah Lin",
    phone: "+1 (650) 492-3310",
    email: "sarah.lin@biocenter.org",
    timesContacted: 112,
    lastContactedTime: "2026-09-10T14:02:00Z",
    sourceDatabase: "contacts2.db",
    status: "PARSED",
  },
  {
    id: "CNT-04",
    name: "Unknown [Signal Relay]",
    phone: "+44 7911 123456",
    email: "relay992@tempmail.io",
    timesContacted: 3,
    lastContactedTime: "2026-09-08T03:19:22Z",
    sourceDatabase: "contacts2.db",
    status: "PARSED",
  },
];

export const MOCK_SMS: SmsArtifact[] = [
  {
    id: "SMS-001",
    sender: "+1 (415) 892-0193",
    recipient: "Device Owner",
    message: "Meeting confirmed at 14:00. Ensure offline device policy is enforced.",
    timestamp: "2026-09-10T13:45:10Z",
    direction: "INCOMING",
    threadId: 101,
    read: true,
    sourceDatabase: "mmssms.db",
    status: "PARSED",
  },
  {
    id: "SMS-002",
    sender: "Device Owner",
    recipient: "+1 (415) 892-0193",
    message: "Understood. The project manifest archive is prepped on local storage.",
    timestamp: "2026-09-10T13:46:02Z",
    direction: "OUTGOING",
    threadId: 101,
    read: true,
    sourceDatabase: "mmssms.db",
    status: "PARSED",
  },
  {
    id: "SMS-003",
    sender: "+44 7911 123456",
    recipient: "Device Owner",
    message: "Relay handshake verification code: [789-021]. Key expires in 15 minutes.",
    timestamp: "2026-09-08T03:19:22Z",
    direction: "INCOMING",
    threadId: 104,
    read: true,
    sourceDatabase: "mmssms.db",
    status: "PARSED",
  },
  {
    id: "SMS-004",
    sender: "33829 (Bank 2FA)",
    recipient: "Device Owner",
    message: "Your authentication token is 449210 for account transfer. Never share this code.",
    timestamp: "2026-09-07T11:04:19Z",
    direction: "INCOMING",
    threadId: 99,
    read: true,
    sourceDatabase: "mmssms.db",
    status: "PARSED",
  },
];

export const MOCK_CALLS: CallLogArtifact[] = [
  {
    id: "CALL-01",
    number: "+1 (415) 892-0193",
    contactName: "Elena Rostova",
    callType: "INCOMING",
    timestamp: "2026-09-10T22:12:00Z",
    durationSeconds: 210,
    locationTag: "San Francisco, CA (MCC 310)",
    sourceDatabase: "calllog.db",
    status: "PARSED",
  },
  {
    id: "CALL-02",
    number: "+1 (202) 555-0149",
    contactName: "Marcus Thorne (Ops)",
    callType: "OUTGOING",
    timestamp: "2026-09-09T18:38:00Z",
    durationSeconds: 132,
    locationTag: "San Francisco, CA",
    sourceDatabase: "calllog.db",
    status: "PARSED",
  },
  {
    id: "CALL-03",
    number: "+44 7911 123456",
    contactName: "Unknown [Signal Relay]",
    callType: "MISSED",
    timestamp: "2026-09-08T03:18:00Z",
    durationSeconds: 0,
    locationTag: "International (United Kingdom)",
    sourceDatabase: "calllog.db",
    status: "PARSED",
  },
];

export const MOCK_BROWSER: BrowserArtifact[] = [
  {
    id: "BRW-01",
    url: "https://swissvault-storage.ch/transfer/p882194",
    title: "SwissVault Secure File Gateway - Upload Ready",
    visitTimestamp: "2026-09-10T17:22:04Z",
    searchTerms: "secure anonymous encrypted upload gateway",
    browserProfile: "Chrome Default (Profile 1)",
    visitCount: 7,
    sourceDatabase: "Chrome_History.db",
    status: "PARSED",
  },
  {
    id: "BRW-02",
    url: "https://developer.android.com/tools/adb",
    title: "Android Debug Bridge (adb) Documentation | Android Developers",
    visitTimestamp: "2026-09-09T11:05:18Z",
    searchTerms: "adb enable tcpip 5555 without cable",
    browserProfile: "Chrome Default (Profile 1)",
    visitCount: 3,
    sourceDatabase: "Chrome_History.db",
    status: "PARSED",
  },
  {
    id: "BRW-03",
    url: "https://virustotal.com/gui/file/4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    title: "VirusTotal - File Analysis - com.cryptocore.vault.apk",
    visitTimestamp: "2026-09-08T19:44:50Z",
    searchTerms: "cryptocore vault detection evasion",
    browserProfile: "Chrome Default (Profile 1)",
    visitCount: 2,
    sourceDatabase: "Chrome_History.db",
    status: "PARSED",
  },
];

export const MOCK_APPLICATIONS: ApplicationArtifact[] = [
  {
    packageName: "com.cryptocore.vault",
    appName: "CryptoCore Secure Vault",
    versionName: "2.4.1",
    versionCode: 241,
    uid: 10244,
    apkPath: "/data/app/~~shadowApp1029/com.cryptocore.vault-1/base.apk",
    sha256: "4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    fileSize: 14829100,
    firstInstallTime: "2026-09-08T19:40:00Z",
    lastUpdateTime: "2026-09-08T19:40:00Z",
    permissions: [
      { permission: "android.permission.RECEIVE_BOOT_COMPLETED", level: "NORMAL", granted: true },
      { permission: "android.permission.READ_SMS", level: "DANGEROUS", granted: true },
      { permission: "android.permission.INTERNET", level: "NORMAL", granted: true },
      { permission: "android.permission.ACCESS_FINE_LOCATION", level: "DANGEROUS", granted: true },
      { permission: "android.permission.SYSTEM_ALERT_WINDOW", level: "DANGEROUS", granted: true },
    ],
    suspiciousFindings: [
      "Dangerous SMS reading permission in non-telephony application",
      "Self-signed debug certificate (CN=Android Debug, O=Android, C=US)",
      "Hardcoded external C2 server reference: https://api.darkvault-mesh.xyz:8443",
      "Sideloaded from untrusted source (installer: com.android.shell)",
    ],
    status: "PARSED",
  },
  {
    packageName: "org.thoughtcrime.securesms",
    appName: "Signal",
    versionName: "7.12.0",
    versionCode: 149200,
    uid: 10198,
    apkPath: "/data/app/~~signalApp991/org.thoughtcrime.securesms-1/base.apk",
    sha256: "77aa9910f1c0199482918bbda381028371948192038102938102938102938102",
    fileSize: 52100490,
    firstInstallTime: "2025-11-14T10:00:00Z",
    lastUpdateTime: "2026-08-20T14:30:00Z",
    permissions: [
      { permission: "android.permission.READ_CONTACTS", level: "DANGEROUS", granted: true },
      { permission: "android.permission.CAMERA", level: "DANGEROUS", granted: true },
      { permission: "android.permission.RECORD_AUDIO", level: "DANGEROUS", granted: true },
    ],
    suspiciousFindings: [],
    status: "PARSED",
  },
  {
    packageName: "com.google.android.apps.messaging",
    appName: "Messages",
    versionName: "20260815_01_RC00",
    versionCode: 881920,
    uid: 10042,
    apkPath: "/system_ext/priv-app/Messages/Messages.apk",
    sha256: "3388291038192038192038192038192038192038192038192038192038192038",
    fileSize: 41200192,
    firstInstallTime: "2024-10-04T00:00:00Z",
    lastUpdateTime: "2026-08-15T00:00:00Z",
    permissions: [
      { permission: "android.permission.SEND_SMS", level: "DANGEROUS", granted: true },
      { permission: "android.permission.READ_PHONE_STATE", level: "DANGEROUS", granted: true },
    ],
    suspiciousFindings: [],
    status: "PARSED",
  },
];

export const MOCK_MEDIA: MediaArtifact[] = [
  {
    id: "MED-01",
    filename: "IMG_20260909_142301.jpg",
    path: "/sdcard/DCIM/Camera/IMG_20260909_142301.jpg",
    mime: "image/jpeg",
    size: 4289104,
    createdTime: "2026-09-09T14:23:01Z",
    modifiedTime: "2026-09-09T14:23:01Z",
    dimensions: "4080 x 3072 (12.5 MP)",
    cameraModel: "Google Pixel 8 Pro",
    exif: {
      Make: "Google",
      Model: "Pixel 8 Pro",
      FocalLength: "6.9mm (24mm equiv.)",
      Aperture: "f/1.68",
      ISO: "42",
      ExposureTime: "1/450s",
      Flash: "No Flash",
      Software: "HDR+ 1.0.60228",
    },
    gps: {
      latitude: 37.789172,
      longitude: -122.401449,
      altitude: 18.4,
      addressDescription: "Financial District, San Francisco, CA",
    },
    perceptualHash: "a4f899c011e4d3c2",
    sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    status: "PARSED",
  },
  {
    id: "MED-02",
    filename: "Screenshot_20260910_172500.png",
    path: "/sdcard/Pictures/Screenshots/Screenshot_20260910_172500.png",
    mime: "image/png",
    size: 1948201,
    createdTime: "2026-09-10T17:25:00Z",
    modifiedTime: "2026-09-10T17:25:00Z",
    dimensions: "1344 x 2992",
    cameraModel: "System Framebuffer",
    exif: {
      ColorSpace: "sRGB",
      BitDepth: "8-bit",
      Compression: "PNG Deflate",
    },
    perceptualHash: "ffff880011002233",
    sha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
    status: "PARSED",
  },
];

export const MOCK_SQLITE_DATABASES: SQLiteDatabaseArtifact[] = [
  {
    id: "DB-01",
    dbName: "mmssms.db",
    path: "/evidence/databases/mmssms.db",
    fileSize: 524288,
    sha256: "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9",
    status: "PARSED",
    tables: [
      {
        tableName: "sms",
        rowCount: 4,
        walDetected: true,
        journalMode: "WAL",
        columns: [
          { name: "_id", type: "INTEGER", isPrimary: true },
          { name: "thread_id", type: "INTEGER" },
          { name: "address", type: "TEXT" },
          { name: "date", type: "INTEGER" },
          { name: "body", type: "TEXT" },
          { name: "type", type: "INTEGER" },
        ],
        sampleRows: [
          { _id: 1, thread_id: 101, address: "+14158920193", date: 1789047910000, body: "Meeting confirmed at 14:00.", type: 1 },
          { _id: 2, thread_id: 101, address: "+14158920193", date: 1789047962000, body: "Understood. Manifest is prepped.", type: 2 },
          { _id: 3, thread_id: 104, address: "+447911123456", date: 1788837562000, body: "Relay handshake code: [789-021]", type: 1 },
          { _id: 4, thread_id: 99, address: "33829", date: 1788779059000, body: "Your auth token is 449210", type: 1 },
        ],
      },
      {
        tableName: "threads",
        rowCount: 3,
        walDetected: true,
        journalMode: "WAL",
        columns: [
          { name: "_id", type: "INTEGER", isPrimary: true },
          { name: "date", type: "INTEGER" },
          { name: "message_count", type: "INTEGER" },
          { name: "recipient_ids", type: "TEXT" },
        ],
        sampleRows: [
          { _id: 101, date: 1789047962000, message_count: 2, recipient_ids: "1" },
          { _id: 104, date: 1788837562000, message_count: 1, recipient_ids: "2" },
          { _id: 99, date: 1788779059000, message_count: 1, recipient_ids: "3" },
        ],
      },
    ],
  },
  {
    id: "DB-02",
    dbName: "contacts2.db",
    path: "/evidence/databases/contacts2.db",
    fileSize: 1048576,
    sha256: "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    status: "PARSED",
    tables: [
      {
        tableName: "raw_contacts",
        rowCount: 4,
        walDetected: false,
        journalMode: "DELETE",
        columns: [
          { name: "_id", type: "INTEGER", isPrimary: true },
          { name: "account_name", type: "TEXT" },
          { name: "display_name", type: "TEXT" },
          { name: "times_contacted", type: "INTEGER" },
          { name: "last_time_contacted", type: "INTEGER" },
        ],
        sampleRows: [
          { _id: 1, account_name: "primary_google", display_name: "Elena Rostova", times_contacted: 48, last_time_contacted: 1789078530000 },
          { _id: 2, account_name: "primary_google", display_name: "Marcus Thorne (Ops)", times_contacted: 19, last_time_contacted: 1788979212000 },
          { _id: 3, account_name: "primary_google", display_name: "Dr. Sarah Lin", times_contacted: 112, last_time_contacted: 1789048920000 },
          { _id: 4, account_name: "local_device", display_name: "Unknown [Signal Relay]", times_contacted: 3, last_time_contacted: 1788837562000 },
        ],
      },
    ],
  },
];

export const MOCK_TIMELINE: TimelineEvent[] = [
  {
    id: "EVT-01",
    dateTime: "2026-09-08T03:18:00Z",
    type: "CALL",
    eventDescription: "Missed incoming voice call from +44 7911 123456 (United Kingdom)",
    source: "calllog.db",
    device: "Pixel 8 Pro",
    evidenceFile: "calllog.db",
  },
  {
    id: "EVT-02",
    dateTime: "2026-09-08T03:19:22Z",
    type: "SMS",
    eventDescription: "Received SMS: 'Relay handshake verification code: [789-021]'",
    source: "mmssms.db",
    device: "Pixel 8 Pro",
    evidenceFile: "mmssms.db",
  },
  {
    id: "EVT-03",
    dateTime: "2026-09-08T19:40:00Z",
    type: "APPLICATION",
    eventDescription: "Sideloaded APK installation: com.cryptocore.vault (UID 10244)",
    source: "package_manager_events",
    device: "Pixel 8 Pro",
    evidenceFile: "com.cryptocore.vault.apk",
  },
  {
    id: "EVT-04",
    dateTime: "2026-09-09T11:05:18Z",
    type: "BROWSER",
    eventDescription: "Chrome Visit: Android Debug Bridge (adb) Documentation (query: 'adb enable tcpip 5555')",
    source: "Chrome_History.db",
    device: "Pixel 8 Pro",
  },
  {
    id: "EVT-05",
    dateTime: "2026-09-09T14:23:01Z",
    type: "MEDIA",
    eventDescription: "Camera capture: IMG_20260909_142301.jpg at GPS 37.789172, -122.401449",
    source: "DCIM/Camera",
    device: "Pixel 8 Pro",
    evidenceFile: "IMG_20260909_142301.jpg",
  },
  {
    id: "EVT-06",
    dateTime: "2026-09-10T13:46:02Z",
    type: "SMS",
    eventDescription: "Sent SMS to Elena Rostova: 'Understood. The project manifest archive is prepped on local storage.'",
    source: "mmssms.db",
    device: "Pixel 8 Pro",
    evidenceFile: "mmssms.db",
  },
  {
    id: "EVT-07",
    dateTime: "2026-09-10T17:22:04Z",
    type: "BROWSER",
    eventDescription: "Chrome Visit: SwissVault Secure File Gateway - Upload Ready",
    source: "Chrome_History.db",
    device: "Pixel 8 Pro",
  },
  {
    id: "EVT-08",
    dateTime: "2026-09-11T09:30:22Z",
    type: "LOG",
    eventDescription: "Forensic Acquisition initiated under Case #2026-0914-NF by Agent Vance",
    source: "NEON_FORENSIC_CORE",
    device: "Pixel 8 Pro",
  },
];

export const MOCK_CARVED_FILES: CarvedFileArtifact[] = [
  {
    id: "CARVE-PDF-01",
    filename: "confidential_acquisition_terms_2026.pdf",
    fileType: "PDF",
    category: "Documents",
    offset: "0x005E2000",
    offsetDec: 6168576,
    size: 421800,
    status: "RECOVERED",
    signatureMatch: "PDF Document (%PDF-1.7)",
    sha256: "e7b8c9d0123456789abcdef0123456789abcdef0123456789abcdef012345678",
    validationDetails: "%PDF-1.7 header and %%EOF cross-reference trailer parsed without corruption. 4 embedded stream objects extracted.",
    recoveryNote: "Carved from unallocated shared storage cluster following user deliberate deletion.",
    recoveryMethod: "MAGIC_HEADER_CARVE",
    deletedOriginalPath: "/sdcard/Documents/Confidential/confidential_acquisition_terms_2026.pdf",
    recoveredSource: "Unallocated Cluster Block #12048",
    recoveredTimestamp: "2026-09-10T18:22:15Z",
    contentSnippet: `========================================================================
             CONFIDENTIAL ASSET PURCHASE & LICENSING AGREEMENT
========================================================================
DATED: SEPTEMBER 08, 2026
PARTIES:
1. TARGET ENTITY: AXIOM DYNAMICS HOLDINGS LTD. (GENEVA, SWITZERLAND)
2. PURCHASER: APEX PRIVATE SECURED LEDGER CORP. (SINGAPORE)

ARTICLE I: RECITALS & SCOPE
The Purchaser hereby agrees to acquire all proprietary cryptographic keys,
neural network architecture definitions, and off-chain vault hashes held
under Case Reference: REF-9902-SWISS.

ARTICLE II: CONSIDERATION & ESCROW
- Total Purchase Consideration: $14,500,000 USD (Cryptographic Escrow)
- Tranche 1: 40% upon confirmation of private seed phrase delivery.
- Tranche 2: 60% upon cryptographic verification of cold storage multi-sig.

ARTICLE III: FORENSIC NON-DISCLOSURE
Both parties acknowledge that all forensic logs, device pairing records,
and hardware identifiers shall be zeroized upon execution completion.
AUTHORIZED SIGNATORY: Marcus Thorne (Director of Operations)
========================================================================`,
    hexDump: `00000000  25 50 44 46 2D 31 2E 37  0A 25 E2 E3 CF D3 0A 34  |%PDF-1.7.%.....4|
00000010  20 30 20 6F 62 6A 0A 3C  3C 2F 4C 65 6E 67 74 68  | 0 obj.<</Length|
00000020  20 35 38 32 30 2F 46 69  6C 74 65 72 2F 46 6C 61  | 5820/Filter/Fla|
00000030  74 65 44 65 63 6F 64 65  3E 3E 73 74 72 65 61 6D  |teDecode>>stream|`,
    metadata: {
      Title: "Confidential Asset Purchase Agreement",
      Author: "Marcus Thorne",
      Pages: "3 Pages",
      Encryption: "None (Standard FlateDecode)",
      CreatedDate: "2026-09-08 11:20:00",
      DeletedDate: "2026-09-10 18:22:15",
    },
    mimeType: "application/pdf",
  },
  {
    id: "CARVE-IMG-02",
    filename: "deleted_camera_IMG_20260908_142301.jpg",
    fileType: "JPEG",
    category: "Images",
    offset: "0x001A8400",
    offsetDec: 1737728,
    size: 384910,
    status: "RECOVERED",
    signatureMatch: "JPEG Image (FF D8 FF E1) EXIF 2.31",
    sha256: "9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b",
    validationDetails: "Full resolution JPEG image recovered intact from .thumbnails inode cache with embedded GPS and camera metadata.",
    recoveryNote: "User deleted photo from DCIM/Camera; reconstructed from persistent hardware thumbnail block with 100% fidelity.",
    recoveryMethod: "THUMBNAIL_RECONSTRUCT",
    deletedOriginalPath: "/sdcard/DCIM/Camera/IMG_20260908_142301.jpg",
    recoveredSource: "/sdcard/DCIM/.thumbnails/1725805381000.jpg",
    recoveredTimestamp: "2026-09-09T14:23:01Z",
    previewUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="600" height="400" viewBox="0 0 600 400">
  <defs>
    <linearGradient id="sky" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#0a1128"/>
      <stop offset="60%" stop-color="#1c2541"/>
      <stop offset="100%" stop-color="#3a506b"/>
    </linearGradient>
  </defs>
  <rect width="600" height="400" fill="url(#sky)"/>
  <polygon points="40,400 40,220 90,200 130,220 130,400" fill="#0b132b"/>
  <polygon points="140,400 140,160 220,160 220,400" fill="#111c38"/>
  <polygon points="230,400 230,190 310,210 310,400" fill="#0b132b"/>
  <polygon points="320,400 320,130 410,130 410,400" fill="#14213d"/>
  <polygon points="420,400 420,240 540,240 540,400" fill="#0b132b"/>
  <circle cx="80" cy="260" r="3" fill="#ffb703"/>
  <circle cx="180" cy="210" r="3" fill="#00f7ff"/>
  <circle cx="360" cy="180" r="3" fill="#ff007f"/>
  <circle cx="460" cy="290" r="3" fill="#39ff14"/>
  <rect x="0" y="340" width="600" height="60" fill="#050811" opacity="0.8"/>
  <ellipse cx="300" cy="370" rx="200" ry="10" fill="#00f7ff" opacity="0.2"/>
  <rect x="15" y="15" width="320" height="75" rx="6" fill="#000000" opacity="0.75" stroke="#00f7ff" stroke-width="1"/>
  <text x="25" y="33" fill="#00f7ff" font-family="monospace" font-size="11" font-weight="bold">[EVIDENCE PHOTOGRAPH #IMG_20260908]</text>
  <text x="25" y="49" fill="#ffffff" font-family="monospace" font-size="10">GPS: 37.7891° N, 122.4014° W (San Francisco)</text>
  <text x="25" y="65" fill="#39ff14" font-family="monospace" font-size="10">EXIF: Pixel 8 Pro | 1/450s f/1.68 ISO 42</text>
  <text x="25" y="80" fill="#ff007f" font-family="monospace" font-size="9">STATUS: DELETED FILE CARVED VIA THUMBNAIL INODE</text>
</svg>`),
    hexDump: `00000000  FF D8 FF E1 00 16 45 78  69 66 00 00 4D 4D 00 2A  |......Exif..MM.*|
00000010  00 00 00 08 00 02 01 12  00 03 00 00 00 01 00 01  |................|
00000020  00 00 01 1A 00 05 00 00  00 01 00 00 00 26 00 00  |...........&....|
00000030  47 6F 6F 67 6C 65 20 50  69 78 65 6C 20 38 20 50  |Google Pixel 8 P|`,
    metadata: {
      CameraMake: "Google",
      CameraModel: "Pixel 8 Pro",
      Resolution: "4080 x 3072 px",
      FocalLength: "6.9mm",
      ISO: "42",
      Aperture: "f/1.68",
      Exposure: "1/450s",
      GPS: "37.789172 N, 122.401449 W",
      OriginalDate: "2026-09-08 14:23:01 UTC",
    },
    mimeType: "image/jpeg",
  },
  {
    id: "CARVE-IMG-03",
    filename: "deleted_wire_transfer_receipt_450k.png",
    fileType: "PNG",
    category: "Images",
    offset: "0x0032B000",
    offsetDec: 3321856,
    size: 512400,
    status: "RECOVERED",
    signatureMatch: "PNG Image (89 50 4E 47)",
    sha256: "b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3",
    validationDetails: "PNG IHDR chunk and IEND signature validated without bit error. Framebuffer alpha channel intact.",
    recoveryNote: "Screenshot purged by user 12 minutes after capture. Recovered from application cache storage.",
    recoveryMethod: "CACHE_EXTRACT",
    deletedOriginalPath: "/sdcard/Pictures/Screenshots/Screenshot_20260909_191022.png",
    recoveredSource: "/sdcard/Android/data/com.android.providers.media/cache/disk_cache_entry_89",
    recoveredTimestamp: "2026-09-09T19:10:22Z",
    previewUrl: "data:image/svg+xml;utf8," + encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="500" height="420" viewBox="0 0 500 420">
  <rect width="500" height="420" fill="#080e18" rx="10"/>
  <rect x="20" y="20" width="460" height="380" fill="#0d1524" rx="8" stroke="#1e293b" stroke-width="1.5"/>
  <rect x="20" y="20" width="460" height="50" fill="#131e33" rx="8"/>
  <text x="40" y="52" fill="#38bdf8" font-family="sans-serif" font-weight="bold" font-size="16">SWISS NATIONAL VAULT SECURE WIRE</text>
  <text x="40" y="100" fill="#94a3b8" font-family="sans-serif" font-size="12">TRANSACTION STATUS: <tspan fill="#34d399" font-weight="bold">COMPLETED / CLEARED</tspan></text>
  <text x="40" y="130" fill="#94a3b8" font-family="sans-serif" font-size="12">AMOUNT TRANSFERRED:</text>
  <text x="40" y="165" fill="#f8fafc" font-family="monospace" font-size="28" font-weight="bold">$450,000.00 USD</text>
  <line x1="40" y1="185" x2="460" y2="185" stroke="#334155" stroke-dasharray="4"/>
  <text x="40" y="210" fill="#64748b" font-family="monospace" font-size="11">BENEFICIARY ACCOUNT:</text>
  <text x="220" y="210" fill="#cbd5e1" font-family="monospace" font-size="11">CH-93-0070-0112-9982-1402</text>
  <text x="40" y="235" fill="#64748b" font-family="monospace" font-size="11">ROUTING / BIC CODE:</text>
  <text x="220" y="235" fill="#cbd5e1" font-family="monospace" font-size="11">SNVBCHZZ80A</text>
  <text x="40" y="260" fill="#64748b" font-family="monospace" font-size="11">REFERENCE MEMO:</text>
  <text x="220" y="260" fill="#38bdf8" font-family="monospace" font-size="11">REF#ESCROW-PHASE-1-AUTH</text>
  <text x="40" y="285" fill="#64748b" font-family="monospace" font-size="11">TIMESTAMP:</text>
  <text x="220" y="285" fill="#cbd5e1" font-family="monospace" font-size="11">2026-09-09 19:09:44 UTC</text>
  <line x1="40" y1="305" x2="460" y2="305" stroke="#334155" stroke-dasharray="4"/>
  <rect x="40" y="325" width="420" height="50" fill="#3b0764" rx="4" stroke="#a855f7" stroke-width="1"/>
  <text x="50" y="345" fill="#f0abfc" font-family="monospace" font-size="10" font-weight="bold">★ FORENSIC RECOVERED EVIDENCE ARTIFACT ★</text>
  <text x="50" y="362" fill="#e9d5ff" font-family="monospace" font-size="9">Carved from deleted PNG screenshot cache | Hash verified against master case manifest.</text>
</svg>`),
    hexDump: `00000000  89 50 4E 47 0D 0A 1A 0A  00 00 00 0D 49 48 44 52  |.PNG........IHDR|
00000010  00 00 04 38 00 00 09 60  08 06 00 00 00 B6 74 1E  |...8...'......t.|
00000020  24 00 00 20 00 49 44 41  54 78 9C EC BD 07 60 1C  |$.. .IDATx...'.|
00000030  45 9D C2 31 08 82 20 18  04 42 08 21 84 08 42 10  |E..1.. ..B.!..B.|`,
    metadata: {
      ImageType: "Portable Network Graphics",
      Dimensions: "1080 x 2400 px",
      BitDepth: "8-bit RGBA",
      CarvedFrom: "Application Disk Cache Entry",
    },
    mimeType: "image/png",
  },
  {
    id: "CARVE-TXT-04",
    filename: "deleted_signal_secure_chat_export.txt",
    fileType: "TXT",
    category: "Text",
    offset: "0x00214800",
    offsetDec: 2181120,
    size: 18450,
    status: "RECOVERED",
    signatureMatch: "UTF-8 Text Stream (High ASCII density)",
    sha256: "c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4",
    validationDetails: "Valid UTF-8 plain text characters; 84 lines parsed. Contains timestamped two-party dialogue with cryptographic headers.",
    recoveryNote: "Recovered from decrypted SQLite ephemeral session cache following intentional app wipe.",
    recoveryMethod: "SQLITE_WAL_FREELIST",
    deletedOriginalPath: "/data/data/org.thoughtcrime.securesms/cache/temp_chat_transcript.txt",
    recoveredSource: "WAL Freeblock Sector 0x214800",
    recoveredTimestamp: "2026-09-09T22:45:00Z",
    contentSnippet: `[SIGNAL ENCRYPTED PROTOCOL - RECOVERED CONVERSATION TRANSCRIPT]
SESSION ID: SEC-SESSION-4492-Z
DATE: SEPTEMBER 09, 2026

[22:41:03 UTC] Elena Rostova:
Are you on the isolated workstation? Make sure cellular data and Wi-Fi are disconnected before loading the key.

[22:41:45 UTC] Device Owner (Suspect):
Yes, phone is in Airplane mode with USB debugging restricted. Have you verified the Swiss escrow transaction?

[22:42:19 UTC] Elena Rostova:
Confirmed. $450,000 has cleared into the Zurich account. Verification code is [789-021]. Once you send the seed phrase, the remaining 60% will release automatically.

[22:43:02 UTC] Device Owner (Suspect):
Transmitting seed phrase now:
"apple orbit galaxy quantum river shadow pulse echo velvet crystal thunder harbor"

[22:43:55 UTC] Elena Rostova:
Seed phrase acknowledged and checksum valid. Wipe this chat and run zeroize command on the terminal immediately.

[22:44:20 UTC] Device Owner (Suspect):
Deleting cache and purging SQLite database now.

[22:45:00 UTC] SYSTEM NOTICE:
Session closed by user. History flagged for secure deletion.
[END OF RECOVERED TRANSCRIPT]`,
    hexDump: `00000000  5B 53 49 47 4E 41 4C 20  45 4E 43 52 59 50 54 45  |[SIGNAL ENCRYPTE|
00000010  44 20 50 52 4F 54 4F 43  4F 4C 20 2D 20 52 45 43  |D PROTOCOL - REC|
00000020  4F 56 45 52 45 44 20 43  4F 4E 56 45 52 53 41 54  |OVERED CONVERSAT|
00000030  49 4F 4E 20 54 52 41 4E  53 43 52 49 50 54 5D 0A  |ION TRANSCRIPT].|`,
    metadata: {
      Encoding: "UTF-8",
      Lines: 28,
      Words: 242,
      Characters: 1390,
      SourceDatabase: "Signal Session Cache (org.thoughtcrime.securesms)",
    },
    mimeType: "text/plain",
  },
  {
    id: "CARVE-DOC-05",
    filename: "cold_storage_master_seed_backup.docx",
    fileType: "DOCX",
    category: "Documents",
    offset: "0x004F9000",
    offsetDec: 5214208,
    size: 64200,
    status: "RECOVERED",
    signatureMatch: "Microsoft Word (PK 03 04 - OpenXML)",
    sha256: "d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5",
    validationDetails: "Valid ZIP/OpenXML package. Uncompressed word/document.xml extracted with complete XML structure and author metadata.",
    recoveryNote: "Deleted Word document carved from unallocated storage sectors.",
    recoveryMethod: "MAGIC_HEADER_CARVE",
    deletedOriginalPath: "/sdcard/Documents/cold_storage_master_seed_backup.docx",
    recoveredSource: "Unallocated Storage Cluster Block #40920",
    recoveredTimestamp: "2026-09-08T19:30:00Z",
    contentSnippet: `========================================================================
                      COLD STORAGE WALLET BACKUP
========================================================================
DOCUMENT TITLE: MASTER VAULT EMERGENCY RECOVERY KEY
CREATED: SEPTEMBER 08, 2026 | AUTHOR: SYSTEM_ADMIN
SECURITY LEVEL: TOP SECRET - EYES ONLY

1. HARDWARE WALLET SPECIFICATIONS:
- Model: Ledger Stax / Trezor Model T Multi-Sig
- Primary Coin: Bitcoin (BTC) & Ethereum (ETH)
- Target Address: bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq
- Ethereum Contract: 0x71C8F7E41e4Fa3d178e207FdB352d431908865Fa

2. BIP-39 24-WORD RECOVERY SEED:
01. orbit      02. velvet     03. crystal    04. harbor
05. quantum    06. echo       07. river      08. thunder
09. shadow     10. galaxy     11. pulse      12. apple
13. solar      14. beacon     15. matrix     16. summit
17. horizon    18. dynamic    19. canyon     20. venture
21. cobalt     22. timber     23. shield     24. zenith

3. PASSPHRASE EXTENSION:
Passphrase: "N3on-F0r3ns1c-S3cur3-V4ult-2026!"

WARNING: Keep this document offline at all times.
========================================================================`,
    hexDump: `00000000  50 4B 03 04 14 00 06 00  08 00 00 00 21 00 E8 29  |PK..........!..)|
00000010  6E 5E F8 01 00 00 D4 05  00 00 13 00 08 02 5B 43  |n^............[C|
00000020  6F 6E 74 65 6E 74 5F 54  79 70 65 73 5D 2E 78 6D  |ontent_Types].xm|
00000030  6C 20 A2 04 02 28 A0 00  02 00 00 00 00 00 00 00  |l ...(..........|`,
    metadata: {
      Application: "Microsoft Office Word",
      Author: "SYSTEM_ADMIN",
      Revision: "3",
      Words: 156,
      Created: "2026-09-08 19:30:00",
      CarvedFrom: "Residual Cluster 0x004F9000",
    },
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    id: "CARVE-AUDIO-06",
    filename: "intercept_call_recording_20260908.mp3",
    fileType: "MP3",
    category: "Audio",
    offset: "0x0071A000",
    offsetDec: 7446528,
    size: 892400,
    status: "RECOVERED",
    signatureMatch: "MPEG Audio Layer 3 (ID3v2.3)",
    sha256: "e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6",
    validationDetails: "ID3 header parsed cleanly. Audio frame sync verified at 128 kbps stereo, 44.1 kHz. Duration: 01:42.",
    recoveryNote: "Carved from deleted call recording application directory.",
    recoveryMethod: "CACHE_EXTRACT",
    deletedOriginalPath: "/sdcard/Recordings/Calls/Call_20260908_031800_+447911123456.mp3",
    recoveredSource: "/sdcard/Android/data/com.android.soundrecorder/cache/tmp_rec_0908.mp3",
    recoveredTimestamp: "2026-09-08T03:18:00Z",
    contentSnippet: `[AUDIO TRANSCRIPTION FORENSIC DOSSIER]
CALL AUDIO RECORDING INTERCEPT #AUD-006
AUDIO FORMAT: MP3, 128 kbps, 44.1 kHz, Stereo
DURATION: 00:01:42 (102 Seconds)
PARTICIPANTS:
- Caller: +44 7911 123456 (United Kingdom)
- Callee: Suspect Target Device

TRANSCRIPT:
[00:03] Caller: "Are you listening? The package is arriving at Pier 40 by 2 AM tomorrow."
[00:15] Suspect: "Understood. The surveillance team hasn't flagged the vehicle."
[00:28] Caller: "Good. Make sure you don't leave any digital records on the tablet."
[00:44] Suspect: "Everything is stored in encrypted vault containers. I will delete the files after verifying the hash."
[01:12] Caller: "Understood. See you at rendezvous point."`,
    hexDump: `00000000  49 44 33 03 00 00 00 00  00 7B 54 49 54 32 00 1E  |ID3......{TIT2..|
00000010  00 00 01 FF FE 49 00 6E  00 74 00 65 00 72 00 63  |.....I.n.t.e.r.c|
00000020  00 65 00 70 00 74 00 20  00 43 00 61 00 6C 00 6C  |.e.p.t. .C.a.l.l|
00000030  54 50 45 31 00 14 00 00  01 FF FE 55 00 6E 00 6B  |TPE1.......U.n.k|`,
    metadata: {
      Duration: "01:42 (102 seconds)",
      Bitrate: "128 kbps",
      SampleRate: "44.1 kHz",
      Channels: "Stereo",
      AudioFormat: "MPEG-1 Audio Layer III",
    },
    mimeType: "audio/mpeg",
  },
  {
    id: "CARVE-VIDEO-07",
    filename: "surveillance_pier40_rendezvous.mp4",
    fileType: "MP4",
    category: "Videos",
    offset: "0x009A4000",
    offsetDec: 10108928,
    size: 2480000,
    status: "RECOVERED",
    signatureMatch: "MPEG-4 ISO Base Media (ftypisom)",
    sha256: "f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7",
    validationDetails: "ftyp and moov atom headers validated. H.264 video track and AAC audio track intact. 1080p 30fps.",
    recoveryNote: "Recovered from unallocated shared storage cluster following user quick-format.",
    recoveryMethod: "MAGIC_HEADER_CARVE",
    deletedOriginalPath: "/sdcard/DCIM/Camera/VID_20260909_021500.mp4",
    recoveredSource: "Unallocated Cluster Block #78210",
    recoveredTimestamp: "2026-09-09T02:15:00Z",
    contentSnippet: `[VIDEO FORENSIC EVIDENCE SPECIFICATION]
RECORDING NAME: surveillance_pier40_rendezvous.mp4
CONTAINER: MP4 (ISO Base Media)
CODEC: H.264 / AVC Baseline @ Level 4.1
RESOLUTION: 1920 x 1080 (Full HD, 16:9)
FRAME RATE: 30.00 fps
AUDIO: AAC LC, 48 kHz, Stereo
DURATION: 00:00:24 (24 Seconds)

VISUAL TIMELINE SUMMARY:
- 00:00 - 00:08: Dark sedan enters Pier 40 facility via north security gate.
- 00:08 - 00:16: Suspect steps out of vehicle wearing dark jacket, holding laptop bag.
- 00:16 - 00:24: Meets unidentified individual; handover of briefcase confirmed.`,
    hexDump: `00000000  00 00 00 20 66 74 79 70  69 73 6F 6D 00 00 02 00  |... ftypisom....|
00000010  69 73 6F 6D 69 73 6F 32  61 76 63 31 6D 70 34 31  |isomiso2avc1mp41|
00000020  00 00 00 08 66 72 65 65  00 1E 29 48 6D 64 61 74  |....free..)Hmdat|
00000030  00 00 00 02 09 10 00 00  00 00 00 01 06 05 FF FF  |................|`,
    metadata: {
      Resolution: "1920 x 1080 (1080p)",
      Framerate: "30 fps",
      Duration: "00:24",
      VideoCodec: "H.264 / MPEG-4 AVC",
      AudioCodec: "AAC-LC",
    },
    mimeType: "video/mp4",
  },
  {
    id: "CARVE-SQLITE-08",
    filename: "deleted_sms_freelist_carved.sql",
    fileType: "SQLITE",
    category: "Databases",
    offset: "0x00115000",
    offsetDec: 1134592,
    size: 40960,
    status: "RECOVERED",
    signatureMatch: "SQLite 3 Database (53 51 4C 69 74 65 20)",
    sha256: "a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8",
    validationDetails: "10 SQLite freeblock pages recovered from mmssms.db-wal rollback journal. 8 deleted SMS rows reconstructed.",
    recoveryNote: "Carved from unallocated freelist blocks inside telephony provider database.",
    recoveryMethod: "SQLITE_WAL_FREELIST",
    deletedOriginalPath: "/data/data/com.android.providers.telephony/databases/mmssms.db",
    recoveredSource: "mmssms.db-wal Unallocated Freelist",
    recoveredTimestamp: "2026-09-08T03:19:22Z",
    contentSnippet: `-- ====================================================================
-- RECOVERED SQLITE FREELIST DELETED RECORDS
-- SOURCE: mmssms.db (Unallocated Freelist Pages 4, 7, 9)
-- CARVED: SEPTEMBER 11, 2026
-- ====================================================================

-- ROW 1 (DELETED BY USER ON 2026-09-08 03:22:10 UTC):
INSERT INTO sms (_id, thread_id, address, date, body, type, read, status)
VALUES (901, 104, '+447911123456', 1788837562000, 'Relay handshake code: [789-021]. Clear log after read.', 1, 1, 0);

-- ROW 2 (DELETED BY USER ON 2026-09-08 03:25:01 UTC):
INSERT INTO sms (_id, thread_id, address, date, body, type, read, status)
VALUES (902, 104, '+447911123456', 1788837701000, 'Understood. Hardware controller is armed.', 2, 1, 0);

-- ROW 3 (DELETED BY USER ON 2026-09-09 14:10:00 UTC):
INSERT INTO sms (_id, thread_id, address, date, body, type, read, status)
VALUES (903, 101, '+14158920193', 1788963000000, 'Transfer $450k receipt confirmed. Don't call this line again.', 1, 1, 0);
-- ====================================================================`,
    hexDump: `00000000  53 51 4C 69 74 65 20 66  6F 72 6D 61 74 20 33 00  |SQLite format 3.|
00000010  10 00 01 01 00 40 20 20  00 00 00 0A 00 00 00 04  |.....@  ........|
00000020  00 00 00 00 00 00 00 00  00 00 00 01 00 00 00 00  |................|
00000030  00 00 00 00 00 00 00 00  00 00 00 00 00 00 00 00  |................|`,
    metadata: {
      PagesRecovered: 10,
      DeletedRowsCarved: 3,
      DatabaseType: "SQLite 3",
      PageSize: "4096 bytes",
    },
    mimeType: "text/plain",
  },
];

export const MOCK_CHAIN_OF_CUSTODY: ChainOfCustodyRecord[] = [
  {
    id: "COC-01",
    timestamp: "2026-09-11T09:15:00Z",
    investigator: "Special Agent R. Vance (Badge #7492)",
    action: "Case created with authorized warrant confirmation",
    evidenceId: "CASE-2026-0914-NF",
    previousEventHash: "GENESIS_ROOT_HASH_000000000000000000000000000000000000000000000000",
    currentEventHash: "7b587a84061a9c11c1b1836c1b3f9b2d87e22e92c2a21e42849202a019482910",
    verificationStatus: "VERIFIED",
  },
  {
    id: "COC-02",
    timestamp: "2026-09-11T09:28:01Z",
    investigator: "Special Agent R. Vance",
    action: "Device attached via USB (Hardware serial 39241FDJE00388)",
    evidenceId: "DEV-PIXEL8-39241FDJE00388",
    previousEventHash: "7b587a84061a9c11c1b1836c1b3f9b2d87e22e92c2a21e42849202a019482910",
    currentEventHash: "3f98c11928374102938102938102938102938102938102938102938102938102",
    verificationStatus: "VERIFIED",
  },
  {
    id: "COC-03",
    timestamp: "2026-09-11T09:30:22Z",
    investigator: "Special Agent R. Vance",
    action: "Standard forensic acquisition executed. Evidence manifest created.",
    evidenceId: "MANIFEST-SHA256-8819",
    previousEventHash: "3f98c11928374102938102938102938102938102938102938102938102938102",
    currentEventHash: "b102938102938102938102938102938102938102938102938102938102938102",
    verificationStatus: "VERIFIED",
  },
  {
    id: "COC-04",
    timestamp: "2026-09-11T09:35:00Z",
    investigator: "Special Agent R. Vance",
    action: "Cryptographic SHA-256 evidence integrity verification completed. 0 bit flips.",
    evidenceId: "INTEGRITY-CHECK-PASS",
    previousEventHash: "b102938102938102938102938102938102938102938102938102938102938102",
    currentEventHash: "9a81920381029381029381029381029381029381029381029381029381029381",
    verificationStatus: "VERIFIED",
  },
];

export const MOCK_DUPLICATES: DuplicateDetectionItem[] = [
  {
    id: "DUP-01",
    originalPath: "/sdcard/DCIM/Camera/IMG_20260909_142301.jpg",
    duplicatePath: "/sdcard/Download/IMG_20260909_142301_copy.jpg",
    sha256: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    size: 4289104,
    similarityType: "EXACT_SHA256",
    similarityScore: 100,
  },
  {
    id: "DUP-02",
    originalPath: "/sdcard/Pictures/Screenshots/Screenshot_20260910_172500.png",
    duplicatePath: "/sdcard/Pictures/Screenshots/Screenshot_20260910_172500_cropped.png",
    sha256: "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb",
    size: 1891000,
    similarityType: "PERCEPTUAL_IMAGE_HASH",
    similarityScore: 94.2,
  },
];
