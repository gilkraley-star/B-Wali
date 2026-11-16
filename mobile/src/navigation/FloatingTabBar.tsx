import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

// Barre du bas de la maquette : une pastille blanche flottante, l'onglet actif en rose avec son nom.
const TABS: Record<string, { e: string; label: string }> = {
  Home: { e: "🏠", label: "Accueil" }, Cycle: { e: "🩸", label: "Mon cycle" }, Library: { e: "📚", label: "Je m'informe" },
  Forum: { e: "💬", label: "Entre Nous" }, Settings: { e: "⚙️", label: "Réglages" },
};
export default function FloatingTabBar({ state, navigation }: any) {
  return (
    <View style={s.wrap}>
      <View style={s.bar}>
        {state.routes.map((r: any, i: number) => {
          const on = state.index === i; const t = TABS[r.name];
          return (
            <TouchableOpacity key={r.key} accessibilityRole="button" accessibilityLabel={t.label} activeOpacity={0.8}
              onPress={() => { const ev = navigation.emit({ type: "tabPress", target: r.key, canPreventDefault: true }); if (!on && !ev.defaultPrevented) navigation.navigate(r.name); }}
              style={on ? s.on : s.off}>
              <Text style={{ fontSize: on ? 18 : 23 }}>{t.e}</Text>
              {on ? <Text style={s.lab}>{t.label}</Text> : null}
            </TouchableOpacity>);
        })}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  wrap: { paddingHorizontal: 16, paddingBottom: 16, paddingTop: 6, backgroundColor: "#FFF6F0" },
  bar: { height: 66, backgroundColor: "#fff", borderRadius: 33, flexDirection: "row", alignItems: "center", justifyContent: "space-around", paddingHorizontal: 8, shadowColor: "#3B1D33", shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  on: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FF5470", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 11 },
  off: { padding: 8 }, lab: { color: "#fff", fontSize: 12.5, fontFamily: "Inter_700Bold" },
});
