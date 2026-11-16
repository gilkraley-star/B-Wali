// Progression des jeux : tout marche SANS internet. Les résultats attendent dans une file et partent au serveur
// dès qu'il y a du réseau ; c'est le SERVEUR qui calcule et donne les étoiles.
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "../api/client";

const K_QUEUE = "bewali.games.queue";
const K_LOCAL = "bewali.games.local";

export interface LocalGames {
  stars: number; // estimation affichée hors ligne ; remplacée par le total du serveur dès qu'on est connectée
  open: Record<string, number>; // quiz-culture, quiz-english, mm-fr, mm-en → niveau le plus haut ouvert
}
const DEFAULT: LocalGames = { stars: 0, open: { "quiz-culture": 1, "quiz-english": 1, "mm-fr": 1, "mm-en": 1 } };

export async function loadLocal(): Promise<LocalGames> {
  try {
    const raw = await AsyncStorage.getItem(K_LOCAL);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : DEFAULT;
  } catch { return DEFAULT; }
}
async function saveLocal(g: LocalGames) { await AsyncStorage.setItem(K_LOCAL, JSON.stringify(g)); }

type Job = { path: string; body: any };
async function getQueue(): Promise<Job[]> {
  try { return JSON.parse((await AsyncStorage.getItem(K_QUEUE)) || "[]"); } catch { return []; }
}
async function setQueue(q: Job[]) { await AsyncStorage.setItem(K_QUEUE, JSON.stringify(q)); }

/** Envoie ce qui attend. S'arrête au premier échec réseau (on réessaiera plus tard). */
export async function syncGames(): Promise<void> {
  const q = await getQueue();
  const rest: Job[] = [];
  let failed = false;
  for (const job of q) {
    if (failed) { rest.push(job); continue; }
    try { await apiRequest(job.path, { method: "POST", body: job.body, silent: true }); }
    catch (e: any) { if (e?.status && e.status < 500) continue; /* refus définitif : on abandonne ce résultat */ failed = true; rest.push(job); }
  }
  await setQueue(rest);
  try {
    const me = await apiRequest<{ totalStars: number; open: Record<string, number> }>("/games/me", { silent: true });
    const local = await loadLocal();
    const open = { ...local.open };
    for (const k of Object.keys(me.open)) open[k] = Math.max(open[k] || 1, me.open[k]);
    await saveLocal({ stars: Math.max(me.totalStars, queueIsEmpty(rest) ? me.totalStars : local.stars), open });
  } catch { /* hors ligne */ }
}

async function enqueue(job: Job) { const q = await getQueue(); q.push(job); await setQueue(q); syncGames().catch(() => {}); }

/** Fin d'un niveau de quiz. Renvoie les étoiles estimées (le serveur confirmera). */
export async function submitQuiz(kind: "culture" | "english", level: number, answers: boolean[], right: number): Promise<number> {
  const key = "quiz-" + kind;
  const local = await loadLocal();
  const earned = right * 6;
  local.stars += earned;
  if (right >= 4) local.open[key] = Math.max(local.open[key] || 1, level + 1);
  await saveLocal(local);
  await enqueue({ path: "/games/quiz", body: { kind, level, answers } });
  return earned;
}

export async function submitMotsMeles(lang: "fr" | "en", serie: number, found: string[]): Promise<number> {
  const key = "mm-" + lang;
  const local = await loadLocal();
  local.stars += 20;
  local.open[key] = Math.max(local.open[key] || 1, serie + 1);
  await saveLocal(local);
  await enqueue({ path: "/games/mots-meles", body: { lang, serie, found } });
  return 20;
}

export async function submitBotGame(game: "awale" | "ludo", result: "win" | "loss"): Promise<number> {
  const local = await loadLocal();
  const earned = result === "win" ? 30 : 10;
  local.stars += earned;
  await saveLocal(local);
  const clientId = Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
  await enqueue({ path: "/games/bot", body: { game, result, clientId } });
  return earned;
}

function queueIsEmpty(q: Job[]) { return q.length === 0; }
