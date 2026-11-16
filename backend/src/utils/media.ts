import fs from "fs";
import path from "path";
import crypto from "crypto";
import { UPLOAD_DIR } from "./uploads";

// Photos et vidéos envoyées dans les discussions.
// Limites volontairement basses : le stockage coûte de l'argent et la vidéo passe par le réseau mobile.
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024; // 3 Mo
export const MAX_VIDEO_BYTES = 12 * 1024 * 1024; // 12 Mo (≈ 30 secondes en qualité moyenne)

export type MediaKind = "image" | "video";

/** Lit le vrai type à partir des premiers octets (on ne fait pas confiance au Content-Type envoyé). */
export function sniffMedia(buf: Buffer): { kind: MediaKind; ext: string } | null {
  if (buf.length > 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { kind: "image", ext: "jpg" };
  if (buf.length > 8 && buf.slice(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { kind: "image", ext: "png" };
  if (buf.length > 12 && buf.slice(0, 4).toString() === "RIFF" && buf.slice(8, 12).toString() === "WEBP") return { kind: "image", ext: "webp" };
  // MP4 / MOV : « ftyp » aux octets 4 à 8
  if (buf.length > 12 && buf.slice(4, 8).toString() === "ftyp") {
    const brand = buf.slice(8, 12).toString();
    return { kind: "video", ext: brand.startsWith("qt") ? "mov" : "mp4" };
  }
  return null;
}

export function saveMedia(buf: Buffer): { url: string; kind: MediaKind } {
  const info = sniffMedia(buf);
  if (!info) throw new Error("Fichier non accepté : photo (JPEG, PNG, WebP) ou vidéo (MP4, MOV) seulement.");
  if (info.kind === "image" && buf.length > MAX_IMAGE_BYTES) throw new Error("Photo trop lourde (3 Mo maximum).");
  if (info.kind === "video" && buf.length > MAX_VIDEO_BYTES) throw new Error("Vidéo trop lourde (12 Mo maximum, environ 30 secondes).");
  const dir = path.join(UPLOAD_DIR, "forum");
  fs.mkdirSync(dir, { recursive: true });
  const name = `${crypto.randomUUID()}.${info.ext}`;
  fs.writeFileSync(path.join(dir, name), buf);
  return { url: `/uploads/forum/${name}`, kind: info.kind };
}

export function isForumMediaUrl(url: string): boolean {
  return /^\/uploads\/forum\/[0-9a-f-]{36}\.(jpg|png|webp|mp4|mov)$/.test(url);
}

export function deleteMedia(url?: string | null) {
  if (!url || !isForumMediaUrl(url)) return;
  fs.rm(path.join(UPLOAD_DIR, "forum", path.basename(url)), { force: true }, () => undefined);
}
