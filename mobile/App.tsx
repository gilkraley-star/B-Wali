import React from "react";
import { registerGlobals } from "@livekit/react-native";

registerGlobals();
import { useFonts } from "expo-font";
import { Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold } from "@expo-google-fonts/poppins";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from "@expo-google-fonts/inter";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { I18nProvider } from "./src/i18n";
import { NetProvider } from "./src/context/NetContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  const [fontsLoaded] = useFonts({ Poppins_600SemiBold, Poppins_700Bold, Poppins_800ExtraBold, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });
  if (!fontsLoaded) return null;
  return (
    <SafeAreaProvider>
      <I18nProvider>
        <AuthProvider>
          <NetProvider>
            <StatusBar style="dark" />
            <AppNavigator />
          </NetProvider>
        </AuthProvider>
      </I18nProvider>
    </SafeAreaProvider>
  );
}
