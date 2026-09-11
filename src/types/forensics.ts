export type DeviceState =
  | "CONNECTED"
  | "UNAUTHORIZED"
  | "OFFLINE"
  | "DISCONNECTED"
  | "RECOVERY"
  | "BOOTLOADER";

export type AcquisitionProfile = "QUICK" | "STANDARD" | "DEEP";

export type ArtifactStatus =
  | "AVAILABLE"
  | "ACQUIRED"
  | "PARSED"
  | "RECOVERED"
  | "INACCESSIBLE"
  | "ENCRYPTED"
  | "CORRUPTED"
  | "NOT_PRESENT"
  | "NOT_SUPPORTED";

export interface ForensicCase {
  id: string;
  name: string;
  investigator: string;
  organization: string;
  evidenceOwner: string;
  authorizationStatus: "AUTHORIZED" | "PENDING_CONFIRMATION" | "UNAUTHORIZED";
  authorizationConfirmedAt?: string;
  authorizationNotes: string;
  deviceIdentifier: string;
  acquisitionDateTime: string;
  timezone: string;
  notes: string;
  evidenceLocation: string;
  hashAlgorithm: "SHA-256" | "SHA-512" | "MD5";
  createdAt: string;
  status: "ACTIVE" | "ARCHIVED" | "SEALED";
}

export interface AndroidDevice {
  serial: string;
  manufacturer: string;
  model: string;
  marketName: string;
  androidVersion: string;
  sdkVersion: number;
  buildFingerprint: string;
  securityPatch: string;
  adbState: DeviceState;
  usbState: "ATTACHED" | "DISCONNECTED" | "SUSPENDED";
  vendorId: string;
  productId: string;
  usbMode: "MTP" | "PTP" | "ADB" | "CHARGING_ONLY";
  rootStatus: "SELINUX_ENFORCING" | "UNROOTED_VERIFIED" | "ROOTED_INSECURE";
  batteryLevel: number;
  batteryHealth: string;
  storage: {
    totalBytes: number;
    usedBytes: number;
    sharedBytes: number;
    encryptionType: "FILE_BASED_ENCRYPTION_FBE" | "FULL_DISK_ENCRYPTION_FDE" | "NONE";
  };
  tcpIpEnabled: boolean;
  ipAddress?: string;
  tcpPort?: number;
}

export interface AdbCommandLog {
  id: string;
  timestamp: string;
  deviceSerial: string;
  command: string;
  result: "SUCCESS" | "FAILED" | "PERMISSION_DENIED" | "TIMEOUT";
  outputSnippet?: string;
}

export interface EvidenceFile {
  id: string;
  source: string;
  destination: string;
  filename: string;
  sha256: string;
  sha512?: string;
  md5?: string;
  size: number;
  acquiredAt: string;
  method: "ADB_PULL" | "BACKUP_EXTRACT" | "FILE_CARVE" | "MTP_TRANSFER" | "RAW_IMAGE";
  sourceDevice: string;
  mimeType: string;
  category:
    | "Images"
    | "Videos"
    | "Audio"
    | "Documents"
    | "Archives"
    | "Databases"
    | "Logs"
    | "Executables"
    | "APK"
    | "Unknown";
  status: ArtifactStatus;
  notes?: string;
  hexPreview?: string;
}

export interface ContactArtifact {
  id: string;
  name: string;
  phone: string;
  email: string;
  timesContacted: number;
  lastContactedTime: string;
  sourceDatabase: string;
  status: ArtifactStatus;
}

export interface SmsArtifact {
  id: string;
  sender: string;
  recipient: string;
  message: string;
  timestamp: string;
  direction: "INCOMING" | "OUTGOING";
  threadId: number;
  read: boolean;
  sourceDatabase: string;
  status: ArtifactStatus;
}

export interface CallLogArtifact {
  id: string;
  number: string;
  contactName: string;
  callType: "INCOMING" | "OUTGOING" | "MISSED" | "REJECTED";
  timestamp: string;
  durationSeconds: number;
  locationTag?: string;
  sourceDatabase: string;
  status: ArtifactStatus;
}

export interface BrowserArtifact {
  id: string;
  url: string;
  title: string;
  visitTimestamp: string;
  searchTerms?: string;
  browserProfile: string;
  visitCount: number;
  sourceDatabase: string;
  status: ArtifactStatus;
}

export interface ApplicationArtifact {
  packageName: string;
  appName: string;
  versionName: string;
  versionCode: number;
  uid: number;
  apkPath: string;
  sha256: string;
  fileSize: number;
  firstInstallTime: string;
  lastUpdateTime: string;
  permissions: {
    permission: string;
    level: "DANGEROUS" | "NORMAL" | "SIGNATURE";
    granted: boolean;
  }[];
  suspiciousFindings: string[];
  status: ArtifactStatus;
}

export interface MediaArtifact {
  id: string;
  filename: string;
  path: string;
  mime: string;
  size: number;
  createdTime: string;
  modifiedTime: string;
  dimensions?: string;
  cameraModel?: string;
  exif?: Record<string, string>;
  gps?: {
    latitude: number;
    longitude: number;
    altitude?: number;
    addressDescription?: string;
  };
  perceptualHash?: string;
  sha256: string;
  status: ArtifactStatus;
}

export interface SQLiteTableRecord {
  tableName: string;
  columns: { name: string; type: string; isPrimary?: boolean }[];
  rowCount: number;
  walDetected: boolean;
  journalMode: string;
  sampleRows: Record<string, any>[];
}

export interface SQLiteDatabaseArtifact {
  id: string;
  dbName: string;
  path: string;
  fileSize: number;
  sha256: string;
  tables: SQLiteTableRecord[];
  status: ArtifactStatus;
}

export interface TimelineEvent {
  id: string;
  dateTime: string;
  type: "FILE" | "SMS" | "CALL" | "BROWSER" | "MEDIA" | "APPLICATION" | "LOG" | "NOTIFICATION";
  eventDescription: string;
  source: string;
  device: string;
  evidenceFile?: string;
  details?: Record<string, any>;
}

export interface CarvedFileArtifact {
  id: string;
  fileType: "JPEG" | "PNG" | "PDF" | "ZIP" | "MP4" | "MP3" | "SQLITE";
  offset: string;
  offsetDec: number;
  size: number;
  status: "RECOVERED" | "PARTIAL" | "CORRUPTED" | "UNRECOVERABLE";
  signatureMatch: string;
  sha256: string;
  validationDetails: string;
  recoveryNote: string;
}

export interface ChainOfCustodyRecord {
  id: string;
  timestamp: string;
  investigator: string;
  action: string;
  evidenceId: string;
  previousEventHash: string;
  currentEventHash: string;
  verificationStatus: "VERIFIED" | "TAMPERED" | "UNCHECKED";
}

export interface DuplicateDetectionItem {
  id: string;
  originalPath: string;
  duplicatePath: string;
  sha256: string;
  size: number;
  similarityType: "EXACT_SHA256" | "PERCEPTUAL_IMAGE_HASH" | "FILENAME_MATCH";
  similarityScore: number; // 0 to 100%
}
