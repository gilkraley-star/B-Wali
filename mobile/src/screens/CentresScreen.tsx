import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FadeUp } from "../components/anim";

// Centres de santé de Bangui (liste indicative de la maquette). Les numéros et horaires restent « à confirmer »
// tant que l'équipe ne les a pas vérifiés avec chaque structure.
const CENTRES = [
  { nom: "Hôpital Général de Bangui", type: "Hôpital public · soins généraux" },
  { nom: "Hôpital Communautaire de Bangui", type: "Urgences · traumatologie" },
  { nom: "Hôpital de l'Amitié", type: "Hôpital public" },
  { nom: "Complexe Pédiatrique de Bangui", type: "Soins pour enfants et adolescentes" },
  { nom: "Centre Hospitalier Universitaire de Bangui", type: "Soins spécialisés, imagerie" },
];
export default function CentresScreen() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FFF6F0" }} contentContainerStyle={{ padding: 20 }}>
      <Text style={s.warn}>⚠️ Liste indicative. Les adresses, numéros et horaires doivent être vérifiés avec chaque structure avant le lancement.</Text>
      {CENTRES.map((c, i) => (
        <FadeUp key={c.nom} delay={60 + i * 60}>
          <View style={s.card}>
            <Text style={s.n}>{c.nom}</Text><Text style={s.t}>{c.type}</Text>
            <View style={s.row}>
              <TouchableOpacity style={s.btn} onPress={() => Linking.openURL("https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(c.nom + " Bangui"))}><Text style={s.btnT}>📍 Itinéraire</Text></TouchableOpacity>
              <View style={s.tel}><Text style={s.telT}>☎ à confirmer</Text></View>
            </View>
          </View>
        </FadeUp>))}
      <View style={s.help}><Text style={s.n}>Tu connais un centre qui accueille bien les filles ?</Text><Text style={s.t}>Signale-le à l'équipe : après vérification, il sera ajouté à cette liste pour les autres.</Text></View>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  warn: { fontSize: 12, color: "#7A5410", backgroundColor: "#FDF1DC", padding: 12, borderRadius: 14, lineHeight: 17 },
  card: { backgroundColor: "#fff", borderRadius: 22, padding: 16, marginTop: 12, shadowColor: "#3B1D33", shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  n: { fontFamily: "Inter_700Bold", fontSize: 15, color: "#3B1D33" }, t: { fontSize: 12.5, color: "#6E5C68", marginTop: 3, lineHeight: 17 },
  row: { flexDirection: "row", gap: 10, marginTop: 12 }, btn: { backgroundColor: "#FF5470", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 }, btnT: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 12.5 },
  tel: { backgroundColor: "#F3E4FF", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9 }, telT: { color: "#3B1D33", fontSize: 12.5, fontFamily: "Inter_600SemiBold" },
  help: { backgroundColor: "#E8F7E4", borderRadius: 22, padding: 16, marginTop: 16 },
});
