import AsyncStorage from "@react-native-async-storage/async-storage";

// Permet de conserver localement le calendrier personnel et les articles téléchargés,
// même sans connexion Internet (section 8 du dossier projet).
// Les fonctionnalités communautaires (forum) nécessitent, elles, une connexion.

const KEYS = {
  periods: "bewali.offline.periods",
  savedArticles: "bewali.offline.savedArticles",
};

export async function cachePeriods(periods: unknown[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.periods, JSON.stringify(periods));
}

export async function getCachedPeriods<T = unknown>(): Promise<T[]> {
  const raw = await AsyncStorage.getItem(KEYS.periods);
  return raw ? JSON.parse(raw) : [];
}

export async function cacheSavedArticles(articles: unknown[]): Promise<void> {
  await AsyncStorage.setItem(KEYS.savedArticles, JSON.stringify(articles));
}

export async function getCachedSavedArticles<T = unknown>(): Promise<T[]> {
  const raw = await AsyncStorage.getItem(KEYS.savedArticles);
  return raw ? JSON.parse(raw) : [];
}
