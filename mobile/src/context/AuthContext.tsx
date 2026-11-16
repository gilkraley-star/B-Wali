import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { ApiError, apiRequest, clearApiCache, getToken, setToken } from "../api/client";
import { clearLocalCycle } from "../storage/localCycle";
import { prefetchOffline } from "../storage/prefetch";
import { bracketFromBirthDate, clearPending, loadPending, savePending, updatePending } from "../storage/pendingSignup";

export interface User {
  id: string;
  pseudonyme: string;
  ageBracket: "ADOLESCENTE" | "JEUNE_FEMME" | "FEMME_ADULTE";
  role: string;
  country?: string;
  participatesForum?: boolean;
  fullName?: string | null;
  profession?: string | null;
  photoUrl?: string | null;
  mustChangePassword?: boolean;
  pending?: boolean; // inscription faite sans internet : le compte sera créé dès que le réseau revient
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (data: {
    email?: string;
    phone?: string;
    password: string;
    pseudonyme: string;
    birthDate: string; // AAAA-MM-JJ
    acceptTerms: boolean;
    country?: string;
    photo: string; // photo de profil (data URL)
  }) => Promise<void>;
  logout: () => Promise<void>;
  /** Si l'envoi de l'inscription a échoué (pseudonyme ou numéro déjà pris…), le message à montrer. */
  pendingProblem: string | null;
  fixPending: (patch: { pseudonyme?: string; phone?: string; email?: string }) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingProblem, setPendingProblem] = useState<string | null>(null);
  const syncing = useRef(false);

  const localUser = (p: { pseudonyme: string; birthDate: string; country?: string }): User => ({
    id: "local", country: p.country, pseudonyme: p.pseudonyme, ageBracket: bracketFromBirthDate(p.birthDate), role: "UTILISATRICE", participatesForum: false, pending: true,
  });

  // Crée le compte en ligne à partir de l'inscription gardée sur le téléphone.
  const syncPending = async () => {
    if (syncing.current) return;
    syncing.current = true;
    try {
      const p = await loadPending();
      if (!p) return;
      const { password, createdAt, ...rest } = p;
      try {
        const res = await apiRequest<{ token: string; user: User }>("/auth/signup", { method: "POST", body: { ...rest, password }, auth: false, silent: true });
        await setToken(res.token);
        await clearPending();
        setPendingProblem(null);
        setUser(res.user);
      } catch (e) {
        if (e instanceof ApiError && e.status === 0) return; // toujours pas de réseau : on réessaiera
        if (e instanceof ApiError && e.status >= 400 && e.status < 500) setPendingProblem(e.message); // pseudonyme/numéro pris, etc.
      }
    } finally {
      syncing.current = false;
    }
  };

  const fixPending: AuthContextValue["fixPending"] = async (patch) => {
    const clean: any = {};
    if (patch.pseudonyme) clean.pseudonyme = patch.pseudonyme;
    if (patch.phone) { clean.phone = patch.phone; clean.email = undefined; }
    if (patch.email) { clean.email = patch.email; clean.phone = undefined; }
    await updatePending(clean);
    const p = await loadPending();
    if (p) setUser(localUser(p));
    setPendingProblem(null);
    await syncPending();
  };

  const refreshUser = async () => {
    const token = await getToken();
    if (!token) {
      const p = await loadPending();
      if (p) { setUser(localUser(p)); syncPending(); } else setUser(null);
      return;
    }
    try {
      const me = await apiRequest<User>("/auth/me");
      setUser(me);
    } catch (e) {
      // On ne déconnecte que si le serveur dit que le compte n'est plus valable. Sans réseau, on reste connectée.
      if (e instanceof ApiError && e.status === 401) {
        await setToken(null);
        setUser(null);
      }
    }
  };

  useEffect(() => {
    refreshUser().finally(() => setIsLoading(false));
  }, []);

  // Dès que le réseau revient (ou que l'appli se rouvre), on envoie l'inscription en attente.
  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => { if (s.isConnected !== false) syncPending(); });
    const sub = AppState.addEventListener("change", (st) => { if (st === "active") syncPending(); });
    return () => { unsub(); sub.remove(); };
  }, []);

  // Dès qu'elle est connectée et qu'il y a internet, on garde le contenu sur le téléphone.
  useEffect(() => {
    if (user && !user.pending) prefetchOffline();
  }, [user?.id]);

  const login = async (identifier: string, password: string) => {
    const res = await apiRequest<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: { identifier, password },
      auth: false,
    });
    await setToken(res.token);
    setUser(res.user);
  };

  const signup: AuthContextValue["signup"] = async (data) => {
    try {
      const res = await apiRequest<{ token: string; user: User }>("/auth/signup", {
        method: "POST",
        body: data,
        auth: false,
        silent: true,
      });
      await setToken(res.token);
      setUser(res.user);
    } catch (e) {
      if (!(e instanceof ApiError) || e.status !== 0) throw e;
      // Pas d'internet : on garde l'inscription sur le téléphone et on laisse la fille entrer dans l'appli.
      const { password, ...rest } = data;
      await savePending({ ...rest, acceptTerms: true, createdAt: new Date().toISOString() }, password);
      setUser(localUser(data));
    }
  };

  const logout = async () => {
    await setToken(null);
    await clearApiCache(); // on efface ce qui était gardé sur le téléphone
    await clearLocalCycle();
    await clearPending();
    setPendingProblem(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser, pendingProblem, fixPending }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth doit être utilisé à l'intérieur de AuthProvider");
  return ctx;
}
