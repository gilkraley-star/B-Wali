import fs from "fs";
import path from "path";
import crypto from "crypto";

export const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

const MAX_BYTES = 3 * 1024 * 1024; // 3 Mo

/** Détecte le vrai type d'image à partir des premiers octets (on ne fait pas confiance à l'extension envoyée). */
function sniff(buf: Buffer): "jpg" | "png" | "webp" | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (buf.length > 8 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buf.length > 12 && buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") return "webp";
  return null;
}

/**
 * Enregistre une photo reçue en data URL base64 (ex. "data:image/jpeg;base64,...").
 * Retourne l'URL publique (/uploads/xxx.jpg). Lève une Error avec un message lisible si invalide.
 */
export function savePhotoFromDataUrl(dataUrl: string): string {
  const match = /^data:image\/(png|jpe?g|webp);base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("Photo invalide : formats acceptés JPEG, PNG ou WebP.");
  const buf = Buffer.from(match[2], "base64");
  if (buf.length > MAX_BYTES) throw new Error("Photo trop lourde (3 Mo maximum).");
  const ext = sniff(buf);
  if (!ext) throw new Error("Le fichier n'est pas une image valide.");
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
  const name = `${crypto.randomUUID()}.${ext}`;
  fs.writeFileSync(path.join(UPLOAD_DIR, name), buf);
  return `/uploads/${name}`;
}

export function deletePhoto(url?: string | null) {
  if (!url || !url.startsWith("/uploads/")) return;
  const file = path.join(UPLOAD_DIR, path.basename(url));
  fs.rm(file, { force: true }, () => undefined);
}

