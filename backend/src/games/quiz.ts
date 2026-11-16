import { QUIZ_CULTURE, QUIZ_ENGLISH, QuizItem } from "./data";

export type QuizKind = "culture" | "english";

const CUTS: Record<QuizKind, number[]> = {
  culture: [33, 66, 100],
  english: [16, 33, 50, 70, 85, 100],
};
const BANKS: Record<QuizKind, QuizItem[][]> = { culture: QUIZ_CULTURE, english: QUIZ_ENGLISH };
export const TIER_NAMES: Record<QuizKind, string[]> = {
  culture: ["Débutante", "Confirmée", "Experte"],
  english: ["Débutante · A1", "Élémentaire · A2", "Élémentaire + · A2", "Intermédiaire · B1", "Avancée · B2", "Experte · C1"],
};
export const MAX_LEVEL = 100;

export function tierOf(kind: QuizKind, level: number): number {
  const cuts = CUTS[kind];
  for (let k = 0; k < cuts.length; k++) if (level <= cuts[k]) return k;
  return cuts.length - 1;
}

/** Les 5 questions d'un niveau. Même résultat sur le téléphone et sur le serveur. */
export function questionsFor(kind: QuizKind, level: number): QuizItem[] {
  const t = tierOf(kind, level);
  const bank = BANKS[kind][t];
  const start = (level * 5 + t * 3) % bank.length;
  const out: QuizItem[] = [];
  for (let k = 0; k < 5; k++) out.push(bank[(start + k * 3) % bank.length]);
  return out;
}

/** Nombre de bonnes réponses : answers = 5 valeurs vrai/faux données par la joueuse. */
export function countRight(kind: QuizKind, level: number, answers: boolean[]): number {
  const qs = questionsFor(kind, level);
  let n = 0;
  for (let i = 0; i < qs.length; i++) if (answers[i] === qs[i][3]) n++;
  return n;
}

export const PASS_MARK = 4; // 4 bonnes réponses sur 5 pour ouvrir le niveau suivant
export const STARS_PER_RIGHT = 6;
