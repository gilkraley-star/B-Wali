import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import NetInfo from "@react-native-community/netinfo";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { setNetworkErrorHandler, OFFLINE_MESSAGE } from "../api/client";

interface NetValue {
  online: boolean;
  /** Si pas de réseau : affiche la jolie notification et renvoie false. À appeler avant une action qui demande internet. */
  requireOnline: (message?: string) => boolean;
}

const NetContext = createContext<NetValue>({ online: true, requireOnline: () => true });
export const useNet = () => useContext(NetContext);

export function NetProvider({ children }: { children: React.ReactNode }) {
  const [online, setOnline] = useState(true);
  const [toast, setToast] = useState<string | null>(null);
  const slide = useRef(new Animated.Value(-140)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => {
    Animated.timing(slide, { toValue: -140, duration: 220, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() =>
      setToast(null)
    );
  }, [slide]);

  const show = useCallback(
    (msg?: string) => {
      setToast(msg || OFFLINE_MESSAGE);
      Animated.spring(slide, { toValue: 0, friction: 7, tension: 80, useNativeDriver: true }).start();
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(hide, 4500);
    },
    [slide, hide]
  );

  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => setOnline(s.isConnected !== false && s.isInternetReachable !== false));
    setNetworkErrorHandler(show);
    return () => {
      unsub();
      setNetworkErrorHandler(null);
      if (hideTimer.current) clearTimeout(hideTimer.current);
    };
  }, [show]);

  const requireOnline = useCallback(
    (message?: string) => {
      if (online) return true;
      show(message);
      return false;
    },
    [online, show]
  );

  return (
    <NetContext.Provider value={{ online, requireOnline }}>
      {children}
      {toast && (
        <Animated.View pointerEvents="box-none" style={[styles.wrap, { top: insets.top + 8, transform: [{ translateY: slide }] }]}>
          <TouchableOpacity activeOpacity={0.9} onPress={hide} style={styles.toast} accessibilityRole="alert">
            <Text style={styles.icon}>📶</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Pas de connexion</Text>
              <Text style={styles.text}>{toast}</Text>
            </View>
          </TouchableOpacity>
        </Animated.View>
      )}
    </NetContext.Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 14, right: 14, zIndex: 999 },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#3B1D33",
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  icon: { fontSize: 26 },
  title: { color: "#fff", fontWeight: "800", fontSize: 14 },
  text: { color: "#F3DEE1", fontSize: 12.5, marginTop: 2, lineHeight: 17 },
});
