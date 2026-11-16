import AsyncStorage from "@react-native-async-storage/async-storage";

// Verrou de l'appli : code à 4 chiffres OU schéma (points reliés). Stocké sur le téléphone, jamais envoyé.
export type Lock = { type: "pin" | "pattern"; h: string } | null;
const KEY = "wali.applock";
function hash(s: string) { let h = 5381; const x = "wali·" + s + "·v1"; for (let i = 0; i < x.length; i++) h = ((h << 5) + h + x.charCodeAt(i)) | 0; return String(h); }
async function put(v: string | null) {
  try { const S = require("expo-secure-store"); if (v === null) await S.deleteItemAsync(KEY); else await S.setItemAsync(KEY, v); return; } catch {}
  if (v === null) await AsyncStorage.removeItem(KEY); else await AsyncStorage.setItem(KEY, v);
}
async function get(): Promise<string | null> {
  try { const S = require("expo-secure-store"); const v = await S.getItemAsync(KEY); if (v) return v; } catch {}
  return AsyncStorage.getItem(KEY);
}
export async function getLock(): Promise<Lock> { try { const v = await get(); return v ? JSON.parse(v) : null; } catch { return null; } }
export async function setLock(type: "pin" | "pattern", secret: string) { await put(JSON.stringify({ type, h: hash(secret) })); }
export async function clearLock() { await put(null); }
export async function checkLock(l: NonNullable<Lock>, secret: string) { return l.h === hash(secret); }
