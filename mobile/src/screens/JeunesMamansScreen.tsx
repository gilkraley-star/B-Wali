import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { FadeUp } from "../components/anim";

// « Jeunes mamans » : un espace d'accompagnement qui réunit les parties utiles de l'appli (maquette JeunesMeres).
const ITEMS: { e: string; t: string; s: string; bg: string; go: () => any }[] = [];
export default function JeunesMamansScreen({ navigation }: any) {
  const items = [
    { e: "🎓", t: "Reprendre mes études ou me former", s: "Formations suivies depuis le téléphone, avec attestation", bg: "#FFE6D2", go: () => navigation.navigate("Formations") },
    { e: "🍼", t: "Allaitement et soins du nouveau-né", s: "Fiches simples à lire", bg: "#E3F0FF", go: () => navigation.navigate("Main", { screen: "Library" }) },
    { e: "💛", t: "Parler à une psychologue", s: "En privé, sans honte ni culpabilité", bg: "#FFF1CC", go: () => navigation.navigate("Professionnelles") },
    { e: "💰", t: "Gagner un revenu", s: "Des idées d'activités accessibles pour démarrer", bg: "#DDF5F0", go: () => navigation.navigate("Revenus") },
    { e: "💬", t: "Rejoindre l'espace d'échange", s: "Anonyme si tu veux, modéré, entre jeunes mamans", bg: "#E8F7E4", go: () => navigation.navigate("Main", { screen: "Forum" }) },
    { e: "📒", t: "Mes carnets de maman", s: "Visites prénatales, vaccins, croissance de bébé", bg: "#F3E4FF", go: () => navigation.navigate("MonCarnet") },
  ];
  void ITEMS;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#FFF6F0" }} contentContainerStyle={{ padding: 20 }}>
      <FadeUp delay={20}>
        <Text style={s.h}>Tu n'es pas seule 🤱</Text>
        <Text style={s.p}>Devenir maman jeune ne met pas fin à tes projets. Cet espace est là pour t'accompagner, sans jugement.</Text>
      </FadeUp>
      {items.map((it, i) => (
        <FadeUp key={it.t} delay={100 + i * 60}>
          <TouchableOpacity style={[s.card, { backgroundColor: it.bg }]} onPress={it.go} activeOpacity={0.85}>
            <View style={s.ico}><Text style={{ fontSize: 24 }}>{it.e}</Text></View>
            <View style={{ flex: 1 }}><Text style={s.t}>{it.t}</Text><Text style={s.sub}>{it.s}</Text></View>
            <Text style={{ fontSize: 20, color: "#3B1D33" }}>›</Text>
          </TouchableOpacity>
        </FadeUp>))}
      <Text style={s.priv}>🔒 Ton statut de jeune maman reste privé : rien ne l'indique dans ton profil ni ailleurs dans l'application.</Text>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  h: { fontFamily: "Poppins_800ExtraBold", fontSize: 24, color: "#3B1D33" }, p: { color: "#5E4A2A", lineHeight: 21, marginTop: 6, marginBottom: 10, fontFamily: "Inter_400Regular" },
  card: { flexDirection: "row", alignItems: "center", gap: 13, borderRadius: 22, padding: 14, marginTop: 10 },
  ico: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  t: { fontFamily: "Inter_700Bold", fontSize: 14, color: "#3B1D33" }, sub: { fontSize: 12, color: "#5E4A2A", marginTop: 2, lineHeight: 16, fontFamily: "Inter_400Regular" },
  priv: { fontSize: 12, color: "#6E5C68", marginTop: 18, lineHeight: 17, textAlign: "center" },
});
