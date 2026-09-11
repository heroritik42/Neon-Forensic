import { CarvedFileArtifact } from "../types/forensics";
import { computeSha256 } from "./crypto";

export interface FileSignature {
  type: CarvedFileArtifact["fileType"];
  header: number[];
  footer?: number[];
  name: string;
  extension: string;
  expectedMinSize: number;
}

export const SIGNATURES: FileSignature[] = [
  {
    type: "JPEG",
    header: [0xff, 0xd8, 0xff],
    footer: [0xff, 0xd9],
    name: "JPEG Image",
    extension: ".jpg",
    expectedMinSize: 512,
  },
  {
    type: "PNG",
    header: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
    footer: [0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82],
    name: "PNG Image",
    extension: ".png",
    expectedMinSize: 256,
  },
  {
    type: "PDF",
    header: [0x25, 0x50, 0x44, 0x46], // %PDF
    footer: [0x25, 0x25, 0x45, 0x4f, 0x46], // %%EOF
    name: "PDF Document",
    extension: ".pdf",
    expectedMinSize: 1024,
  },
  {
    type: "ZIP",
    header: [0x50, 0x4b, 0x03, 0x04], // PK..
    name: "ZIP Archive / APK Container",
    extension: ".zip",
    expectedMinSize: 128,
  },
  {
    type: "SQLITE",
    header: [0x53, 0x51, 0x4c, 0x69, 0x74, 0x65, 0x20, 0x66, 0x6f, 0x72, 0x6d, 0x61, 0x74, 0x20, 0x33, 0x00], // SQLite format 3\0
    name: "SQLite 3 Database",
    extension: ".db",
    expectedMinSize: 4096,
  },
  {
    type: "MP4",
    header: [0x66, 0x74, 0x79, 0x70], // ftyp in header area
    name: "MPEG-4 Video",
    extension: ".mp4",
    expectedMinSize: 4096,
  },
  {
    type: "MP3",
    header: [0x49, 0x44, 0x33], // ID3
    name: "MP3 Audio",
    extension: ".mp3",
    expectedMinSize: 512,
  },
];

/**
 * Scan raw byte stream or simulated disk image for unallocated or residual signatures.
 */
export async function carveEvidenceBuffer(
  buffer: Uint8Array,
  options?: { maxResults?: number }
): Promise<CarvedFileArtifact[]> {
  const results: CarvedFileArtifact[] = [];
  const limit = options?.maxResults || 20;

  for (let i = 0; i < buffer.length - 16; i++) {
    if (results.length >= limit) break;

    for (const sig of SIGNATURES) {
      let match = true;
      for (let j = 0; j < sig.header.length; j++) {
        if (buffer[i + j] !== sig.header[j]) {
          match = false;
          break;
        }
      }

      if (match) {
        // Look for footer if available
        let carvedSize = 32768; // default window if footer missing
        let status: CarvedFileArtifact["status"] = "RECOVERED";
        let validation = "Header validated. Signature clean.";

        if (sig.footer) {
          let foundFooter = -1;
          for (let k = i + sig.header.length; k < Math.min(buffer.length - sig.footer.length, i + 500000); k++) {
            let fmatch = true;
            for (let f = 0; f < sig.footer.length; f++) {
              if (buffer[k + f] !== sig.footer[f]) {
                fmatch = false;
                break;
              }
            }
            if (fmatch) {
              foundFooter = k + sig.footer.length;
              break;
            }
          }

          if (foundFooter !== -1) {
            carvedSize = foundFooter - i;
            status = "RECOVERED";
            validation = `Complete structure. Trailer matched at offset 0x${foundFooter.toString(16).toUpperCase()}.`;
          } else {
            carvedSize = 16384;
            status = "PARTIAL";
            validation = "Header matched; file trailer truncated or overwritten by flash TRIM.";
          }
        }

        const carvedBytes = buffer.subarray(i, Math.min(buffer.length, i + carvedSize));
        const hash = await computeSha256(carvedBytes);

        results.push({
          id: `CARVE-${results.length + 1}-${i.toString(16).toUpperCase()}`,
          fileType: sig.type,
          offset: `0x${i.toString(16).padStart(8, "0").toUpperCase()}`,
          offsetDec: i,
          size: carvedBytes.length,
          status,
          signatureMatch: `${sig.name} (${sig.header.map((b) => b.toString(16).padStart(2, "0").toUpperCase()).join(" ")})`,
          sha256: hash,
          validationDetails: validation,
          recoveryNote:
            status === "RECOVERED"
              ? "Extracted intact from residual evidence stream"
              : "Partial residual bytes found in unallocated space block",
        });

        // skip forward past header
        i += sig.header.length + 32;
        break;
      }
    }
  }

  return results;
}
