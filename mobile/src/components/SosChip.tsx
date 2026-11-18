import React, { useRef } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useTopPad } from "../theme/inset";
import { sendSos } from "../sos";

// Pastille SOS (maquette) : un appui ouvre l'écran Urgence ; 3 appuis rapides ouvrent le SMS d'alerte avec la position.
export default function SosChip({ navigation }: { navigation: any }) {
  const n = useRef(0); const tm = useRef<any>(null);
  const top = 20 + useTopPad();
  const press = () => {
    n.current += 1; clearTimeout(tm.current);
    if (n.current >= 3) { n.current = 0; sendSos(() => Alert.alert("SOS", "Choisis d'abord une personne de confiance dans Réglages, pour qu'elle reçoive ton alerte.", [{ text: "Plus tard" }, { text: "Choisir", onPress: () => navigation.navigate("Main", { screen: "Settings" }) }])); return; }
    tm.current = setTimeout(() => { const c = n.current; n.current = 0; if (c === 1) navigation.navigate("Urgence"); }, 520);
  };
  return (
    <TouchableOpacity style={[s.chip, { top }]} onPress={press} activeOpacity={0.8} accessibilityRole="button" accessibilityLabel="SOS urgence. Trois appuis rapides : alerter ma personne de confiance">
      <Text style={s.t}>SOS</Text>
    </TouchableOpacity>
  );
}
const s = StyleSheet.create({
  chip: { position: "absolute", top: 20, right: 18, zIndex: 10, backgroundColor: "#C23B3B", borderRadius: 999, paddingVertical: 8, paddingHorizontal: 15, shadowColor: "#C23B3B", shadowOpacity: 0.35, shadowRadius: 8, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  t: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12, letterSpacing: 0.5 },
});
