import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { apiRequest } from "../../api/client";
import { colors, spacing } from "../../theme/colors";

interface Row { rank: number; pseudonyme: string; stars: number; me: boolean }

export default function LeaderboardScreen({ navigation }: any) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    navigation.setOptions({ title: "Classement 🏆" });
    apiRequest<{ top: Row[] }>("/games/leaderboard", { silent: true }).then((r) => setRows(r.top)).catch(() => { setOffline(true); setRows([]); });
  }, []);
  return (
    <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={s.h}>Les étoiles de la semaine</Text>
      {offline && <Text style={s.mut}>📴 Connecte-toi à internet pour voir le classement.</Text>}
      {rows && !offline && rows.length === 0 && <Text style={s.mut}>Personne n'a encore d'étoiles cette semaine. Sois la première ! ⭐</Text>}
      {rows?.map((r) => (
        <View key={r.rank} style={[s.row, r.me && { backgroundColor: "#FFF1CC" }]}>
          <Text style={s.rank}>{r.rank === 1 ? "🥇" : r.rank === 2 ? "🥈" : r.rank === 3 ? "🥉" : r.rank}</Text>
          <Text style={s.name}>{r.pseudonyme}{r.me ? " (toi)" : ""}</Text><Text style={s.stars}>⭐ {r.stars}</Text>
        </View>))}
      <Text style={s.mut}>Seuls les pseudonymes sont visibles. Les étoiles sont calculées par le serveur.</Text>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background }, h: { fontSize: 20, fontWeight: "800", color: colors.prune, marginBottom: 12 },
  mut: { color: colors.textMuted, marginVertical: 8, lineHeight: 19 },
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 18, padding: 14, marginBottom: 8 },
  rank: { width: 36, fontWeight: "800", fontSize: 18 }, name: { flex: 1, fontWeight: "700", color: colors.text }, stars: { fontWeight: "800", color: colors.text },
});
