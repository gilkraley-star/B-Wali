import React, { useEffect, useRef, useState } from "react";
import { play as snd } from "../../games/sounds";
import { Animated, Easing, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, spacing } from "../../theme/colors";
import { COLORS, Color, HEX, LIGHT, Positions, SAFE, TRACK, applyMove, botChoose, coord, emptyPositions, movable } from "../../games/ludo";
import { submitBotGame } from "../../games/gamesStore";

const STYLES = [["♟️", "Classique"], ["👧", "Fille"], ["👑", "Couronne"], ["🌸", "Fleur"]];
const NAMES: Record<Color, string> = { Y: "Toi", G: "Grâce_B", R: "Nadia_22", B: "Fleur_de_lune" };
const PIPS: Record<number, number[]> = { 1: [4], 2: [0, 8], 3: [0, 4, 8], 4: [0, 2, 6, 8], 5: [0, 2, 4, 6, 8], 6: [0, 2, 3, 5, 6, 8] };
// Dé réel : faces à points, il roule et rebondit pendant le lancer.
function Die({ value, rolling, size = 70 }: { value: number; rolling: boolean; size?: number }) {
  const rot = useRef(new Animated.Value(0)).current;
  const hop = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (rolling) {
      rot.setValue(0); hop.setValue(0);
      Animated.parallel([
        Animated.timing(rot, { toValue: 1, duration: 800, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.sequence([Animated.timing(hop, { toValue: 1, duration: 260, useNativeDriver: true }), Animated.timing(hop, { toValue: 0.4, duration: 220, useNativeDriver: true }), Animated.timing(hop, { toValue: 0, duration: 320, useNativeDriver: true })]),
      ]).start();
    }
  }, [rolling]);
  const pips = PIPS[value] || [];
  return (
    <Animated.View style={{ width: size, height: size, borderRadius: size * 0.22, backgroundColor: "#fff", padding: size * 0.12, flexDirection: "row", flexWrap: "wrap", elevation: 6, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 6, shadowOffset: { width: 0, height: 4 },
      transform: [{ rotate: rot.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "720deg"] }) }, { translateY: hop.interpolate({ inputRange: [0, 1], outputRange: [0, -26] }) }, { scale: hop.interpolate({ inputRange: [0, 1], outputRange: [1, 1.18] }) }] }}>
      {value === 0 ? <Text style={{ flex: 1, textAlign: "center", fontSize: size * 0.5, alignSelf: "center" }}>🎲</Text> : Array.from({ length: 9 }).map((_, i) => (
        <View key={i} style={{ width: "33.33%", height: "33.33%", alignItems: "center", justifyContent: "center" }}>{pips.includes(i) ? <View style={{ width: size * 0.17, height: size * 0.17, borderRadius: size, backgroundColor: value === 6 || value === 1 ? "#E5252A" : "#2B1730" }} /> : null}</View>))}
    </Animated.View>
  );
}
const REACTS = ["😀", "👏", "😢", "😡", "🔥"];

export default function LudoScreen({ navigation }: any) {
  const [players, setPlayers] = useState<2 | 4 | null>(null);
  const [style, setStyle] = useState(1);
  const [seats, setSeats] = useState<Color[]>(["Y", "B", "R", "G"]);
  const [pos, setPos] = useState<Positions>(emptyPositions());
  const [turn, setTurn] = useState(0);
  const [dice, setDice] = useState(0);
  const [phase, setPhase] = useState<"roll" | "rolling" | "pick" | "bot" | "none" | "moving">("roll");
  const [winner, setWinner] = useState<Color | null>(null);
  const [bubble, setBubble] = useState<string | null>(null);
  const [cool, setCool] = useState(false);
  const [stars, setStars] = useState(0);
  const [step, setStep] = useState<{ col: Color; i: number; p: number } | null>(null);
  const timers = useRef<any[]>([]);
  const S = useRef({ pos, turn, dice, seats });
  S.current = { pos, turn, dice, seats };
  const after = (ms: number, fn: () => void) => { timers.current.push(setTimeout(fn, ms)); };
  useEffect(() => { navigation.setOptions({ title: "Ludo 🎲" }); AsyncStorage.getItem("bwStyle").then((v) => v && setStyle(parseInt(v) || 1)); return () => timers.current.forEach(clearTimeout); }, []);

  function begin(n: 2 | 4) {
    timers.current.forEach(clearTimeout);
    setSeats(n === 2 ? ["Y", "R"] : ["Y", "B", "R", "G"]);
    setPos(emptyPositions()); setTurn(0); setDice(0); setPhase("roll"); setWinner(null); setStars(0); setPlayers(n);
  }
  function roll() {
    if (phase !== "roll" || winner) return;
    setPhase("rolling"); snd("dice");
    let n = 0;
    const finalD = 1 + Math.floor(Math.random() * 6);
    const iv = setInterval(() => {
      n++; setDice(1 + Math.floor(Math.random() * 6));
      if (n >= 9) { clearInterval(iv); afterRoll(finalD); }
    }, 90);
    timers.current.push(iv as any);
  }
  function afterRoll(d: number) {
    const { pos: p, turn: t, seats: se } = S.current;
    const color = se[t];
    const mv = movable(p, color, d);
    setDice(d);
    setPhase(mv.length ? (t === 0 ? "pick" : "bot") : "none");
    if (!mv.length) { after(900, () => next(false, t)); return; }
    if (t !== 0) after(750, () => move(botChoose(p, color, d, mv), d, t));
  }
  function move(i: number, d: number, t: number) {
    const { pos: p, seats: se } = S.current;
    const color = se[t];
    const r = applyMove(p, color, i, d);
    const from = p[color][i];
    setPhase("moving");
    // Le pion avance case par case ; sortir de la base = une seule case.
    const path: number[] = from === -1 ? [0] : Array.from({ length: d }, (_, k) => from + 1 + k);
    path.forEach((q, k) => after(k * 190, () => { setStep({ col: color, i, p: q }); snd("move"); }));
    const total = path.length * 190;
    after(total + 60, () => {
      setStep(null); setPos(r.pos); if (r.captured) snd("capture");
      if (r.won) {
        after(450, () => { setWinner(color); snd(color === "Y" ? "win" : "lose"); submitBotGame("ludo", color === "Y" ? "win" : "loss").then(setStars); });
        return;
      }
      after(450, () => next(d === 6 || r.captured, t));
    });
  }
  function next(extra: boolean, t: number) {
    const n = extra ? t : (t + 1) % S.current.seats.length;
    setTurn(n); setPhase("roll");
    if (n !== 0) after(800, () => roll());
  }
  function react(e: string) { if (cool) return; setBubble(e); setCool(true); after(1800, () => setBubble(null)); after(3000, () => setCool(false)); }

  if (players === null) {
    return (
      <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={s.h}>Combien de joueuses ?</Text>
        <TouchableOpacity style={s.cta} onPress={() => begin(2)}><Text style={s.ctaText}>2 joueuses (toi + le téléphone)</Text></TouchableOpacity>
        <TouchableOpacity style={s.cta} onPress={() => begin(4)}><Text style={s.ctaText}>4 joueuses (toi + 3 téléphones)</Text></TouchableOpacity>
        <Text style={s.h2}>Choisis tes pions</Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {STYLES.map((x, k) => (
            <TouchableOpacity key={k} style={[s.style, style === k && { backgroundColor: colors.prune }]} onPress={() => { setStyle(k); AsyncStorage.setItem("bwStyle", String(k)); }}>
              <Text style={{ fontSize: 22 }}>{x[0]}</Text><Text style={[s.styleT, style === k && { color: "#fff" }]}>{x[1]}</Text></TouchableOpacity>))}
        </View>
        <Text style={s.note}>📴 Sans internet. Le jeu en ligne avec d'autres filles arrivera plus tard.</Text>
      </ScrollView>
    );
  }
  const size = Math.floor((Dimensions.get("window").width - 32) / 15);
  const color = seats[turn];
  const myTurn = turn === 0;
  const mvSet = new Set<number>();
  if (phase === "pick" && myTurn) movable(pos, "Y", dice).forEach((i) => mvSet.add(i));
  const counts: Record<string, number> = {};
  const cells: React.ReactNode[] = [];
  const safeCells = new Set(SAFE.map((k) => TRACK[k].join(",")));
  for (let r = 0; r < 15; r++) for (let c = 0; c < 15; c++) {
    let bg = "#fff";
    const corner = r < 6 && c < 6 ? "R" : r < 6 && c > 8 ? "G" : r > 8 && c > 8 ? "Y" : r > 8 && c < 6 ? "B" : "";
    if (corner) { const rr = r % 9, cc = c % 9; const inner = rr >= 1 && rr <= 4 && cc >= 1 && cc <= 4; bg = inner ? "#fff" : HEX[corner as Color]; if (inner && rr >= 2 && rr <= 3 && cc >= 2 && cc <= 3) bg = LIGHT[corner as Color]; }
    else if (r >= 6 && r <= 8 && c >= 6 && c <= 8) bg = "#E9DDF6";
    else {
      if (r === 7 && c >= 1 && c <= 5) bg = LIGHT.R; if (c === 7 && r >= 1 && r <= 5) bg = LIGHT.G; if (r === 7 && c >= 9 && c <= 13) bg = LIGHT.Y; if (c === 7 && r >= 9 && r <= 13) bg = LIGHT.B;
      if (r === 6 && c === 1) bg = HEX.R; if (r === 1 && c === 8) bg = HEX.G; if (r === 8 && c === 13) bg = HEX.Y; if (r === 13 && c === 6) bg = HEX.B;
    }
    cells.push(<View key={r + "-" + c} style={{ position: "absolute", left: c * size, top: r * size, width: size, height: size, backgroundColor: bg, borderWidth: 0.5, borderColor: "rgba(59,29,51,0.22)", alignItems: "center", justifyContent: "center" }}>{safeCells.has(r + "," + c) && !corner ? <Text style={{ fontSize: size * 0.5, color: "#999" }}>★</Text> : null}</View>);
  }
  const pawns: React.ReactNode[] = [];
  seats.forEach((col) => pos[col].forEach((p, i) => {
    const shown = step && step.col === col && step.i === i ? step.p : p;
    const hopping = shown !== p || (step && step.col === col && step.i === i);
    const [rr, cc] = coord(col, shown, i); const key = rr + "," + cc; counts[key] = (counts[key] || 0) + 1;
    const can = col === "Y" && mvSet.has(i);
    const off = (counts[key] - 1) * 3;
    pawns.push(
      <TouchableOpacity key={col + i} disabled={!can} onPress={() => move(i, dice, 0)} activeOpacity={0.8}
        style={{ position: "absolute", left: cc * size + off, top: rr * size + off, width: size, height: size, alignItems: "center", justifyContent: "center", zIndex: hopping ? 20 : can ? 9 : 5 }}>
        <View style={{ width: size * 0.82, height: size * 0.82, borderRadius: size, transform: [{ scale: hopping ? 1.28 : 1 }], elevation: hopping ? 8 : 0, backgroundColor: HEX[col], borderWidth: can ? 3 : 1.5, borderColor: can ? "#fff" : "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center" }}>
          <Text style={{ fontSize: size * 0.5 }}>{STYLES[style][0]}</Text></View>
      </TouchableOpacity>);
  }));
  const canRoll = phase === "roll" && myTurn && !winner;
  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#7B4DF0" }} contentContainerStyle={{ padding: 16, alignItems: "center" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignSelf: "stretch", marginBottom: 8 }}>
        {seats.map((col) => (<View key={col} style={[s.seat, { backgroundColor: HEX[col], opacity: seats[turn] === col ? 1 : 0.7 }]}><Text style={s.seatT}>{NAMES[col]} · {pos[col].filter((x) => x === 56).length}/4</Text></View>))}
      </View>
      <View style={{ width: size * 15, height: size * 15, borderRadius: 14, overflow: "hidden", backgroundColor: "#fff" }}>{cells}{pawns}</View>
      <Text style={s.hint}>{winner ? "Terminé" : myTurn ? (phase === "pick" ? "Touche un pion qui brille ✨" : phase === "roll" ? "À toi !" : "…") : "Tour de " + NAMES[color]}</Text>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <TouchableOpacity activeOpacity={0.8} disabled={!canRoll} onPress={roll}><Die value={dice} rolling={phase === "rolling"} /></TouchableOpacity>
        <TouchableOpacity style={[s.roll, !canRoll && { backgroundColor: "#C9B9C2" }]} disabled={!canRoll} onPress={roll}>
          <Text style={s.rollT}>{winner ? "" : phase === "rolling" ? "…" : canRoll ? "Lance !" : phase === "pick" && myTurn ? "Bouge un pion 👆" : "Elle joue…"}</Text></TouchableOpacity>
      </View>
      <View style={{ flexDirection: "row", gap: 8, marginTop: 12, alignItems: "center" }}>
        {bubble ? <Text style={{ fontSize: 30 }}>{bubble}</Text> : REACTS.map((e) => (<TouchableOpacity key={e} onPress={() => react(e)} style={{ opacity: cool ? 0.45 : 1 }}><Text style={{ fontSize: 26 }}>{e}</Text></TouchableOpacity>))}
      </View>
      {winner && (
        <View style={s.over}>
          <Text style={{ fontSize: 48 }}>{winner === "Y" ? "🏆" : "🎉"}</Text>
          <Text style={s.overT}>{winner === "Y" ? "Bravo, tu as gagné !" : "Bravo " + NAMES[winner] + " !"}</Text>
          <Text style={s.note}>+{stars} ⭐ pour le classement</Text>
          <TouchableOpacity style={[s.cta, { alignSelf: "stretch" }]} onPress={() => begin(players)}><Text style={s.ctaText}>Rejouer</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setPlayers(null)}><Text style={s.note}>Changer de mode</Text></TouchableOpacity>
        </View>)}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  h: { fontWeight: "800", fontSize: 18, color: colors.text, marginBottom: 10 }, h2: { fontWeight: "800", fontSize: 15, color: colors.text, marginTop: 20, marginBottom: 8 },
  cta: { backgroundColor: colors.rose, borderRadius: 999, padding: 16, alignItems: "center", marginTop: 10 }, ctaText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  style: { backgroundColor: "#fff", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, alignItems: "center" }, styleT: { fontWeight: "700", color: colors.text, fontSize: 12 },
  note: { color: colors.textMuted, marginTop: 8, textAlign: "center", fontSize: 12.5 },
  seat: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 }, seatT: { color: "#fff", fontWeight: "800", fontSize: 10.5 },
  hint: { color: "#fff", fontWeight: "800", marginVertical: 10 },
  dice: { width: 64, height: 64, borderRadius: 18, backgroundColor: "#fff", alignItems: "center", justifyContent: "center" },
  roll: { backgroundColor: colors.rose, borderRadius: 999, paddingHorizontal: 24, paddingVertical: 16 }, rollT: { color: "#fff", fontWeight: "800", fontSize: 16 },
  over: { backgroundColor: "#fff", borderRadius: 28, padding: 20, alignItems: "center", marginTop: 16, alignSelf: "stretch" }, overT: { fontSize: 20, fontWeight: "800", color: colors.text },
});
