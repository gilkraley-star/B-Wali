import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

// Mon Carnet : tout reste sur le téléphone de la fille (jamais envoyé au serveur) ; un code secret peut le verrouiller.
export type Kind = "text" | "long" | "number" | "date" | "choice" | "mood";
export interface FieldDef { key: string; label: string; kind: Kind; options?: string[]; hint?: string }
export interface CarnetType { id: string; emoji: string; title: string; about: string; group: "moi" | "maman" | "autre"; fields: FieldDef[]; note?: string }
export interface Entry { id: string; date: string; values: Record<string, string> }
export interface Carnet { id: string; type: string; title: string; emoji: string; entries: Entry[] }

export const MOODS = ["😄", "🙂", "😐", "😔", "😢", "😡", "😰", "🥰"];
const VACCINS = ["BCG (naissance)", "Polio 0 (naissance)", "Penta 1 (6 semaines)", "Polio 1 (6 semaines)", "Pneumo 1 (6 semaines)", "Rota 1 (6 semaines)", "Penta 2 (10 semaines)", "Polio 2 (10 semaines)", "Pneumo 2 (10 semaines)", "Rota 2 (10 semaines)", "Penta 3 (14 semaines)", "Polio 3 (14 semaines)", "Pneumo 3 (14 semaines)", "Polio injectable (14 semaines)", "Rougeole (9 mois)", "Fièvre jaune (9 mois)", "Autre vaccin"];

export const TYPES: CarnetType[] = [
  { id: "journal", emoji: "📔", title: "Journal intime", group: "moi", about: "Écris ce que tu ressens. Personne d'autre ne le lit.", fields: [{ key: "mood", label: "Comment je me sens", kind: "mood" }, { key: "text", label: "Mon texte", kind: "long" }] },
  { id: "sante", emoji: "🩺", title: "Carnet de santé", group: "moi", about: "Tes rendez-vous, mesures et soins.", fields: [{ key: "quoi", label: "Quoi ?", kind: "choice", options: ["Rendez-vous", "Poids", "Tension", "Symptôme", "Médicament / traitement", "Analyse", "Autre"] }, { key: "valeur", label: "Valeur ou nom (ex. 52 kg)", kind: "text" }, { key: "note", label: "Note", kind: "long" }] },
  { id: "objectifs", emoji: "🎯", title: "Mes rêves et objectifs", group: "moi", about: "Ce que tu veux réussir, étape par étape.", fields: [{ key: "obj", label: "Mon objectif", kind: "text" }, { key: "etat", label: "Où j'en suis", kind: "choice", options: ["Je commence", "En cours", "Réussi 🎉"] }, { key: "note", label: "Note", kind: "long" }] },
  { id: "sous", emoji: "💰", title: "Mes sous", group: "moi", about: "Ce que tu gagnes et ce que tu dépenses.", fields: [{ key: "sens", label: "Quoi ?", kind: "choice", options: ["J'ai reçu", "J'ai dépensé", "J'ai épargné"] }, { key: "fcfa", label: "Montant (FCFA)", kind: "number" }, { key: "note", label: "Pour quoi ?", kind: "text" }] },
  { id: "grossesse", emoji: "🤰", title: "Visites prénatales", group: "maman", about: "Chaque visite pendant ta grossesse.", fields: [{ key: "sa", label: "Mois ou semaines de grossesse", kind: "text" }, { key: "poids", label: "Poids (kg)", kind: "number" }, { key: "tension", label: "Tension", kind: "text" }, { key: "note", label: "Ce que la sage-femme a dit", kind: "long" }, { key: "next", label: "Prochaine visite (JJ/MM/AAAA)", kind: "date" }] },
  { id: "vaccin", emoji: "💉", title: "Vaccination de mon bébé", group: "maman", about: "Note chaque vaccin reçu.", note: "Les âges proposés suivent le calendrier habituel de vaccination des bébés. Vérifie toujours avec ton centre de santé : c'est lui qui décide.", fields: [{ key: "bebe", label: "Prénom du bébé", kind: "text" }, { key: "vaccin", label: "Vaccin", kind: "choice", options: VACCINS }, { key: "lieu", label: "Où ? (centre de santé)", kind: "text" }, { key: "next", label: "Prochain rendez-vous (JJ/MM/AAAA)", kind: "date" }] },
  { id: "bebe", emoji: "👶", title: "Croissance de bébé", group: "maman", about: "Poids, taille et premiers moments.", fields: [{ key: "bebe", label: "Prénom du bébé", kind: "text" }, { key: "poids", label: "Poids (kg)", kind: "number" }, { key: "taille", label: "Taille (cm)", kind: "number" }, { key: "note", label: "Premières fois, remarques", kind: "long" }] },
  { id: "apres", emoji: "💗", title: "Moi après l'accouchement", group: "maman", about: "Ta récupération et ton moral de maman.", fields: [{ key: "mood", label: "Comment je me sens", kind: "mood" }, { key: "corps", label: "Mon corps (douleurs, saignements, fatigue)", kind: "long" }, { key: "note", label: "Note", kind: "long" }] },
  { id: "libre", emoji: "✏️", title: "Mon propre carnet", group: "autre", about: "Crée un carnet avec le nom que tu veux.", fields: [{ key: "titre", label: "Titre", kind: "text" }, { key: "text", label: "Mon texte", kind: "long" }] },
];

const KEY = "bewali.carnets";
export const typeOf = (id: string) => TYPES.find((t) => t.id === id)!;
export async function loadCarnets(): Promise<Carnet[]> { try { return JSON.parse((await AsyncStorage.getItem(KEY)) || "[]"); } catch { return []; } }
export async function saveCarnets(c: Carnet[]) { await AsyncStorage.setItem(KEY, JSON.stringify(c)); }

export const todayFr = () => { const d = new Date(); return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`; };
export const frToKey = (s: string) => { const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s.trim()); return m ? `${m[3]}${m[2].padStart(2, "0")}${m[1].padStart(2, "0")}` : "0"; };

const PIN = "bewali.carnet.pin";
export const getPin = () => SecureStore.getItemAsync(PIN).catch(() => null);
export const setPin = (p: string | null) => (p ? SecureStore.setItemAsync(PIN, p) : SecureStore.deleteItemAsync(PIN)).catch(() => undefined);
