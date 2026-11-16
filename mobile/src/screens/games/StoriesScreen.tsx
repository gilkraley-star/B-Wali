import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiRequest } from "../../api/client";
import { colors, spacing } from "../../theme/colors";

interface Story { slug: string; title: string; summary: string; category: string; icon: string; readMin: number; credit: string; license?: string | null }
interface Detail extends Story { chapters: { position: number; title: string; body: string }[]; sourceUrl?: string | null }
const CATS: [string, string][] = [["", "Toutes"], ["HEROINE", "Héroïnes"], ["CONTE", "Contes"], ["EDUCATION", "Éducation"], ["ICI", "D'ici"], ["AMOUR", "Amour 18+"]];

export default function StoriesScreen({ navigation }: any) {
  const [cat, setCat] = useState("");
  const [list, setList] = useState<Story[] | null>(null);
  const [open, setOpen] = useState<Detail | null>(null);
  const [ch, setCh] = useState(0);
  const [offline, setOffline] = useState(false);
  useEffect(() => { navigation.setOptions({ title: "Histoires 📖" }); }, []);
  useEffect(() => {
    setList(null); setOffline(false);
    apiRequest<Story[]>("/stories" + (cat ? "?category=" + cat : ""), { silent: true }).then(setList).catch(() => { setOffline(true); setList([]); });
  }, [cat]);
  async function read(slug: string) { try { const d = await apiRequest<Detail>("/stories/" + slug); setOpen(d); setCh(0); } catch {} }

  if (open) {
    const c = open.chapters[ch];
    return (
      <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg }}>
        <TouchableOpacity onPress={() => setOpen(null)}><Text style={s.back}>‹ Retour aux histoires</Text></TouchableOpacity>
        <Text style={s.title}>{open.icon} {open.title}</Text>
        <Text style={s.credit}>{open.credit}{open.license ? " · Licence " + open.license : ""}</Text>
        {open.chapters.length > 1 && <Text style={s.mut}>{c.title} · {ch + 1} sur {open.chapters.length}</Text>}
        <Text style={s.body}>{c?.body}</Text>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
          {ch > 0 && <TouchableOpacity style={s.ghost} onPress={() => setCh(ch - 1)}><Text style={s.ghostT}>‹ Avant</Text></TouchableOpacity>}
          {ch < open.chapters.length - 1 && <TouchableOpacity style={s.cta} onPress={() => setCh(ch + 1)}><Text style={s.ctaT}>Suite ›</Text></TouchableOpacity>}
        </View>
      </ScrollView>
    );
  }
  return (
    <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {CATS.map(([k, l]) => (<TouchableOpacity key={k} onPress={() => setCat(k)} style={[s.chip, cat === k && { backgroundColor: "#8E5CFF" }]}><Text style={[s.chipT, cat === k && { color: "#fff" }]}>{l}</Text></TouchableOpacity>))}
      </ScrollView>
      {offline && <Text style={s.mut}>📴 Connecte-toi à internet pour lire les histoires.</Text>}
      {list && !offline && list.length === 0 && <Text style={s.mut}>Pas encore d'histoire ici. Les histoires sont publiées après relecture.</Text>}
      {list?.map((b) => (
        <TouchableOpacity key={b.slug} style={s.card} onPress={() => read(b.slug)}>
          <View style={s.cover}><Text style={{ fontSize: 34 }}>{b.icon}</Text></View>
          <View style={{ flex: 1 }}><Text style={s.t}>{b.title}</Text><Text style={s.mut} numberOfLines={2}>{b.summary}</Text><Text style={s.meta}>{b.readMin} min · {b.credit.split(" · ")[0]}</Text></View>
        </TouchableOpacity>))}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  chip: { backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9, marginRight: 8 }, chipT: { fontWeight: "800", color: colors.text, fontSize: 13 },
  card: { flexDirection: "row", gap: 14, backgroundColor: "#fff", borderRadius: 24, padding: 12, marginBottom: 12 },
  cover: { width: 70, height: 96, borderRadius: 14, backgroundColor: "#F3E4FF", alignItems: "center", justifyContent: "center" },
  t: { fontWeight: "800", color: colors.text, fontSize: 15 }, mut: { color: colors.textMuted, fontSize: 12.5, lineHeight: 18, marginTop: 2 }, meta: { color: colors.textMuted, fontSize: 11, marginTop: 4, fontWeight: "600" },
  back: { color: colors.rose, fontWeight: "800", marginBottom: 12 }, title: { fontSize: 22, fontWeight: "800", color: colors.text }, credit: { color: colors.textMuted, fontSize: 11.5, marginTop: 4, marginBottom: 10 },
  body: { fontSize: 16.5, lineHeight: 26, color: colors.text, marginTop: 8 },
  cta: { flex: 1, backgroundColor: colors.rose, borderRadius: 999, padding: 14, alignItems: "center" }, ctaT: { color: "#fff", fontWeight: "800" },
  ghost: { flex: 1, backgroundColor: "#fff", borderRadius: 999, padding: 14, alignItems: "center" }, ghostT: { fontWeight: "800", color: colors.text },
});
