import React, { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { WelcomeBurst } from "../components/Intro";
import { useFocusEffect } from "@react-navigation/native";
import { estimateLocal, getCycleLen, loadLocalPeriods } from "../storage/localCycle";
import { useTopPad } from "../theme/inset";
import { sendSos } from "../sos";
import { Alert, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import HomeCarousel from "../components/HomeCarousel";
import PendingNotice from "../components/PendingNotice";
import { FadeUp, Float, Pulse, Wiggle } from "../components/anim";

interface Estimate { nextEstimatedStart: string | null; disclaimer: string }

// Accueil : reproduit la maquette (en-tête, bandeau, conseillère, grille de 9 envies, invitation).
const TILES: { label: string; e: string; bg: string; go: string }[] = [
  { label: "Mon cycle", e: "🩸", bg: "#FFE0E6", go: "Cycle" },
  { label: "Je m'informe", e: "📚", bg: "#E3F0FF", go: "Library" },
  { label: "Entre Nous", e: "💬", bg: "#E8F7E4", go: "Forum" },
  { label: "Mon Carnet", e: "📒", bg: "#FFF1CC", go: "MonCarnet" },
  { label: "Jeunes mamans", e: "🤱", bg: "#F3E4FF", go: "JeunesMamans" },
  { label: "Formations", e: "🎓", bg: "#FFE6D2", go: "Formations" },
  { label: "Gagner de l'argent", e: "💼", bg: "#DDF5F0", go: "Revenus" },
  { label: "Centres de santé", e: "🏥", bg: "#FFE0E6", go: "Centres" },
  { label: "Jeux et divertissement", e: "🎮", bg: "#EBDDFF", go: "Games" },
];

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuth();
  const [estimate, setEstimate] = useState<Estimate | null>(null);
  useFocusEffect(useCallback(() => {
    (async () => {
      const local = estimateLocal(await loadLocalPeriods(), await getCycleLen());
      if (local.nextEstimatedStart) { setEstimate({ nextEstimatedStart: local.nextEstimatedStart, disclaimer: "" }); return; }
      apiRequest<Estimate>("/cycle/estimate", { silent: true }).then(setEstimate).catch(() => {});
    })();
  }, []));
  const [welcome, setWelcome] = useState<string | null>(null);
  useEffect(() => { (async () => { try { const w = await AsyncStorage.getItem("wali.welcome"); if (w) { await AsyncStorage.removeItem("wali.welcome"); setWelcome(w); } } catch {} })(); }, []);
  const isPro = ["PROFESSIONNELLE", "COACH", "FORMATRICE", "PARTENAIRE"].includes(user?.role || "");
  const topPad = useTopPad();
  const sosN = React.useRef(0); const sosT = React.useRef<any>(null);
  const sosPress = () => {
    sosN.current += 1; clearTimeout(sosT.current);
    if (sosN.current >= 3) { sosN.current = 0; sendSos(() => Alert.alert("SOS", "Choisis d'abord une personne de confiance dans Réglages, pour qu'elle reçoive ton alerte.", [{ text: "Plus tard" }, { text: "Choisir", onPress: () => navigation.navigate("Settings") }])); return; }
    sosT.current = setTimeout(() => { const c = sosN.current; sosN.current = 0; if (c === 1) navigation.navigate("Urgence"); }, 520);
  };
  const [gridH, setGridH] = useState(0);
  const rowH = Math.max(74, gridH / 3);
  const icoS = Math.max(30, Math.min(46, rowH * 0.46));

  return (
    <View style={s.screen}>
      <Float delay={0} style={[s.blob, { top: -70, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: "#FFD6DD", opacity: 0.7 }]} />
      <Float delay={2000} style={[s.blob, { top: 120, left: -80, width: 170, height: 170, borderRadius: 85, backgroundColor: "#FFE9A8", opacity: 0.55 }]} />
      <Float delay={4000} style={[s.blob, { top: 430, right: -70, width: 150, height: 150, borderRadius: 75, backgroundColor: "#E7D5FF", opacity: 0.5 }]} />


      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 14 }}>
        <PendingNotice />
        <FadeUp delay={30} style={s.head}>
          <View style={s.logo}><Image source={require("../../assets/logo-emblem.png")} style={{ width: 34, height: 34 }} resizeMode="contain" /></View>
          <View style={{ flex: 1 }}>
            <Text style={s.hello}>Salut ma belle 👋</Text>
            <Text style={s.name} numberOfLines={1}>{user?.pseudonyme} 💕</Text>
          </View>
          {isPro && <TouchableOpacity style={s.proMini} onPress={() => navigation.navigate("ProSpace")} accessibilityRole="button"><Text style={s.proMiniT}>{user?.role === "PARTENAIRE" ? "🤝" : "🩺"}</Text></TouchableOpacity>}
          {user?.role === "ADMIN" && <TouchableOpacity style={s.proMini} onPress={() => navigation.navigate("Admin")} accessibilityRole="button"><Text style={s.proMiniT}>🛠️</Text></TouchableOpacity>}
          <Pulse><TouchableOpacity style={s.sos} onPress={sosPress} accessibilityRole="button" accessibilityLabel="SOS urgence. Trois appuis rapides : alerter ma personne de confiance"><Text style={s.sosT}>SOS</Text></TouchableOpacity></Pulse>
        </FadeUp>

        <FadeUp delay={100} style={{ marginTop: 14 }}><HomeCarousel nextPeriod={estimate?.nextEstimatedStart} navigation={navigation} /></FadeUp>

        <FadeUp delay={170} style={{ marginTop: 14 }}>
          <TouchableOpacity style={s.advisor} onPress={() => navigation.navigate("Assistant")} accessibilityRole="button" activeOpacity={0.9}>
            <Wiggle style={s.spark}><Text style={{ fontSize: 25 }}>✨</Text></Wiggle>
            <View style={{ flex: 1 }}>
              <Text style={s.advT}>Pose-moi tes questions</Text>
              <Text style={s.advS}>Ta conseillère IA, en toute discrétion</Text>
            </View>
            <View style={s.chev}><Text style={{ color: "#fff", fontSize: 15 }}>›</Text></View>
          </TouchableOpacity>
        </FadeUp>

        <FadeUp delay={240}><Text style={s.q}>C'est quoi ton envie aujourd'hui ?</Text></FadeUp>
        <View style={{ flex: 1, minHeight: 0 }} onLayout={(e) => setGridH(e.nativeEvent.layout.height)}>
          {[0, 1, 2].map((r) => (
            <View key={r} style={[{ flexDirection: "row" }, gridH > 0 ? { height: Math.max(74, gridH / 3) } : { flex: 1 }]}>
              {TILES.slice(r * 3, r * 3 + 3).map((t, i) => (
                <FadeUp key={t.label} delay={300 + (r * 3 + i) * 50} style={{ flex: 1, padding: 5 }}>
                  <TouchableOpacity style={[s.tile, { backgroundColor: t.bg, flex: 1, justifyContent: "center", overflow: "hidden" }]} onPress={() => navigation.navigate(t.go)} activeOpacity={0.85} accessibilityRole="button">
                    <View style={[s.ico, { width: icoS, height: icoS, borderRadius: icoS / 2 }]}><Text style={{ fontSize: icoS * 0.52 }}>{t.e}</Text></View>
                    <Text style={[s.tileT, { marginTop: rowH < 90 ? 4 : 8 }]} numberOfLines={2}>{t.label}</Text>
                  </TouchableOpacity>
                </FadeUp>))}
            </View>))}
        </View>
      </View>
      {welcome ? <WelcomeBurst name={welcome} onDone={() => setWelcome(null)} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFF6F0", overflow: "hidden" },
  blob: { position: "absolute" },
  sosWrap: { position: "absolute", top: 20, right: 18, zIndex: 5 },
  sos: { backgroundColor: "#FF4D5E", paddingVertical: 9, paddingHorizontal: 15, borderRadius: 999, shadowColor: "#FF4D5E", shadowOpacity: 0.4, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  sosT: { color: "#fff", fontFamily: "Inter_700Bold", fontWeight: "800", fontSize: 12, letterSpacing: 0.5 },
  head: { flexDirection: "row", alignItems: "center", gap: 10 },
  proMini: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#3B1D33", shadowOpacity: 0.1, shadowRadius: 6, elevation: 2 }, proMiniT: { fontSize: 19 },
  logo: { width: 50, height: 50, borderRadius: 25, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#3B1D33", shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  hello: { color: "#FF5470", fontSize: 13, fontFamily: "Inter_700Bold" },
  name: { fontFamily: "Poppins_800ExtraBold", fontSize: 23, color: "#3B1D33", lineHeight: 28 },
  advisor: { backgroundColor: "#FFD84D", borderRadius: 24, paddingVertical: 14, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", gap: 13, shadowColor: "#FFC828", shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  spark: { width: 46, height: 46, borderRadius: 16, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  advT: { fontSize: 15, fontFamily: "Poppins_800ExtraBold", color: "#3B1D33" }, advS: { fontSize: 12, color: "#5E4A2A", marginTop: 1, fontFamily: "Inter_400Regular" },
  chev: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#3B1D33", alignItems: "center", justifyContent: "center" },
  q: { fontFamily: "Poppins_700Bold", fontSize: 15, color: "#3B1D33", marginTop: 12, marginBottom: 2, marginLeft: 2 },
  grid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -5 },
  cell: { width: "33.333%", padding: 5 },
  tile: { borderRadius: 22, paddingHorizontal: 3, alignItems: "center" },
  ico: { width: 46, height: 46, borderRadius: 23, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#3B1D33", shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  tileT: { fontSize: 11.5, fontFamily: "Inter_700Bold", color: "#3B1D33", textAlign: "center", marginTop: 8, lineHeight: 15 },
  invite: { backgroundColor: "#C9F0DC", borderRadius: 999, paddingVertical: 13, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 4 },
  inviteT: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#1E5B3E" },
  pro: { flex: 1, backgroundColor: "#fff", borderRadius: 999, paddingVertical: 11, alignItems: "center" }, proT: { fontFamily: "Inter_700Bold", color: "#3B1D33", fontSize: 13 },
});
