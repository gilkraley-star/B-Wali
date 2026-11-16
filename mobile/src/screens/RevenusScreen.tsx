import React, { useCallback, useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { apiRequest, ApiError } from "../api/client";
import { Source, SourcesBlock } from "../components/Sources";
import { FadeUp } from "../components/anim";

// Gagner un revenu (maquette) : idées d'activités avec capital de départ, « Il te faut », étapes et précautions.
interface Activity { id: string; title: string; icon: string; capitalMinFcfa: number; summary: string; needsMd: string; stepsMd: string; risksMd: string; sources: Source[] }

const FILTERS = [
  { id: "all", label: "Tout" },
  { id: "zero", label: "Sans argent" },
  { id: "low", label: "Moins de 25 000" },
  { id: "high", label: "25 000 et +" },
];
const TINTS = ["#FFE8D6", "#DDF5F0", "#EBDDFF", "#FFE3E8", "#FFF3C4", "#DCEBFF"];

function fcfa(n: number) { return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " "); }
function pill(n: number) { return n === 0 ? { t: "sans argent", bg: "#DDF5E4", fg: "#1E6B3E" } : n < 25000 ? { t: `dès ${fcfa(n)} F`, bg: "#E6F4EC", fg: "#1E6B3E" } : { t: `dès ${fcfa(n)} F`, bg: "#FCEFD0", fg: "#8A5A00" }; }

// Affiche un texte à puces / étapes numérotées en lignes lisibles.
function Lines({ text }: { text: string }) {
  return <View>{text.split("\n").map((raw, i) => {
    const l = raw.trim(); if (!l) return <View key={i} style={{ height: 6 }} />;
    const head = /^[A-ZÀ-Ý0-9 '’()\-]{4,}\s*:/.test(l);
    const num = l.match(/^(\d+)[.)]\s*(.*)$/); const bullet = l.match(/^[•\-]\s*(.*)$/);
    if (head) return <Text key={i} style={s.sub}>{l}</Text>;
    if (num) return <View key={i} style={s.row}><View style={s.num}><Text style={s.numT}>{num[1]}</Text></View><Text style={s.body}>{num[2]}</Text></View>;
    if (bullet) return <View key={i} style={s.row}><Text style={s.dot}>•</Text><Text style={s.body}>{bullet[1]}</Text></View>;
    return <Text key={i} style={s.body}>{l}</Text>;
  })}</View>;
}

export default function RevenusScreen({ navigation }: any) {
  const [list, setList] = useState<Activity[] | null>(null);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    apiRequest<Activity[]>("/catalog/income").then((l) => { setList(l); setError(null); }).catch((e) => { setError(e instanceof ApiError ? e.message : "Erreur de chargement."); setList((x) => x || []); });
  }, []));

  const shown = useMemo(() => (list || []).filter((a) => (filter === "zero" ? a.capitalMinFcfa === 0 : filter === "low" ? a.capitalMinFcfa < 25000 : filter === "high" ? a.capitalMinFcfa >= 25000 : true)), [list, filter]);

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF6F0" }}>
      <View style={s.head}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}><Text style={{ fontSize: 28, color: "#3B1D33" }}>‹</Text></TouchableOpacity>
          <View><Text style={s.h1}>Gagner un revenu</Text><Text style={s.hSub}>Commencer petit, avec ce que tu as</Text></View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          {FILTERS.map((f) => (
            <TouchableOpacity key={f.id} onPress={() => setFilter(f.id)} style={[s.chip, filter === f.id && s.chipOn]}>
              <Text style={[s.chipT, filter === f.id && { color: "#fff" }]}>{f.label}</Text>
            </TouchableOpacity>))}
        </ScrollView>
      </View>
      <ScrollView contentContainerStyle={{ padding: 18, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <View style={s.tip}><Text style={s.tipT}>💡 Pour chaque activité, voici le <Text style={{ fontFamily: "Inter_700Bold" }}>capital de départ</Text> qu'il faut réunir. Ce sont des ordres de grandeur : vérifie les prix sur ton marché.</Text></View>
        {error ? <Text style={{ color: "#C23B3B", marginBottom: 8 }}>{error}</Text> : null}
        {list && !error && shown.length === 0 ? <Text style={s.empty}>Pas encore d'idées dans cette catégorie. Elles sont publiées après relecture par l'équipe.</Text> : null}
        {shown.map((a, i) => {
          const p = pill(a.capitalMinFcfa); const isOpen = open === a.id;
          const needs = a.needsMd.split("\n").map((x) => x.replace(/^[•\-]\s*/, "").trim()).filter(Boolean).slice(0, 2).join(" · ");
          return (
            <FadeUp key={a.id} delay={Math.min(i, 6) * 60}>
              <View style={s.card}>
                <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(isOpen ? null : a.id)}>
                  <View style={{ flexDirection: "row", gap: 12 }}>
                    <View style={[s.ico, { backgroundColor: TINTS[i % TINTS.length] }]}><Text style={{ fontSize: 26 }}>{a.icon}</Text></View>
                    <View style={{ flex: 1 }}>
                      <View style={s.top}><Text style={s.t} numberOfLines={3}>{a.title}</Text><View style={[s.pill, { backgroundColor: p.bg }]}><Text style={[s.pillT, { color: p.fg }]}>{p.t}</Text></View></View>
                      <Text style={s.sum}>{a.summary}</Text>
                    </View>
                  </View>
                  {needs ? <Text style={s.need}><Text style={{ fontFamily: "Inter_700Bold" }}>Il te faut : </Text>{needs}</Text> : null}
                  <Text style={s.more}>{isOpen ? "Réduire ▲" : "Voir comment démarrer ▼"}</Text>
                </TouchableOpacity>
                {isOpen ? (
                  <View style={{ marginTop: 6 }}>
                    <View style={[s.sec, { backgroundColor: "#FFF3C4" }]}><Text style={s.secT}>🧰 Il te faut</Text><Lines text={a.needsMd} /></View>
                    <View style={[s.sec, { backgroundColor: "#E6F4EC" }]}><Text style={s.secT}>🚀 Comment démarrer</Text><Lines text={a.stepsMd} /></View>
                    <View style={[s.sec, { backgroundColor: "#FFE3E8" }]}><Text style={s.secT}>⚠️ Précautions</Text><Lines text={a.risksMd} /></View>
                    <SourcesBlock sources={a.sources} />
                  </View>) : null}
              </View>
            </FadeUp>);
        })}
        <TouchableOpacity activeOpacity={0.9} onPress={() => navigation.navigate("Formations")}>
          <LinearGradient colors={["#FF5470", "#FF8A5B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.cta}><Text style={s.ctaT}>🎓 Voir la formation « Créer sa petite entreprise »</Text></LinearGradient>
        </TouchableOpacity>
        <TouchableOpacity style={s.ghost} onPress={() => navigation.navigate("Forum")}><Text style={s.ghostT}>💬 En discuter dans la communauté</Text></TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  head: { backgroundColor: "#fff", paddingHorizontal: 20, paddingTop: 14, paddingBottom: 12, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, shadowColor: "#3B1D33", shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  h1: { fontFamily: "Poppins_800ExtraBold", fontSize: 22, color: "#3B1D33" }, hSub: { color: "#8C7A86", marginTop: 2, fontFamily: "Inter_400Regular" },
  chip: { backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#F3DEE1", borderRadius: 999, paddingHorizontal: 16, paddingVertical: 9, marginRight: 8 }, chipOn: { backgroundColor: "#3B1D33", borderColor: "#3B1D33" }, chipT: { color: "#3B1D33", fontFamily: "Inter_600SemiBold", fontSize: 13 },
  tip: { backgroundColor: "#FFE9DE", borderRadius: 20, padding: 14, marginBottom: 12 }, tipT: { color: "#3B1D33", lineHeight: 20, fontSize: 13.5, fontFamily: "Inter_400Regular" },
  empty: { color: "#8C7A86", textAlign: "center", marginVertical: 20, lineHeight: 20 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 16, marginBottom: 12, shadowColor: "#3B1D33", shadowOpacity: 0.06, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  ico: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  top: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  t: { flex: 1, fontFamily: "Poppins_700Bold", fontSize: 15.5, color: "#3B1D33", lineHeight: 21 },
  pill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 }, pillT: { fontFamily: "Inter_700Bold", fontSize: 11.5 },
  sum: { color: "#6E5C68", marginTop: 3, lineHeight: 19, fontSize: 13.5, fontFamily: "Inter_400Regular" },
  need: { color: "#3B1D33", marginTop: 10, lineHeight: 19, fontSize: 13.5, fontFamily: "Inter_400Regular" },
  more: { color: "#FF5470", marginTop: 10, fontFamily: "Inter_700Bold", fontSize: 12.5 },
  sec: { borderRadius: 18, padding: 14, marginTop: 10 }, secT: { fontFamily: "Poppins_700Bold", fontSize: 14, color: "#3B1D33", marginBottom: 8 },
  sub: { fontFamily: "Inter_700Bold", color: "#3B1D33", marginTop: 8, marginBottom: 4, fontSize: 13 },
  row: { flexDirection: "row", gap: 8, marginBottom: 6, alignItems: "flex-start" }, dot: { color: "#3B1D33", lineHeight: 20 },
  num: { width: 20, height: 20, borderRadius: 10, backgroundColor: "#3B1D33", alignItems: "center", justifyContent: "center", marginTop: 1 }, numT: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  body: { flex: 1, color: "#3B1D33", lineHeight: 20, fontSize: 13.5, fontFamily: "Inter_400Regular" },
  cta: { borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 8, shadowColor: "#FF5470", shadowOpacity: 0.3, shadowRadius: 10, shadowOffset: { width: 0, height: 6 }, elevation: 4 }, ctaT: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
  ghost: { borderRadius: 999, paddingVertical: 15, alignItems: "center", marginTop: 10, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#F3C9CF" }, ghostT: { color: "#3B1D33", fontFamily: "Inter_700Bold", fontSize: 14 },
});
