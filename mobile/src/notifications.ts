import AsyncStorage from "@react-native-async-storage/async-storage";
import { estimateLocal, getCycleLen, loadLocalPeriods } from "./storage/localCycle";

// Rappels de règles sur le téléphone : notification discrète (le mot « règles » n'apparaît jamais).
// Le module de notifications est chargé à la demande : s'il pose problème sur un téléphone, l'appli continue de marcher.
const KEY = "wali.remindersOn";
export async function remindersEnabled(): Promise<boolean> { return (await AsyncStorage.getItem(KEY)) === "1"; }

export async function setReminders(on: boolean): Promise<boolean> {
  await AsyncStorage.setItem(KEY, on ? "1" : "0");
  return scheduleCycleReminders();
}

// Annule puis reprogramme : 2 jours avant, puis le jour même, à 9 h.
export async function scheduleCycleReminders(): Promise<boolean> {
  try {
    const N = require("expo-notifications");
    await N.cancelAllScheduledNotificationsAsync();
    if (!(await remindersEnabled())) return true;
    let perm = await N.getPermissionsAsync();
    if (!perm.granted) perm = await N.requestPermissionsAsync();
    if (!perm.granted) return false;
    await N.setNotificationChannelAsync?.("default", { name: "Rappels Wali", importance: N.AndroidImportance?.DEFAULT ?? 3 });
    const est = estimateLocal(await loadLocalPeriods(), await getCycleLen());
    if (!est.nextEstimatedStart) return true;
    const [y, m, d] = est.nextEstimatedStart.split("-").map(Number);
    const plan: [number, string][] = [[2, "Wali 💗 · Pense à te préparer, c'est bientôt."], [0, "Wali 💗 · Prends soin de toi aujourd'hui."]];
    for (const [before, body] of plan) {
      const at = new Date(y, m - 1, d - before, 9, 0, 0);
      if (at.getTime() > Date.now()) await N.scheduleNotificationAsync({ content: { title: "Wali", body }, trigger: { type: "date", date: at, channelId: "default" } });
    }
    return true;
  } catch { return false; }
}
