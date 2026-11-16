import React, { useEffect, useRef, useState } from "react";
import { play as snd } from "../../games/sounds";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing } from "../../theme/colors";
import { GameState, applyMove, botMove, newGame, simulate } from "../../games/awale";
import { submitBotGame } from "../../games/gamesStore";

const SEEDS = ["#FF5470", "#FFD84D", "#2FB872", "#4C8DFF", "#C16BFF"];
// Ordre d'affichage : rangée du haut = trous 11→6 (le téléphone), rangée du bas = trous 0→5 (toi)
const TOP = [11, 10, 9, 8, 7, 6];
const BOTTOM = [0, 1, 2, 3, 4, 5];

export default function AwaleScreen({ navigation }: any) {
  const [step, setStep] = useState<"menu" | "game">("menu");
  const [g, setG] = useState<GameState>(newGame());
  const [busy, setBusy] = useState(false);
  const [last, setLast] = useState(-1);
  const [msg, setMsg] = useState("");
  const [stars, setStars] = useState(0);
  const timers = useRef<any[]>([]);
  useEffect(() => { navigation.setOptions({ title: "Awalé 🌰" }); return () => timers.current.forEach(clearTimeout); }, []);
  const after = (ms: number, fn: () => void) => { timers.current.push(setTimeout(fn, ms)); };

  function begin() { timers.current.forEach(clearTimeout); setG(newGame()); setBusy(false); setLast(-1); setMsg(""); setStars(0); setStep("game"); }

  function play(i: number, state: GameState) {
    const r = simulate(state.pits, i);
    setBusy(true);
    r.frames.forEach((fr, k) => after(230 * (k + 1), () => { snd("seed"); setG((cur) => ({ ...cur, pits: fr.pits })); setLast(fr.idx); }));
    after(230 * (r.frames.length + 1) + 150, () => {
      const { state: ns, captured } = applyMove(state, i);
      setG(ns); setBusy(false);
      if (captured) snd("capture");
      const mover = i < 6 ? 0 : 1;
      setLast(captured ? -1 : r.lastIdx);
      setMsg(captured ? (mover === 0 ? `Bravo ! +${captured} 🌰` : `Elle gagne ${captured} 🌰`) : "");
      if (ns.over) {
        const win = ns.score[0] > ns.score[1];
        after(500, () => snd(win ? "win" : "lose"));
        submitBotGame("awale", win ? "win" : "loss").then(setStars);
      } else if (ns.turn === 1) after(800, () => { const b = botMove(ns.pits); if (b >= 0) play(b, ns); });
    });
  }

  if (step === "menu") {
    return (
      <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={s.h}>Comment jouer ?</Text>
        {[["👆", "Touche un trou", "Choisis un trou de ton côté (en bas) qui a des graines."], ["🔄", "Les graines tournent", "Elles se posent une par une dans les trous suivants, en tournant."], ["🏆", "Gagne des graines", "Si la dernière tombe chez l'autre sur 2 ou 3 graines, tu les prends ! Le premier à 25 graines gagne."]].map((x) => (
          <View key={x[1]} style={s.how}><Text style={{ fontSize: 26 }}>{x[0]}</Text><View style={{ flex: 1 }}><Text style={s.howT}>{x[1]}</Text><Text style={s.howX}>{x[2]}</Text></View></View>))}
        <TouchableOpacity style={s.cta} onPress={begin}><Text style={s.ctaText}>🤖 Jouer contre le téléphone</Text></TouchableOpacity>
        <Text style={s.note}>📴 Sans internet. Le jeu à deux filles en ligne arrivera plus tard.</Text>
      </ScrollView>
    );
  }
  const myTurn = g.turn === 0 && !g.over && !busy;
  const pit = (i: number) => {
    const can = i < 6 && myTurn && g.pits[i] > 0;
    return (
      <TouchableOpacity key={i} disabled={!can} onPress={() => play(i, g)} style={[s.pit, i === last && { borderColor: "#FFD84D" }, can && { borderColor: "#fff" }]}>
        <View style={s.seedRow}>{Array.from({ length: Math.min(g.pits[i], 12) }).map((_, k) => <View key={k} style={[s.seed, { backgroundColor: SEEDS[(k + i) % SEEDS.length] }]} />)}</View>
        <Text style={s.count}>{g.pits[i]}</Text>
      </TouchableOpacity>
    );
  };
  const win = g.score[0] > g.score[1];
  return (
    <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={s.score}><Text style={s.scoreT}>🤖 Le téléphone : {g.score[1]}</Text><Text style={s.scoreT}>Toi : {g.score[0]}</Text></View>
      <View style={s.board}>
        <View style={s.row}>{TOP.map(pit)}</View>
        <View style={s.row}>{BOTTOM.map(pit)}</View>
      </View>
      <Text style={s.hint}>{msg || (g.over ? "Terminé" : myTurn ? "À toi !" : "Il réfléchit…")}</Text>
      {g.over && (
        <View style={s.over}>
          <Text style={{ fontSize: 48 }}>{win ? "🏆" : "💪"}</Text>
          <Text style={s.overT}>{win ? "Bravo, tu as gagné !" : g.score[0] === g.score[1] ? "Égalité !" : "Le téléphone gagne… cette fois"}</Text>
          <Text style={s.note}>+{stars} ⭐ pour le classement</Text>
          <TouchableOpacity style={[s.cta, { alignSelf: "stretch" }]} onPress={begin}><Text style={s.ctaText}>Rejouer</Text></TouchableOpacity>
        </View>)}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  h: { fontWeight: "800", fontSize: 18, color: colors.text, marginBottom: 10 },
  how: { flexDirection: "row", gap: 12, backgroundColor: "#fff", borderRadius: 20, padding: 14, marginBottom: 10, alignItems: "center" },
  howT: { fontWeight: "800", color: colors.text }, howX: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  cta: { backgroundColor: colors.rose, borderRadius: 999, padding: 16, alignItems: "center", marginTop: 10 }, ctaText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  note: { color: colors.textMuted, marginTop: 8, textAlign: "center", fontSize: 12.5 },
  score: { flexDirection: "row", justifyContent: "space-between", marginBottom: 10 }, scoreT: { fontWeight: "800", color: colors.text },
  board: { backgroundColor: "#8B4A1B", borderRadius: 28, padding: 8, gap: 8, borderWidth: 4, borderColor: "#5E3010" },
  row: { flexDirection: "row", justifyContent: "space-between", gap: 4 },
  pit: { flex: 1, aspectRatio: 0.78, borderRadius: 30, backgroundColor: "#3B1D0A", borderWidth: 3, borderColor: "#5E3010", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  seedRow: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", paddingHorizontal: 2, gap: 1, flex: 1 },
  seed: { width: 8, height: 8, borderRadius: 4, margin: 0.5 },
  count: { color: "#FFE9A8", fontWeight: "800", fontSize: 12 },
  hint: { textAlign: "center", marginTop: 12, fontWeight: "700", color: colors.text },
  over: { backgroundColor: "#fff", borderRadius: 28, padding: 20, alignItems: "center", marginTop: 16 }, overT: { fontSize: 20, fontWeight: "800", color: colors.text },
});
