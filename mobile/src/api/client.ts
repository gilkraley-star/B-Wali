import Constants from "expo-constants";
import AsyncStorage from "@react-native-async-storage/async-storage";

const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string) || "http://10.0.2.2:4000/api";

/** Adresse du serveur sans "/api" — sert à afficher les photos (/uploads/…). */
export const apiOrigin: string = API_BASE_URL.replace(/\/api\/?$/, "");

const TOKEN_KEY = "bewali.token";

export async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem(TOKEN_KEY);
}

export async function setToken(token: string | null): Promise<void> {
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  auth?: boolean; // true par défaut
  silent?: boolean; // pas de notification « pas de connexion » (téléchargements en arrière-plan)
}

// --- Mode hors ligne ---------------------------------------------------------------
// Quand une action a besoin d'internet et que le réseau manque, l'appli affiche une jolie notification
// (voir NetContext) au lieu d'une erreur technique. Les lectures déjà vues sont gardées sur le téléphone.
let networkErrorHandler: ((msg?: string) => void) | null = null;
export function setNetworkErrorHandler(fn: ((msg?: string) => void) | null) {
  networkErrorHandler = fn;
}
export const OFFLINE_MESSAGE = "Connecte-toi à internet.";
const CACHE_PREFIX = "bewali.cache:";

export async function clearApiCache(): Promise<void> {
  const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(CACHE_PREFIX));
  if (keys.length) await AsyncStorage.multiRemove(keys);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Client HTTP minimal partagé par tous les écrans — centralise l'auth et la gestion d'erreurs. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true, silent = false } = options;

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (auth) {
    const token = await getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    // Lecture déjà vue : on la redonne depuis le téléphone, sans bruit.
    if (method === "GET") {
      const cached = await AsyncStorage.getItem(CACHE_PREFIX + path);
      if (cached) return JSON.parse(cached) as T;
    }
    if (!silent) networkErrorHandler?.();
    throw new ApiError(OFFLINE_MESSAGE, 0);
  }

  if (response.status === 204) return undefined as T;

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(data.error || "Une erreur est survenue.", response.status);
  }
  if (method === "GET") {
    AsyncStorage.setItem(CACHE_PREFIX + path, JSON.stringify(data)).catch(() => undefined);
  }
  return data as T;
}

/** Envoie une photo ou une vidéo (fichier du téléphone) et renvoie son adresse sur le serveur. */
export async function uploadMedia(uri: string, mime: string): Promise<{ url: string; kind: "image" | "video" | "audio" }> {
  const token = await getToken();
  let response: Response;
  try {
    const blob = await (await fetch(uri)).blob();
    response = await fetch(`${API_BASE_URL}/forum/media`, {
      method: "POST",
      headers: { "Content-Type": mime, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: blob,
    });
  } catch {
    networkErrorHandler?.();
    throw new ApiError(OFFLINE_MESSAGE, 0);
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new ApiError(data.error || "Envoi impossible.", response.status);
  return data;
}
