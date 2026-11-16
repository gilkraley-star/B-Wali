import React, { useEffect, useState } from "react";
import "./src/theme/font";
import { useFonts } from "expo-font";
import { Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from "@expo-google-fonts/poppins";
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
import ErrorBoundary from "./src/components/ErrorBoundary";

export default function App() {
  const [fontsLoaded] = useFonts({ Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  const [intro, setIntro] = useState<null | "long" | "short" | "done">(null);
  useEffect(() => { (async () => {
    let seen = null; try { seen = await AsyncStorage.getItem("wali.introSeen"); await AsyncStorage.setItem("wali.introSeen", "1"); } catch {}
    setIntro(seen ? "short" : "long");
  })(); }, []);
  if (!fontsLoaded) return null;
  return (
    <ErrorBoundary>
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <NetProvider>
            <StatusBar style="dark" />
            <AppNavigator />
            {intro === "long" || intro === "short" ? <AppIntro long={intro === "long"} onDone={() => setIntro("done")} /> : null}
          </NetProvider>
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
    </ErrorBoundary>
  );
}
