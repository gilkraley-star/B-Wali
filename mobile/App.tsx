import React, { useEffect, useState } from "react";
import "./src/theme/font";
import { useFonts } from "expo-font";
import { Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from "@expo-google-fonts/poppins";
import { Caveat_500Medium, Caveat_700Bold } from "@expo-google-fonts/caveat";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { StatusBar } from "expo-status-bar";
import { Text, TextInput } from "react-native";
// La taille de police choisie dans le téléphone ne déforme plus les écrans (cartes coupées, mots cassés).
(Text as any).defaultProps = { ...((Text as any).defaultProps || {}), allowFontScaling: false };
(TextInput as any).defaultProps = { ...((TextInput as any).defaultProps || {}), allowFontScaling: false };
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { I18nProvider } from "./src/i18n";
import { NetProvider } from "./src/context/NetContext";
import AppNavigator from "./src/navigation/AppNavigator";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppIntro } from "./src/components/Intro";
import AppLock from "./src/components/AppLock";
import { ScrollView, FlatList } from "react-native";
import { KeyboardTapDismiss } from "./src/theme/kb";
import ErrorBoundary from "./src/components/ErrorBoundary";
import { startBubbleWatcher } from "./src/bubble";

// Filet de sécurité : une erreur JS qui survient hors du rendu (dans un callback natif, par
// exemple pendant le direct) ne passe PAS par ErrorBoundary et, en version publiée, ferme
// l'appli d'un coup sans aucun message. On intercepte ce cas précis pour ne plus jamais fermer
// l'appli toute seule : on affiche juste une alerte et on continue.
(() => {
  const g: any = global as any;
  if (g.ErrorUtils && !g.__waliErrorHandlerInstalled) {
    g.__waliErrorHandlerInstalled = true;
    const prev = g.ErrorUtils.getGlobalHandler?.();
    g.ErrorUtils.setGlobalHandler((error: any, isFatal?: boolean) => {
      try { console.warn("Erreur interceptée (appli non fermée) :", error); } catch {}
      if (!isFatal) { prev?.(error, isFatal); return; }
      try {
        const { Alert } = require("react-native");
        // Détail technique affiché temporairement, pour diagnostiquer à distance sans accès aux logs du téléphone.
        const detail = String(error?.stack || error?.message || error).slice(0, 500);
        Alert.alert("Oups, un problème est survenu", "Continue d'utiliser Wali normalement ; si l'écran reste figé, reviens en arrière.\n\n" + detail);
      } catch {}
    });
  }
})();

// Un tap n'importe où (hors du champ en cours) ferme le clavier ; faire défiler aussi.
(ScrollView as any).defaultProps = { ...(ScrollView as any).defaultProps, keyboardShouldPersistTaps: "handled", keyboardDismissMode: "on-drag" };
(FlatList as any).defaultProps = { ...(FlatList as any).defaultProps, keyboardShouldPersistTaps: "handled", keyboardDismissMode: "on-drag" };
export default function App() {
  const [fontsLoaded] = useFonts({ Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Caveat_500Medium, Caveat_700Bold });
  const [intro, setIntro] = useState<null | "long" | "short" | "done">(null);
  useEffect(() => { startBubbleWatcher(); }, []);
  useEffect(() => { (async () => {
    let seen = null; try { seen = await AsyncStorage.getItem("wali.introSeen"); await AsyncStorage.setItem("wali.introSeen", "1"); } catch {}
    setIntro(seen ? "short" : "long");
  })(); }, []);
  if (!fontsLoaded) return null;
  return (
    <ErrorBoundary>
    <KeyboardTapDismiss>
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <NetProvider>
            <StatusBar style="dark" />
            <AppNavigator />
            {intro === "long" || intro === "short" ? <AppIntro long={intro === "long"} onDone={() => setIntro("done")} /> : null}
            <AppLock />
          </NetProvider>
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
    </KeyboardTapDismiss>
    </ErrorBoundary>
  );
}
