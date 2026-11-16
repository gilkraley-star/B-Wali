import { Domain, MM_EN, MM_FR } from "./data";

export type MmLang = "fr" | "en";
export const MM_MAX_SERIES = 1000;

export interface PlacedWord {
  word: string;
  def: string;
  emoji: string;
  r: number;
  c: number;
  dr: number;
  dc: number;
}
export interface Puzzle {
  serie: number;
  size: number;
  tier: number; // 0 Débutante, 1 Confirmée, 2 Experte, 3 Championne
  grid: string[][];
  words: PlacedWord[];
}

function rng(seed: number) {
  let a = Math.imul(seed, 2654435761) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Construit la série n. La difficulté monte de 1 à 100 puis continue (grille plus grande, plus de mots, plus de sens). */
export function buildPuzzle(n: number, lang: MmLang): Puzzle {
  const bank: Domain[] = lang === "en" ? MM_EN : MM_FR;
  const tier = n <= 33 ? 0 : n <= 66 ? 1 : n <= 100 ? 2 : 3;
  const size = Math.min(10, 5 + Math.floor((n - 1) / 25));
  const count = Math.min(3 + Math.floor((n - 1) / 20), 12);
  const R = rng(n * 7 + 3);
  const dirs: [number, number][] = [[0, 1], [1, 0]];
  if (n > 15) dirs.push([1, 1]);
  if (n > 40) dirs.push([0, -1]);
  if (n > 70) dirs.push([-1, 0]);
  if (n > 100) dirs.push([-1, -1], [-1, 1], [1, -1]);

  const all: [string, string, string][] = [];
  for (const d of bank) for (const w of d[3]) if (w[0].length <= size) all.push([w[0], w[1], d[1]]);
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(R() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const pool: [string, string, string][] = [];
  const seenW = new Set<string>();
  const seenD = new Set<string>();
  for (const w of all) if (pool.length < count && !seenW.has(w[0]) && !seenD.has(w[2])) { pool.push(w); seenW.add(w[0]); seenD.add(w[2]); }
  for (const w of all) if (pool.length < count && !seenW.has(w[0])) { pool.push(w); seenW.add(w[0]); }
  pool.sort((a, b) => b[0].length - a[0].length);

  const g: string[][] = Array.from({ length: size }, () => Array(size).fill(""));
  const placed: PlacedWord[] = [];
  for (const wf of pool) {
    const w = wf[0];
    for (let tries = 0; tries < 300; tries++) {
      const dd = dirs[Math.floor(R() * dirs.length)];
      const r0 = Math.floor(R() * size);
      const c0 = Math.floor(R() * size);
      const er = r0 + dd[0] * (w.length - 1);
      const ec = c0 + dd[1] * (w.length - 1);
      if (er < 0 || er >= size || ec < 0 || ec >= size) continue;
      let ok = true;
      for (let k = 0; k < w.length; k++) {
        const ch = g[r0 + dd[0] * k][c0 + dd[1] * k];
        if (ch !== "" && ch !== w[k]) { ok = false; break; }
      }
      if (!ok) continue;
      for (let k = 0; k < w.length; k++) g[r0 + dd[0] * k][c0 + dd[1] * k] = w[k];
      placed.push({ word: w, def: wf[1], emoji: wf[2], r: r0, c: c0, dr: dd[0], dc: dd[1] });
      break;
    }
  }
  const L = "AEIOULNMRSTCPDB";
  for (let r = 0; r < size; r++) for (let c = 0; c < size; c++) if (g[r][c] === "") g[r][c] = L[Math.floor(R() * L.length)];
  return { serie: n, size, tier, grid: g, words: placed };
}

/** Une sélection (ligne droite) de (r1,c1) à (r2,c2) donne-t-elle un mot de la grille ? */
export function matchSelection(p: Puzzle, r1: number, c1: number, r2: number, c2: number): PlacedWord | null {
  const dr = r2 - r1, dc = c2 - c1;
  if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
  const n = Math.max(Math.abs(dr), Math.abs(dc));
  const sr = Math.sign(dr), sc = Math.sign(dc);
  let str = "";
  for (let k = 0; k <= n; k++) str += p.grid[r1 + sr * k][c1 + sc * k];
  const rev = str.split("").reverse().join("");
  for (const w of p.words) if (w.word === str || w.word === rev) return w;
  return null;
}
export const MM_STARS = 20;
