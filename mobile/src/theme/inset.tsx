import React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// La barre d'état est transparente : les écrans sans en-tête doivent se placer en dessous, avec un peu d'air.
export function useTopPad() { const i = useSafeAreaInsets(); return Math.max(i.top - 12, 0); }
export function withTop<P extends object>(Comp: React.ComponentType<P>) {
  const W = (props: P) => { const p = useTopPad(); return <View style={{ flex: 1, paddingTop: p }}><Comp {...props} /></View>; };
  return W;
}
