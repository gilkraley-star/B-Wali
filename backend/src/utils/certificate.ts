import fs from "fs";
import path from "path";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { UPLOAD_DIR } from "./uploads";

export interface Field { x: number; y: number; size: number }
export const DEFAULT_FIELDS: Record<string, Field> = {
  name: { x: 0.5, y: 0.46, size: 30 },
  birth: { x: 0.5, y: 0.53, size: 14 },
  course: { x: 0.5, y: 0.63, size: 20 },
  date: { x: 0.3, y: 0.72, size: 12 },
  number: { x: 0.5, y: 0.95, size: 10 },
};
export interface Signer { name: string; title: string; sigUrl?: string | null }
export interface Data { fullName: string; birthDate: string; birthPlace: string; courseTitle: string; dateText: string; number: string }

const W = 842, H = 595; // A4 paysage en points

function file(url?: string | null): Buffer | null {
  if (!url || !url.startsWith("/uploads/")) return null;
  try { return fs.readFileSync(path.join(UPLOAD_DIR, path.basename(url))); } catch { return null; }
}
async function img(doc: PDFDocument, url?: string | null) {
  const b = file(url);
  if (!b) return null;
  try { return b[0] === 0x89 ? await doc.embedPng(b) : b[0] === 0xff ? await doc.embedJpg(b) : null; } catch { return null; }
}
// Les polices standard du PDF ne contiennent pas tous les caractères : on remplace ceux qui manquent.
const clean = (t: string) => t.replace(/[^\x20-\x7E -ÿ]/g, "?");

export function frDate(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export async function renderCertificate(tpl: { bgUrl: string; stampUrl?: string | null; stampX: number; stampY: number; stampSize: number; fieldsJson: string; signersJson: string }, d: Data): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([W, H]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const reg = await doc.embedFont(StandardFonts.Helvetica);
  const bg = await img(doc, tpl.bgUrl);
  if (bg) page.drawImage(bg, { x: 0, y: 0, width: W, height: H });
  let fields: Record<string, Field> = { ...DEFAULT_FIELDS };
  try { fields = { ...DEFAULT_FIELDS, ...JSON.parse(tpl.fieldsJson || "{}") }; } catch { /* défauts */ }
  const color = rgb(0.17, 0.09, 0.2);
  const text = (key: string, t: string, font = reg) => {
    const f = fields[key]; if (!f) return;
    const s = clean(t);
    const w = font.widthOfTextAtSize(s, f.size);
    page.drawText(s, { x: f.x * W - w / 2, y: H - f.y * H - f.size / 2, size: f.size, font, color });
  };
  text("name", d.fullName, bold);
  text("birth", `Née le ${frDate(d.birthDate)} à ${d.birthPlace}`);
  text("course", d.courseTitle, bold);
  text("date", d.dateText);
  text("number", `N° ${d.number}`);
  let signers: Signer[] = [];
  try { signers = JSON.parse(tpl.signersJson || "[]"); } catch { /* aucun */ }
  for (let i = 0; i < signers.length; i++) {
    const cx = ((i + 1) / (signers.length + 1)) * W * 0.8 + W * 0.02;
    const sig = await img(doc, signers[i].sigUrl);
    const baseY = H * 0.17;
    if (sig) { const w = 110, h = (sig.height / sig.width) * w; page.drawImage(sig, { x: cx - w / 2, y: baseY + 14, width: w, height: Math.min(h, 55) }); }
    const n = clean(signers[i].name), t = clean(signers[i].title);
    page.drawText(n, { x: cx - bold.widthOfTextAtSize(n, 11) / 2, y: baseY, size: 11, font: bold, color });
    page.drawText(t, { x: cx - reg.widthOfTextAtSize(t, 9) / 2, y: baseY - 12, size: 9, font: reg, color });
  }
  const st = await img(doc, tpl.stampUrl);
  if (st) { const w = tpl.stampSize * W, h = (st.height / st.width) * w; page.drawImage(st, { x: tpl.stampX * W - w / 2, y: H - tpl.stampY * H - h / 2, width: w, height: h, opacity: 0.9 }); }
  return doc.save();
}
