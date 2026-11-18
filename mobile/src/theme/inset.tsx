import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// La barre d'état est transparente : les écrans sans en-tête doivent se placer en dessous, avec un peu d'air.
// Si la barre d'état est opaque (cas courant), le système laisse déjà la place : on ne met qu'un petit air. Si elle est transparente, on se place en dessous.
export function useTopPad() { const i = useSafeAreaInsets(); return i.top > 0 ? i.top + 6 : 8; }
export function withTop<P extends object>(Comp: React.ComponentType<P>) {
  const W = (props: P) => { const p = useTopPad(); return <View style={{ flex: 1, paddingTop: p, backgroundColor: "#FFF6F0" }}><Comp {...props} /></View>; };
  return W;
}
