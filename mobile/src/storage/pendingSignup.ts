import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// Inscription faite SANS internet : on garde tout sur le téléphone, et le compte est créé dès que le réseau revient.
// Le mot de passe est rangé dans l'espace sécurisé du téléphone, et effacé dès que le compte est créé.

const KEY = "bewali.pendingSignup";
const PWD_KEY = "bewali_pending_pwd";

export interface PendingSignup {
  phone?: string;
  email?: string;
  pseudonyme: string;
  birthDate: string; // AAAA-MM-JJ
  photo: string; // data URL
  acceptTerms: true;
  createdAt: string;
}

export async function savePending(p: PendingSignup, password: string): Promise<void> {
  await SecureStore.setItemAsync(PWD_KEY, password);
  await AsyncStorage.setItem(KEY, JSON.stringify(p));
}

export async function loadPending(): Promise<(PendingSignup & { password: string }) | null> {
  const raw = await AsyncStorage.getItem(KEY);
  if (!raw) return null;
  const password = await SecureStore.getItemAsync(PWD_KEY);
  if (!password) return null;
  return { ...(JSON.parse(raw) as PendingSignup), password };
}

export async function updatePending(patch: Partial<PendingSignup>): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY);
  if (raw) await AsyncStorage.setItem(KEY, JSON.stringify({ ...JSON.parse(raw), ...patch }));
}

export async function clearPending(): Promise<void> {
  await AsyncStorage.removeItem(KEY);
  await SecureStore.deleteItemAsync(PWD_KEY).catch(() => undefined);
}

export function bracketFromBirthDate(birthDate: string): "ADOLESCENTE" | "JEUNE_FEMME" | "FEMME_ADULTE" {
  const [y, m, d] = birthDate.split("-").map((x) => parseInt(x, 10));
  const now = new Date();
  let age = now.getFullYear() - y;
  if (now.getMonth() + 1 < m || (now.getMonth() + 1 === m && now.getDate() < d)) age--;
  return age < 18 ? "ADOLESCENTE" : age < 26 ? "JEUNE_FEMME" : "FEMME_ADULTE";
}
