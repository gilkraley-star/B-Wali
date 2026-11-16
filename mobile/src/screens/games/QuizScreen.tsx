import React, { useEffect, useState } from "react";
import { play as snd } from "../../games/sounds";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, radius, spacing } from "../../theme/colors";
import { MAX_LEVEL, PASS_MARK, QuizKind, TIER_NAMES, questionsFor, tierOf } from "../../games/quiz";
import { loadLocal, submitQuiz } from "../../games/gamesStore";

export default function QuizScreen({ route, navigation }: any) {
  const kind: QuizKind = route.params?.kind === "english" ? "english" : "culture";
  const key = "quiz-" + kind;
  const [step, setStep] = useState<"menu" | "play" | "end">("menu");
  const [level, setLevel] = useState(1);
  const [open, setOpen] = useState(1);
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [earned, setEarned] = useState(0);

  useEffect(() => { navigation.setOptions({ title: kind === "english" ? "Quiz d'anglais 🇬🇧" : "Quiz de culture ❓" }); }, [kind]);
  useEffect(() => { loadLocal().then((g) => { const o = g.open[key] || 1; setOpen(o); setLevel(Math.min(o, MAX_LEVEL)); }); }, []);

  const qs = questionsFor(kind, level);
  const tierName = TIER_NAMES[kind][tierOf(kind, level)];
  const answered = answers.length > i;
  const q = qs[Math.min(i, 4)];
  const right = answers.filter((a, k) => a === qs[k][3]).length;
  const passed = right >= PASS_MARK;

  function start() { setI(0); setAnswers([]); setStep("play"); }
  function pick(v: boolean) { if (!answered) { snd(v === qs[i][3] ? "good" : "bad"); setAnswers([...answers, v]); } }
  async function next() {
    if (i < 4) { setI(i + 1); return; }
    const r = answers.filter((a, k) => a === qs[k][3]).length;
    setEarned(await submitQuiz(kind, level, answers, r));
    if (r >= PASS_MARK) setOpen(Math.max(open, level + 1));
    setStep("end");
  }

  if (step === "menu") {
    const jumps = (kind === "english" ? [1, 17, 34, 51, 71, 86, 100] : [1, 10, 33, 50, 67, 100]);
    return (
      <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg }}>
        <View style={s.hero}><Text style={s.heroLabel}>Niveau</Text>
          <Text style={s.heroNum}>{level} <Text style={s.heroSmall}>sur {MAX_LEVEL}</Text></Text>
          <View style={s.chip}><Text style={s.chipText}>{tierName}</Text></View>
          <Text style={s.heroHint}>5 questions · Vrai ou Faux · {PASS_MARK} bonnes réponses pour ouvrir le niveau suivant</Text></View>
        <TouchableOpacity style={s.cta} onPress={start}><Text style={s.ctaText}>▶ Jouer le niveau {level}</Text></TouchableOpacity>
        <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
          <TouchableOpacity style={s.ghost} onPress={() => setLevel(Math.max(1, level - 1))}><Text style={s.ghostText}>‹ Précédent</Text></TouchableOpacity>
          <TouchableOpacity style={s.ghost} onPress={() => level < open && setLevel(level + 1)}><Text style={s.ghostText}>Suivant ›</Text></TouchableOpacity>
        </View>
        <Text style={s.h}>Aller plus loin</Text>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {jumps.map((n) => { const lock = n > open; return (
            <TouchableOpacity key={n} disabled={lock} onPress={() => setLevel(n)} style={[s.jump, lock && { backgroundColor: "#EEE6EC" }]}>
              <Text style={[s.jumpText, lock && { color: "#A596A0" }]}>{lock ? "🔒 " : ""}Niveau {n}</Text></TouchableOpacity>); })}
        </View>
      </ScrollView>
    );
  }
  if (step === "play") {
    const ok = answered && answers[i] === q[3];
    return (
      <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg }}>
        <View style={s.bar}><View style={[s.barFill, { width: `${((i + (answered ? 1 : 0)) / 5) * 100}%` }]} /></View>
        <Text style={s.muted}>Niveau {level} · Question {i + 1} sur 5</Text>
        <View style={s.card}><Text style={s.tag}>{q[1]}</Text><Text style={{ fontSize: 46 }}>{q[0]}</Text><Text style={s.qText}>{q[2]}</Text></View>
        {!answered ? (
          <View style={{ flexDirection: "row", gap: 12 }}>
            <TouchableOpacity style={[s.tf, { backgroundColor: "#2FB872" }]} onPress={() => pick(true)}><Text style={s.tfText}>✓ Vrai</Text></TouchableOpacity>
            <TouchableOpacity style={[s.tf, { backgroundColor: "#FF5470" }]} onPress={() => pick(false)}><Text style={s.tfText}>✗ Faux</Text></TouchableOpacity>
          </View>
        ) : (
          <View>
            <View style={[s.fb, { backgroundColor: ok ? "#DDF5E8" : "#FFE0E6" }]}>
              <Text style={[s.fbTitle, { color: ok ? "#1E8A55" : "#C23B3B" }]}>{ok ? "Bravo ! 🎉" : "Pas tout à fait… ça arrive à tout le monde 💛"}</Text>
              <Text style={s.fbText}>{q[4]}</Text></View>
            <TouchableOpacity style={s.cta} onPress={next}><Text style={s.ctaText}>{i === 4 ? "Voir mon résultat" : "Question suivante →"}</Text></TouchableOpacity>
          </View>)}
      </ScrollView>
    );
  }
  return (
    <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg, alignItems: "center" }}>
      <Text style={{ fontSize: 64 }}>{passed ? "🎉" : "💪"}</Text>
      <Text style={s.endTitle}>{passed ? "Niveau réussi !" : "Presque !"}</Text>
      <Text style={s.endSub}>{right} bonne(s) réponse(s) sur 5 · +{earned} ⭐</Text>
      {!passed && <Text style={s.muted}>Il faut {PASS_MARK} bonnes réponses pour passer. Réessaie !</Text>}
      <TouchableOpacity style={[s.cta, { alignSelf: "stretch", marginTop: 20 }]} onPress={() => { if (passed) setLevel(Math.min(MAX_LEVEL, level + 1)); start(); }}>
        <Text style={s.ctaText}>{passed ? "Niveau suivant ▶" : "Réessayer"}</Text></TouchableOpacity>
      <TouchableOpacity style={[s.ghost, { alignSelf: "stretch", marginTop: 10 }]} onPress={() => { if (passed) setLevel(Math.min(MAX_LEVEL, level + 1)); setStep("menu"); }}><Text style={s.ghostText}>Retour au menu</Text></TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  hero: { backgroundColor: "#8E5CFF", borderRadius: 30, padding: 20 },
  heroLabel: { color: "#EADFFF", fontWeight: "700" }, heroNum: { color: "#fff", fontSize: 46, fontWeight: "800" }, heroSmall: { fontSize: 18, color: "#EADFFF" },
  chip: { alignSelf: "flex-start", backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 6 }, chipText: { fontWeight: "800", color: colors.text },
  heroHint: { color: "#EADFFF", marginTop: 10, fontSize: 12.5 },
  cta: { backgroundColor: colors.rose, borderRadius: 999, padding: 16, alignItems: "center", marginTop: 14 }, ctaText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  ghost: { flex: 1, backgroundColor: "#fff", borderRadius: 20, padding: 13, alignItems: "center" }, ghostText: { fontWeight: "800", color: colors.text },
  h: { fontWeight: "800", fontSize: 15, color: colors.text, marginTop: 18, marginBottom: 8 },
  jump: { backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 9 }, jumpText: { fontWeight: "800", color: colors.text, fontSize: 13 },
  bar: { height: 8, backgroundColor: "#F1E6EE", borderRadius: 4, overflow: "hidden" }, barFill: { height: 8, backgroundColor: colors.rose },
  muted: { color: colors.textMuted, marginVertical: 8 },
  card: { backgroundColor: "#fff", borderRadius: 30, padding: 22, alignItems: "center", marginBottom: 14 },
  tag: { backgroundColor: "#E7D5FF", color: colors.text, fontWeight: "700", fontSize: 12, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, overflow: "hidden", marginBottom: 8 },
  qText: { fontSize: 19, fontWeight: "700", color: colors.text, textAlign: "center", marginTop: 8, lineHeight: 26 },
  tf: { flex: 1, borderRadius: 24, padding: 20, alignItems: "center" }, tfText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  fb: { borderRadius: 20, padding: 14, marginBottom: 6 }, fbTitle: { fontWeight: "800", fontSize: 16 }, fbText: { marginTop: 4, color: colors.text, lineHeight: 20 },
  endTitle: { fontSize: 26, fontWeight: "800", color: colors.text, marginTop: 6 }, endSub: { fontSize: 15, color: colors.textMuted, marginTop: 6 },
});
