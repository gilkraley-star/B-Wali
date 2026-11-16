import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "../api/client";

// Le cycle marche SANS internet : tout est gardé d'abord sur le téléphone, et envoyé au serveur
// (pour ne pas le perdre si le téléphone casse) dès qu'il y a du réseau. Le calcul se fait sur le téléphone.

const KEY = "bewali.cycle.local";

export interface LocalPeriod {
  id: string;
  startDate: string; // AAAA-MM-JJ
  endDate?: string | null;
  pending?: boolean; // pas encore envoyé au serveur
}

export interface LocalEstimate {
  averageCycleLength: number | null;
  nextEstimatedStart: string | null;
}

export async function loadLocalPeriods(): Promise<LocalPeriod[]> {
  const raw = await AsyncStorage.getItem(KEY);
  const list: LocalPeriod[] = raw ? JSON.parse(raw) : [];
  return list.sort((a, b) => b.startDate.localeCompare(a.startDate));
}

async function save(list: LocalPeriod[]) {
  await AsyncStorage.setItem(KEY, JSON.stringify(list));
}

export async function clearLocalCycle() {
  await AsyncStorage.removeItem(KEY);
}

/** Ajoute une date de début de règles sur le téléphone (marche hors ligne). */
export async function addLocalPeriod(startDate: string): Promise<LocalPeriod[]> {
  const list = await loadLocalPeriods();
  if (!list.some((p) => p.startDate === startDate)) {
    list.push({ id: `local-${Date.now()}`, startDate, pending: true });
  }
  await save(list);
  return loadLocalPeriods();
}

/** Estimation calculée sur le téléphone, même règle que le serveur (moyenne des derniers cycles). */
export function estimateLocal(periods: LocalPeriod[]): LocalEstimate {
  const recent = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 6);
  if (recent.length < 2) return { averageCycleLength: null, nextEstimatedStart: null };
  const day = 86400000;
  const diffs: number[] = [];
  for (let i = 0; i < recent.length - 1; i++) {
    diffs.push((Date.parse(recent[i].startDate) - Date.parse(recent[i + 1].startDate)) / day);
  }
  const avg = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
  const next = new Date(Date.parse(recent[0].startDate) + avg * day);
  return { averageCycleLength: avg, nextEstimatedStart: next.toISOString().slice(0, 10) };
}

/**
 * Envoie ce qui est en attente puis récupère la version du serveur.
 * Renvoie la liste à jour, ou null s'il n'y a pas de réseau (rien n'est perdu : tout reste sur le téléphone).
 */
export async function syncCycle(): Promise<LocalPeriod[] | null> {
  const local = await loadLocalPeriods();
  try {
    for (const p of local.filter((x) => x.pending)) {
      await apiRequest("/cycle/periods", { method: "POST", body: { startDate: p.startDate } });
    }
    const server = await apiRequest<{ id: string; startDate: string; endDate?: string | null }[]>("/cycle/periods");
    const merged: LocalPeriod[] = server.map((s) => ({
      id: s.id,
      startDate: s.startDate.slice(0, 10),
      endDate: s.endDate ? s.endDate.slice(0, 10) : null,
    }));
    await save(merged);
    return loadLocalPeriods();
  } catch {
    return null;
  }
}
