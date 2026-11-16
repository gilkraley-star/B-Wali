import { Audio } from "expo-av";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Petits sons doux pour les jeux. Ils se coupent dans Réglages. Ils respectent aussi le mode silencieux du téléphone.
const FILES = {
  tap: require("../../assets/sounds/tap.wav"),
  seed: require("../../assets/sounds/seed.wav"),
  move: require("../../assets/sounds/move.wav"),
  dice: require("../../assets/sounds/dice.wav"),
  good: require("../../assets/sounds/good.wav"),
  bad: require("../../assets/sounds/bad.wav"),
  found: require("../../assets/sounds/found.wav"),
  capture: require("../../assets/sounds/capture.wav"),
  win: require("../../assets/sounds/win.wav"),
  lose: require("../../assets/sounds/lose.wav"),
  coin: require("../../assets/sounds/coin.wav"),
};
export type SoundName = keyof typeof FILES;

const KEY = "bewali.sounds";
let enabled = true;
let loaded = false;
const cache: Partial<Record<SoundName, Audio.Sound>> = {};

async function init() {
  if (loaded) return;
  loaded = true;
  const v = await AsyncStorage.getItem(KEY).catch(() => null);
  if (v === "off") enabled = false;
  await Audio.setAudioModeAsync({ playsInSilentModeIOS: false, staysActiveInBackground: false }).catch(() => undefined);
}

export async function soundsEnabled(): Promise<boolean> { await init(); return enabled; }
export async function setSoundsEnabled(on: boolean): Promise<void> {
  await init(); enabled = on;
  await AsyncStorage.setItem(KEY, on ? "on" : "off");
}

/** Joue un son. Ne fait jamais planter un jeu : toute erreur est ignorée. */
export async function play(name: SoundName): Promise<void> {
  try {
    await init();
    if (!enabled) return;
    let s = cache[name];
    if (!s) { const r = await Audio.Sound.createAsync(FILES[name], { volume: 0.7 }); s = r.sound; cache[name] = s; }
    await s.replayAsync();
  } catch { /* silence */ }
}
