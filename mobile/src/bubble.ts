import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Platform } from "react-native";

// Bulle flottante (Android) : option choisie dans Réglages, désactivée par défaut.
const KEY = "wali.bubble";
let native: any = null;
function mod() {
  if (Platform.OS !== "android") return null;
  if (native) return native;
  try { native = require("expo-modules-core").requireNativeModule("WaliBubble"); } catch { native = null; }
  return native;
}
export const bubbleSupported = () => !!mod();
export const bubbleCanDraw = (): boolean => { try { return !!mod()?.canDraw(); } catch { return false; } };
export const bubbleRequestPermission = () => { try { mod()?.requestPermission(); } catch {} };
export async function bubbleEnabled() { return (await AsyncStorage.getItem(KEY)) === "1"; }
export async function setBubbleEnabled(on: boolean) { await AsyncStorage.setItem(KEY, on ? "1" : "0"); await applyBubble(); }
export async function applyBubble() {
  const m = mod(); if (!m) return;
  try { m.configure(await bubbleEnabled(), AppState.currentState === "active"); } catch {}
}
let sub: any = null;
export function startBubbleWatcher() {
  if (sub || !mod()) return;
  applyBubble();
  sub = AppState.addEventListener("change", () => { applyBubble(); });
}
