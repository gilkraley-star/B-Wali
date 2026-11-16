// Moteur du Ludo (2 ou 4 joueuses). Plateau 15×15. Chaque pion va de la case 0 à 56 (56 = arrivée).
export type Color = "R" | "G" | "Y" | "B";
export const COLORS: Color[] = ["R", "G", "Y", "B"];
export const HEX: Record<Color, string> = { R: "#E5252A", G: "#1FA64A", Y: "#FFD400", B: "#1565D8" };
export const DARK: Record<Color, string> = { R: "#9E1216", G: "#0E6B2D", Y: "#B38F00", B: "#0B3C94" };
export const LIGHT: Record<Color, string> = { R: "#FF9A9A", G: "#8FDDA5", Y: "#FFE87A", B: "#9CC4FF" };
const START: Record<Color, number> = { R: 0, G: 13, Y: 26, B: 39 };

export const TRACK: [number, number][] = [];
(() => {
  const seg = [[6,1,0,1,5],[5,6,-1,0,6],[0,7,0,1,2],[1,8,1,0,5],[6,9,0,1,6],[7,14,1,0,2],[8,13,0,-1,5],[9,8,1,0,6],[14,7,0,-1,2],[13,6,-1,0,5],[8,5,0,-1,6],[7,0,-1,0,2]];
  for (const s of seg) for (let k = 0; k < s[4]; k++) TRACK.push([s[0] + s[2] * k, s[1] + s[3] * k]);
})();
const BASE: Record<Color, [number, number][]> = {
  R: [[2,2],[2,3],[3,2],[3,3]], G: [[2,11],[2,12],[3,11],[3,12]], Y: [[11,11],[11,12],[12,11],[12,12]], B: [[11,2],[11,3],[12,2],[12,3]],
};
const HOMECOL: Record<Color, (k: number) => [number, number]> = {
  R: (k) => [7, 1 + k], G: (k) => [1 + k, 7], Y: (k) => [7, 13 - k], B: (k) => [13 - k, 7],
};
const GOAL: Record<Color, [number, number]> = { R: [7, 6], G: [6, 7], Y: [7, 8], B: [8, 7] };
export const SAFE = [0, 8, 13, 21, 26, 34, 39, 47];

export function coord(c: Color, p: number, i: number): [number, number] {
  if (p < 0) return BASE[c][i];
  if (p <= 50) return TRACK[(START[c] + p) % 52];
  if (p <= 55) return HOMECOL[c](p - 51);
  return GOAL[c];
}
const trackIdx = (c: Color, p: number) => (START[c] + p) % 52;

export type Positions = Record<Color, number[]>;
export const emptyPositions = (): Positions => ({ R: [-1,-1,-1,-1], G: [-1,-1,-1,-1], Y: [-1,-1,-1,-1], B: [-1,-1,-1,-1] });

/** Pions qui peuvent bouger avec ce dé. Sortir de la base demande un 6. */
export function movable(pos: Positions, color: Color, dice: number): number[] {
  const out: number[] = [];
  pos[color].forEach((p, i) => { if ((p === -1 && dice === 6) || (p >= 0 && p + dice <= 56)) out.push(i); });
  return out;
}

export function wouldCapture(pos: Positions, color: Color, np: number): boolean {
  if (np > 50) return false;
  const idx = trackIdx(color, np);
  if (SAFE.includes(idx)) return false;
  for (const o of COLORS) {
    if (o === color) continue;
    for (const q of pos[o]) if (q >= 0 && q <= 50 && trackIdx(o, q) === idx) return true;
  }
  return false;
}

export function applyMove(pos: Positions, color: Color, i: number, dice: number): { pos: Positions; captured: boolean; won: boolean } {
  const next: Positions = { R: pos.R.slice(), G: pos.G.slice(), Y: pos.Y.slice(), B: pos.B.slice() };
  const p = next[color][i];
  const np = p === -1 ? 0 : p + dice;
  let captured = false;
  if (np <= 50) {
    const idx = trackIdx(color, np);
    if (!SAFE.includes(idx)) {
      for (const o of COLORS) {
        if (o === color) continue;
        next[o].forEach((q, k) => { if (q >= 0 && q <= 50 && trackIdx(o, q) === idx) { next[o][k] = -1; captured = true; } });
      }
    }
  }
  next[color][i] = np;
  return { pos: next, captured, won: next[color].every((x) => x === 56) };
}

/** Le téléphone choisit un pion : sortir, capturer et avancer sont préférés. */
export function botChoose(pos: Positions, color: Color, dice: number, mv: number[]): number {
  let best = mv[0], bs = -1;
  for (const i of mv) {
    const p = pos[color][i];
    const np = p === -1 ? 0 : p + dice;
    let sc = np;
    if (p === -1) sc += 30;
    if (wouldCapture(pos, color, np)) sc += 60;
    if (sc > bs) { bs = sc; best = i; }
  }
  return best;
}
