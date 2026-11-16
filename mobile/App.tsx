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
import { Keyboard, ScrollView, FlatList, View } from "react-native";
import ErrorBoundary from "./src/components/ErrorBoundary";

// Un tap n'importe où (hors du champ en cours) ferme le clavier ; faire défiler aussi.
(ScrollView as any).defaultProps = { ...(ScrollView as any).defaultProps, keyboardShouldPersistTaps: "handled", keyboardDismissMode: "on-drag" };
(FlatList as any).defaultProps = { ...(FlatList as any).defaultProps, keyboardShouldPersistTaps: "handled", keyboardDismissMode: "on-drag" };
let tapStart: { x: number; y: number; f: any } | null = null;
function onTouchStart(e: any) { tapStart = { x: e.nativeEvent.pageX, y: e.nativeEvent.pageY, f: (TextInput as any).State?.currentlyFocusedInput?.() }; }
function onTouchEnd(e: any) {
  const st = tapStart; tapStart = null;
  if (!st || !st.f || Math.hypot(e.nativeEvent.pageX - st.x, e.nativeEvent.pageY - st.y) > 12) return;
  const target = e.target;
  setTimeout(() => {
    const now = (TextInput as any).State?.currentlyFocusedInput?.();
    if (now && now === st.f) { try { const { findNodeHandle } = require("react-native"); if (findNodeHandle(now) === target) return; } catch {} Keyboard.dismiss(); }
  }, 90);
}

export default function App() {
  const [fontsLoaded] = useFonts({ Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Caveat_500Medium, Caveat_700Bold });
  const [intro, setIntro] = useState<null | "long" | "short" | "done">(null);
  useEffect(() => { (async () => {
    let seen = null; try { seen = await AsyncStorage.getItem("wali.introSeen"); await AsyncStorage.setItem("wali.introSeen", "1"); } catch {}
    setIntro(seen ? "short" : "long");
  })(); }, []);
  if (!fontsLoaded) return null;
  return (
    <ErrorBoundary>
    <View style={{ flex: 1 }} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
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
    </View>
    </ErrorBoundary>
  );
}
