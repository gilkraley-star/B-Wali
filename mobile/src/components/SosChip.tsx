import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { useTopPad } from "../theme/inset";

// Petite pastille SOS en haut à droite (maquette) : un appui ouvre l'écran Urgence.
export default function SosChip({ navigation }: { navigation: any }) {
  return (
    <TouchableOpacity style={[s.chip, { top: 20 + useTopPad() }]} onPress={() => navigation.navigate("Urgence")} accessibilityRole="button" accessibilityLabel="SOS urgence">
      <Text style={s.t}>SOS</Text>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  chip: { position: "absolute", top: 20, right: 18, zIndex: 10, backgroundColor: "#C23B3B", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 15, shadowColor: "#C23B3B", shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  t: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 0.5 },
});
