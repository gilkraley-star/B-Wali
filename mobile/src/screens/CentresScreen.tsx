import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FadeUp } from "../components/anim";
import { useAuth } from "../context/AuthContext";
import { getCountry } from "../config/countries";

// Centres de santé selon le pays de la fille (liste indicative ; numéros et horaires « à confirmer »).
export default function CentresScreen() {
  const { user } = useAuth();
  const country = getCountry(user?.country);
  const CENTRES = country.centres;
  if (!CENTRES.length) return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FFF6F0" }} contentContainerStyle={{ padding: 20 }}>
      <View style={s.help}><Text style={s.n}>Bientôt pour {country.name} {country.flag}</Text><Text style={s.t}>La liste des centres de santé de ton pays est en préparation avec des professionnelles locales. En attendant, tu peux écrire à une de nos professionnelles depuis l'accueil.</Text></View>
    </ScrollView>
  );
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FFF6F0" }} contentContainerStyle={{ padding: 20 }}>
      {CENTRES.map((c, i) => (
        <FadeUp key={c.nom} delay={60 + i * 60}>
          <View style={s.card}>
            <Text style={s.n}>{c.nom}</Text><Text style={s.t}>{c.type}</Text>{c.quartier ? <Text style={s.t}>📍 {c.quartier}, {c.ville}</Text> : null}
            <View style={s.row}>
              <TouchableOpacity style={s.btn} onPress={() => Linking.openURL(c.lat && c.lng ? `https://www.google.com/maps/dir/?api=1&destination=${c.lat},${c.lng}` : "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(c.nom + " " + c.ville))}><Text style={s.btnT}>📍 Itinéraire</Text></TouchableOpacity>
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
