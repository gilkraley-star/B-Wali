import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { fr, TranslationKeys } from "./fr";
import { sg } from "./sg";
import { en } from "./en";

export type Lang = "fr" | "sg" | "en";

const dictionaries: Record<Lang, Record<string, string>> = { fr, sg, en };

interface I18nContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKeys) => string;
}

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

const LANG_STORAGE_KEY = "bewali.lang";

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>("fr");

  useEffect(() => {
    AsyncStorage.getItem(LANG_STORAGE_KEY).then((stored) => {
      if (stored === "fr" || stored === "sg" || stored === "en") setLangState(stored);
    });
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    AsyncStorage.setItem(LANG_STORAGE_KEY, next);
  };

  const t = (key: TranslationKeys) => dictionaries[lang][key] ?? dictionaries.fr[key] ?? key;

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n doit être utilisé à l'intérieur de I18nProvider");
  return ctx;
}
