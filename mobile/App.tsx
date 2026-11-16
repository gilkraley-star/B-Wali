import React from "react";
import { registerGlobals } from "@livekit/react-native";

registerGlobals();
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/context/AuthContext";
import { I18nProvider } from "./src/i18n";
import { NetProvider } from "./src/context/NetContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
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
