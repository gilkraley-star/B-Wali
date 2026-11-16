import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { ApiError, apiRequest } from "../api/client";
import { colors, spacing } from "../theme/colors";
import { Card, PrimaryButton, ScreenTitle } from "../theme/ui";

// Test de fin de formation (QCM). Réussite à 75 % → l'attestation est créée.
export default function TestScreen({ route, navigation }: any) {
  const { slug, title } = route.params;
  const [qs, setQs] = useState<{ q: string; options: string[] }[]>([]);
  const [ans, setAns] = useState<number[]>([]);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    apiRequest<{ q: string; options: string[] }[]>(`/catalog/courses/${slug}/qcm`).then((r) => { setQs(r); setAns(r.map(() => -1)); }).catch((e) => setErr(e instanceof ApiError ? e.message : "Erreur"));
  }, [slug]);
  async function send() {
    if (ans.some((a) => a < 0)) return Alert.alert("Il reste des questions", "Réponds à toutes les questions.");
    try {
      const r = await apiRequest<{ score: number; total: number; passed: boolean }>(`/catalog/courses/${slug}/qcm`, { method: "POST", body: { answers: ans } });
      Alert.alert(r.passed ? "Bravo 🎉" : "Pas encore", r.passed ? `${r.score}/${r.total} : ton attestation est prête !` : `${r.score}/${r.total}. Il faut 75 % : tu peux réessayer.`);
      navigation.goBack();
    } catch (e) { Alert.alert("Oups", e instanceof ApiError ? e.message : "Réessaie."); }
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.lg }}>
      <ScreenTitle>Test : {title}</ScreenTitle>
      {err ? <Text style={{ color: colors.danger }}>{err}</Text> : null}
      {qs.map((q, i) => (
        <Card key={i}>
          <Text style={s.q}>{i + 1}. {q.q}</Text>
          {q.options.map((o, j) => (
            <TouchableOpacity key={j} style={[s.opt, ans[i] === j && s.sel]} onPress={() => setAns(ans.map((a, k) => (k === i ? j : a)))}>
              <Text style={ans[i] === j ? s.selT : s.optT}>{o}</Text>
            </TouchableOpacity>))}
        </Card>))}
      {qs.length > 0 && <PrimaryButton title="Envoyer mes réponses" onPress={send} />}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  q: { fontWeight: "700", color: colors.prune, marginBottom: 8, lineHeight: 20 },
  opt: { borderWidth: 1, borderColor: "#E8D9E2", borderRadius: 12, padding: 10, marginTop: 6, backgroundColor: "#fff" }, sel: { backgroundColor: colors.rose, borderColor: colors.rose },
  optT: { color: colors.text }, selT: { color: "#fff", fontWeight: "700" },
});
