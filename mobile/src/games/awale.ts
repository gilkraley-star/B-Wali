// Moteur d'Awalé (2 joueuses). Trous 0-5 = côté de la joueuse (en bas), 6-11 = côté adverse.
// Règles : on sème dans le sens inverse des aiguilles d'une montre en sautant le trou de départ ;
// si la dernière graine tombe chez l'adversaire sur un trou qui contient alors 2 ou 3 graines, on les prend
// (et ceux d'avant tant qu'ils ont 2 ou 3), sauf si cela prend toutes ses graines.
export type Pits = number[];
export const START: Pits = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];

export interface MoveResult {
  frames: { pits: Pits; idx: number }[];
  pits: Pits;
  captured: number;
  lastIdx: number;
}

export function simulate(pits: Pits, i: number): MoveResult {
  const p = pits.slice();
  let n = p[i];
  p[i] = 0;
  let idx = i;
  const frames: { pits: Pits; idx: number }[] = [];
  while (n > 0) {
    idx = (idx + 1) % 12;
    if (idx === i) continue;
    p[idx]++;
    n--;
    frames.push({ pits: p.slice(), idx });
  }
  const mover = i < 6 ? 0 : 1;
  let captured = 0;
  let q = p.slice();
  if ((idx < 6 ? 0 : 1) !== mover) {
    let j = idx;
    const lo = mover === 0 ? 6 : 0;
    const hi = mover === 0 ? 11 : 5;
    while (j >= lo && j <= hi && (q[j] === 2 || q[j] === 3)) {
      captured += q[j];
      q[j] = 0;
      j--;
    }
    let left = 0;
    for (let k = lo; k <= hi; k++) left += q[k];
    if (left === 0) { captured = 0; q = p.slice(); } // on ne prend jamais toutes les graines de l'adversaire
  }
  return { frames, pits: q, captured, lastIdx: idx };
}

export function sideSum(p: Pits, side: 0 | 1): number {
  let s = 0;
  for (let k = side * 6; k < side * 6 + 6; k++) s += p[k];
  return s;
}

export function legalMoves(p: Pits, side: 0 | 1): number[] {
  const out: number[] = [];
  for (let k = side * 6; k < side * 6 + 6; k++) if (p[k] > 0) out.push(k);
  return out;
}

/** Le téléphone joue : le coup qui prend le plus de graines (un peu de hasard pour qu'il ne soit pas parfait). */
export function botMove(p: Pits, rnd: () => number = Math.random): number {
  let best = -1, bc = -1;
  for (const i of legalMoves(p, 1)) {
    const c = simulate(p, i).captured + rnd() * 0.9;
    if (c > bc) { bc = c; best = i; }
  }
  return best;
}

export interface GameState { pits: Pits; score: [number, number]; turn: 0 | 1; over: boolean; moves: number }
export const newGame = (): GameState => ({ pits: START.slice(), score: [0, 0], turn: 0, over: false, moves: 0 });

/** Applique un coup et renvoie le nouvel état (fin de partie : plus de graines chez l'autre, 25 graines, ou 120 coups). */
export function applyMove(g: GameState, i: number): { state: GameState; captured: number } {
  const mover = (i < 6 ? 0 : 1) as 0 | 1;
  const r = simulate(g.pits, i);
  const score: [number, number] = [g.score[0], g.score[1]];
  score[mover] += r.captured;
  const pits = r.pits.slice();
  const next = (1 - mover) as 0 | 1;
  let over = false;
  const moves = g.moves + 1;
  if (sideSum(pits, next) === 0) {
    score[mover] += sideSum(pits, mover);
    for (let k = mover * 6; k < mover * 6 + 6; k++) pits[k] = 0;
    over = true;
  }
  if (score[0] >= 25 || score[1] >= 25 || moves > 120) over = true;
  return { state: { pits, score, turn: next, over, moves }, captured: r.captured };
}
