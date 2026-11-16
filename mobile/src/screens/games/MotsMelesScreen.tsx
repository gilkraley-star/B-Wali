import React, { useEffect, useMemo, useState } from "react";
import { play as snd } from "../../games/sounds";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing } from "../../theme/colors";
import { MmLang, MM_MAX_SERIES, buildPuzzle, matchSelection } from "../../games/motsMeles";
import { loadLocal, submitMotsMeles } from "../../games/gamesStore";

const PALETTE = ["#FF9AA8", "#8FDDA5", "#FFE17A", "#9CC4FF", "#D3B5FF", "#FFB98A", "#9BE3E0", "#F5A8E0"];
const TIERS = ["Débutante", "Confirmée", "Experte", "Championne"];

export default function MotsMelesScreen({ navigation }: any) {
  const [lang, setLang] = useState<MmLang>("fr");
  const [serie, setSerie] = useState(1);
  const [open, setOpen] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [sel, setSel] = useState<{ r: number; c: number } | null>(null);
  const [found, setFound] = useState<{ word: string; cells: [number, number][]; color: number }[]>([]);
  const [msg, setMsg] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => { navigation.setOptions({ title: "Mots mêlés 🔎" }); }, []);
  useEffect(() => { loadLocal().then((g) => { const o = g.open["mm-" + lang] || 1; setOpen(o); setSerie(Math.min(serie, o)); }); }, [lang]);

  const P = useMemo(() => buildPuzzle(serie, lang), [serie, lang]);
  const cell = Math.floor((Dimensions.get("window").width - 80) / P.size) - 3;
  const colorOf = new Map<string, number>();
  found.forEach((f) => f.cells.forEach(([r, c]) => colorOf.set(r + "," + c, f.color)));

  function start() { setFound([]); setSel(null); setDone(false); setMsg(lang === "en" ? "Touch the first letter of a word, then the last one." : "Touche la 1re lettre d'un mot, puis la dernière."); setPlaying(true); }
  async function tap(r: number, c: number) {
    if (!sel) { setSel({ r, c }); return; }
    if (sel.r === r && sel.c === c) { setSel(null); return; }
    const w = matchSelection(P, sel.r, sel.c, r, c);
    if (!w || found.some((f) => f.word === w.word)) {
      setSel(null); setMsg(lang === "en" ? "Not a word from the list. Try again!" : "Ce n'est pas un mot de la liste. Essaie encore !"); return;
    }
    const cells: [number, number][] = [];
    for (let k = 0; k < w.word.length; k++) cells.push([w.r + w.dr * k, w.c + w.dc * k]);
    const nf = [...found, { word: w.word, cells, color: found.length % PALETTE.length }];
    snd("found"); setFound(nf); setSel(null); setMsg("✅ " + w.emoji + " " + w.word + " : " + w.def);
    if (nf.length === P.words.length) { await submitMotsMeles(lang, serie, nf.map((x) => x.word)); setOpen(Math.max(open, serie + 1)); setDone(true); }
  }

  if (!playing) {
    const jumps = [1, 10, 50, 100, 250, 500, 1000];
    return (
      <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg }}>
        <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
          {(["fr", "en"] as MmLang[]).map((l) => (
            <TouchableOpacity key={l} onPress={() => setLang(l)} style={[s.lang, lang === l && { backgroundColor: colors.prune }]}>
              <Text style={[s.langText, lang === l && { color: "#fff" }]}>{l === "fr" ? "🇫🇷 Français" : "🇬🇧 English"}</Text></TouchableOpacity>))}
        </View>
        <View style={s.hero}><Text style={s.hl}>{lang === "en" ? "Series (English)" : "Série"}</Text>
          <Text style={s.hn}>{serie} <Text style={s.hs}>sur {MM_MAX_SERIES}</Text></Text>
          <View style={s.chip}><Text style={s.chipText}>{TIERS[P.tier]}</Text></View>
          <Text style={s.hl}>{P.words.length} mots à trouver · grille {P.size}×{P.size}</Text></View>
        <TouchableOpacity style={s.cta} onPress={start}><Text style={s.ctaText}>▶ Jouer la série {serie}</Text></TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
          <TouchableOpacity style={s.ghost} onPress={() => setSerie(Math.max(1, serie - 1))}><Text style={s.ghostText}>‹ Précédente</Text></TouchableOpacity>
          <TouchableOpacity style={s.ghost} onPress={() => serie < open && setSerie(serie + 1)}><Text style={s.ghostText}>Suivante ›</Text></TouchableOpacity>
        </View>
        <Text style={s.h}>Aller plus loin</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {jumps.map((n) => { const lock = n > open; return (
            <TouchableOpacity key={n} disabled={lock} onPress={() => setSerie(n)} style={[s.jump, lock && { backgroundColor: "#EEE6EC" }]}>
              <Text style={[s.jumpText, lock && { color: "#A596A0" }]}>{lock ? "🔒 " : ""}Série {n}</Text></TouchableOpacity>); })}
        </View>
        <Text style={s.note}>Dans chaque série, les mots viennent de plusieurs domaines mélangés. Plus tu avances, plus la grille est grande.</Text>
      </ScrollView>
    );
  }
  return (
    <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg, alignItems: "center" }}>
      <Text style={s.muted}>Série {serie} · {found.length} / {P.words.length}</Text>
      <View style={s.gridBox}>
        {P.grid.map((row, r) => (
          <View key={r} style={{ flexDirection: "row" }}>
            {row.map((ch, c) => {
              const col = colorOf.get(r + "," + c);
              const isSel = sel && sel.r === r && sel.c === c;
              return (
                <TouchableOpacity key={c} onPress={() => tap(r, c)} activeOpacity={0.7}
                  style={{ width: cell, height: cell, margin: 1.5, borderRadius: Math.max(7, cell / 4), alignItems: "center", justifyContent: "center",
                    backgroundColor: isSel ? "#FF5470" : col != null ? PALETTE[col] : "#F7EFF4" }}>
                  <Text style={{ fontWeight: "800", color: isSel ? "#fff" : colors.text, fontSize: cell * 0.46 }}>{ch}</Text>
                </TouchableOpacity>);
            })}
          </View>))}
      </View>
      <View style={s.msg}><Text style={{ color: colors.text, lineHeight: 19 }}>{msg}</Text></View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 7, justifyContent: "center" }}>
        {P.words.map((w) => { const f = found.find((x) => x.word === w.word); return (
          <View key={w.word} style={[s.word, { backgroundColor: f ? PALETTE[f.color] : "#fff" }]}>
            <Text style={{ fontWeight: "800", color: colors.text, textDecorationLine: f ? "line-through" : "none" }}>{f ? "✓ " : w.emoji + " "}{w.word}</Text></View>); })}
      </View>
      {done && (
        <View style={s.over}>
          <Text style={{ fontSize: 48 }}>🎉</Text><Text style={s.overT}>Série {serie} terminée !</Text><Text style={s.muted}>+20 ⭐ pour le classement</Text>
          <TouchableOpacity style={[s.cta, { alignSelf: "stretch" }]} onPress={() => { const n = Math.min(MM_MAX_SERIES, serie + 1); setSerie(n); setPlaying(false); }}><Text style={s.ctaText}>Série suivante</Text></TouchableOpacity>
        </View>)}
      {!done && <TouchableOpacity onPress={() => setPlaying(false)}><Text style={[s.muted, { marginTop: 14 }]}>‹ Retour au menu</Text></TouchableOpacity>}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  lang: { flex: 1, backgroundColor: "#fff", borderRadius: 999, padding: 12, alignItems: "center" }, langText: { fontWeight: "800", color: colors.text },
  hero: { backgroundColor: "#2FB872", borderRadius: 30, padding: 20 }, hl: { color: "#DDFBEA", fontWeight: "700", marginTop: 6 },
  hn: { color: "#fff", fontSize: 46, fontWeight: "800" }, hs: { fontSize: 18, color: "#DDFBEA" },
  chip: { alignSelf: "flex-start", backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 6 }, chipText: { fontWeight: "800", color: colors.text },
  cta: { backgroundColor: colors.rose, borderRadius: 999, padding: 16, alignItems: "center", marginTop: 14 }, ctaText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  ghost: { flex: 1, backgroundColor: "#fff", borderRadius: 20, padding: 13, alignItems: "center" }, ghostText: { fontWeight: "800", color: colors.text },
  h: { fontWeight: "800", fontSize: 15, color: colors.text, marginTop: 18, marginBottom: 8 },
  jump: { backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 }, jumpText: { fontWeight: "800", color: colors.text, fontSize: 13 },
  note: { color: colors.textMuted, marginTop: 12, fontSize: 12.5, lineHeight: 18 },
  muted: { color: colors.textMuted, marginBottom: 8 },
  gridBox: { backgroundColor: "#fff", borderRadius: 26, padding: 8, marginBottom: 12 },
  msg: { alignSelf: "stretch", backgroundColor: "#fff", borderRadius: 18, padding: 12, minHeight: 48, marginBottom: 12 },
  word: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  over: { alignSelf: "stretch", backgroundColor: "#fff", borderRadius: 28, padding: 20, alignItems: "center", marginTop: 16 }, overT: { fontSize: 22, fontWeight: "800", color: colors.text },
});
