import fs from "fs";
import path from "path";
import crypto from "crypto";
import { Request } from "express";
import { UPLOAD_DIR } from "./uploads";

// Vidéos de formation envoyées par l'équipe depuis l'administration (gros fichiers : écrits au fil de l'eau sur le disque).
export const MAX_COURSE_VIDEO_BYTES = 800 * 1024 * 1024; // 800 Mo
const DIR = path.join(UPLOAD_DIR, "courses");

export function isCourseVideoUrl(u: string) { return /^\/uploads\/courses\/[0-9a-f-]{36}\.(mp4|mov)$/.test(u); }
export function deleteCourseVideo(u?: string | null) { if (u && isCourseVideoUrl(u)) fs.rm(path.join(DIR, path.basename(u)), { force: true }, () => undefined); }

export function saveCourseVideo(req: Request): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.mkdirSync(DIR, { recursive: true });
    const tmp = path.join(DIR, crypto.randomUUID() + ".part");
    const out = fs.createWriteStream(tmp);
    let size = 0, failed = false;
    const fail = (msg: string) => { if (failed) return; failed = true; out.destroy(); fs.rm(tmp, { force: true }, () => undefined); req.unpipe(); reject(new Error(msg)); };
    req.on("data", (c: Buffer) => { size += c.length; if (size > MAX_COURSE_VIDEO_BYTES) fail("Vidéo trop lourde (800 Mo maximum). Compresse-la avant de l'envoyer."); });
    req.on("error", () => fail("Envoi interrompu."));
    req.on("aborted", () => fail("Envoi interrompu."));
    out.on("error", () => fail("Impossible d'enregistrer la vidéo."));
    out.on("finish", () => {
      if (failed) return;
      try {
        const fd = fs.openSync(tmp, "r"); const b = Buffer.alloc(12); fs.readSync(fd, b, 0, 12, 0); fs.closeSync(fd);
        if (size < 1000 || b.slice(4, 8).toString() !== "ftyp") { fs.rmSync(tmp, { force: true }); return reject(new Error("Ce fichier n'est pas une vidéo MP4 ou MOV.")); }
        const ext = b.slice(8, 12).toString().startsWith("qt") ? "mov" : "mp4";
        const name = crypto.randomUUID() + "." + ext;
        fs.renameSync(tmp, path.join(DIR, name));
        resolve("/uploads/courses/" + name);
      } catch { reject(new Error("Impossible d'enregistrer la vidéo.")); }
    });
    req.pipe(out);
  });
}
