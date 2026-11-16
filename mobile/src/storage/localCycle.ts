import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest } from "../api/client";

// Le cycle marche SANS internet : tout est gardé d'abord sur le téléphone, et envoyé au serveur
// (pour ne pas le perdre si le téléphone casse) dès qu'il y a du réseau. Le calcul se fait sur le téléphone.

const KEY = "bewali.cycle.local";
const LEN_KEY = "bewali.cycle.len";
export async function getCycleLen(): Promise<number> { const v = parseInt((await AsyncStorage.getItem(LEN_KEY)) || "", 10); return v >= 15 && v <= 60 ? v : 28; }
export async function setCycleLen(n: number) { await AsyncStorage.setItem(LEN_KEY, String(n)); }

const PLEN_KEY = "bewali.cycle.plen";
const DEL_KEY = "bewali.cycle.deleted";
export async function getPeriodLen(): Promise<number> { const v = parseInt((await AsyncStorage.getItem(PLEN_KEY)) || "", 10); return v >= 2 && v <= 10 ? v : 5; }
export async function setPeriodLen(n: number) { await AsyncStorage.setItem(PLEN_KEY, String(n)); }

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

/** Ajoute ou modifie une période (début et, si on la connaît, fin). Marche hors ligne. */
export async function savePeriod(startDate: string, endDate?: string | null): Promise<LocalPeriod[]> {
  const list = await loadLocalPeriods();
  const ex = list.find((p) => p.startDate === startDate);
  if (ex) { if (endDate !== undefined) ex.endDate = endDate; ex.pending = true; }
  else list.push({ id: `local-${Date.now()}`, startDate, endDate: endDate ?? null, pending: true });
  await save(list);
  return loadLocalPeriods();
}
/** Note la fin des règles : sur la période qui a commencé avant ce jour (la plus récente). */
export async function endPeriodOn(endDate: string): Promise<LocalPeriod[]> {
  const list = await loadLocalPeriods();
  const p = list.find((x) => x.startDate <= endDate);
  if (p) { p.endDate = endDate; p.pending = true; await save(list); }
  return loadLocalPeriods();
}
export async function removePeriod(id: string): Promise<LocalPeriod[]> {
  const list = (await loadLocalPeriods()).filter((p) => p.id !== id);
  await save(list);
  if (!id.startsWith("local-")) { const d = JSON.parse((await AsyncStorage.getItem(DEL_KEY)) || "[]"); d.push(id); await AsyncStorage.setItem(DEL_KEY, JSON.stringify(d)); }
  return loadLocalPeriods();
}

/** Estimation calculée sur le téléphone, même règle que le serveur (moyenne des derniers cycles). */
export function estimateLocal(periods: LocalPeriod[], defaultLen = 28): LocalEstimate {
  const recent = [...periods].sort((a, b) => b.startDate.localeCompare(a.startDate)).slice(0, 6);
  if (recent.length === 0) return { averageCycleLength: null, nextEstimatedStart: null };
  if (recent.length < 2) return { averageCycleLength: defaultLen, nextEstimatedStart: new Date(Date.parse(recent[0].startDate) + defaultLen * 86400000).toISOString().slice(0, 10) };
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
    const dels: string[] = JSON.parse((await AsyncStorage.getItem(DEL_KEY)) || "[]");
    for (const id of dels) { try { await apiRequest("/cycle/periods/" + id, { method: "DELETE", silent: true }); } catch (e: any) { if (e?.status === 0) throw e; } }
    await AsyncStorage.removeItem(DEL_KEY);
    for (const p of local.filter((x) => x.pending)) {
      const body: any = { startDate: p.startDate }; if (p.endDate) body.endDate = p.endDate;
      if (p.id.startsWith("local-")) await apiRequest("/cycle/periods", { method: "POST", body });
      else await apiRequest("/cycle/periods/" + p.id, { method: "PATCH", body });
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
