import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert, Linking, Platform, Vibration } from "react-native";

// Personne de confiance pour le SOS (3 appuis rapides). Stockée sur le téléphone uniquement.
export type Trusted = { name: string; phone: string } | null;
const KEY = "wali.sos.contact";
export async function getTrusted(): Promise<Trusted> {
  try { const S = require("expo-secure-store"); const v = await S.getItemAsync(KEY); if (v) return JSON.parse(v); } catch {}
  try { const v = await AsyncStorage.getItem(KEY); return v ? JSON.parse(v) : null; } catch { return null; }
}
export async function setTrusted(c: Trusted) {
  const v = c ? JSON.stringify(c) : null;
  try { const S = require("expo-secure-store"); if (v) await S.setItemAsync(KEY, v); else await S.deleteItemAsync(KEY); return; } catch {}
  if (v) await AsyncStorage.setItem(KEY, v); else await AsyncStorage.removeItem(KEY);
}

async function position(): Promise<{ lat: number; lng: number } | null> {
  try {
    const L = require("expo-location");
    const p = await L.requestForegroundPermissionsAsync();
    if (p.status !== "granted") return null;
    const last = await L.getLastKnownPositionAsync({ maxAge: 120000 }).catch(() => null);
    const cur = await Promise.race([L.getCurrentPositionAsync({ accuracy: L.Accuracy.Balanced }), new Promise((r) => setTimeout(() => r(null), 7000))]).catch(() => null) as any;
    const c = (cur || last)?.coords;
    return c ? { lat: c.latitude, lng: c.longitude } : null;
  } catch { return null; }
}

// Prépare et ouvre le SMS d'alerte. Les téléphones n'autorisent pas l'envoi totalement silencieux : la fille n'a plus qu'à appuyer sur « Envoyer ».
export async function sendSos(onNoContact: () => void) {
  Vibration.vibrate([0, 250, 120, 250]);
  const c = await getTrusted();
  if (!c) return onNoContact();
  const pos = await position();
  const msg = "🆘 SOS – Je suis en danger, j'ai besoin d'aide tout de suite. " + (pos ? `Ma position : https://maps.google.com/?q=${pos.lat},${pos.lng}` : "Je n'ai pas pu récupérer ma position, appelle-moi.");
  try {
    const SMS = require("expo-sms");
    if (await SMS.isAvailableAsync()) { await SMS.sendSMSAsync([c.phone], msg); return; }
  } catch {}
  Linking.openURL(`sms:${c.phone}${Platform.OS === "ios" ? "&" : "?"}body=${encodeURIComponent(msg)}`).catch(() => Alert.alert("SMS impossible", "Appelle directement " + c.name + "."));
}
