import React, { useCallback, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, radius, spacing } from "../../theme/colors";
import { loadLocal, syncGames } from "../../games/gamesStore";

const TILES: { icon: string; title: string; sub: string; route: string; params?: any; bg: string }[] = [
  { icon: "❓", title: "Quiz de culture", sub: "Pays, monde, santé · 100 niveaux", route: "Quiz", params: { kind: "culture" }, bg: "#E3F0FF" },
  { icon: "🇬🇧", title: "Quiz d'anglais", sub: "Du débutant à l'expert · 100 niveaux", route: "Quiz", params: { kind: "english" }, bg: "#E7ECFF" },
  { icon: "🔎", title: "Mots mêlés", sub: "Français ou English · 1000 séries", route: "MotsMeles", bg: "#DDF5E8" },
  { icon: "🌰", title: "Awalé", sub: "Contre le téléphone, sans internet", route: "Awale", bg: "#FFF1CC" },
  { icon: "🎲", title: "Ludo", sub: "Contre le téléphone, 2 ou 4 filles", route: "Ludo", bg: "#F3E4FF" },
  { icon: "💇🏾‍♀️", title: "Mon salon", sub: "Apprends à fixer tes prix", route: "Salon", bg: "#FFE0E6" },
  { icon: "📖", title: "Histoires", sub: "Contes, héroïnes, éducation", route: "Stories", bg: "#FFD6DD" },
  { icon: "🏆", title: "Classement", sub: "Les étoiles de la semaine", route: "Leaderboard", bg: "#FFE9A8" },
];

export default function GamesHomeScreen({ navigation }: any) {
  const [stars, setStars] = useState(0);
  useFocusEffect(useCallback(() => {
    loadLocal().then((g) => setStars(g.stars));
    syncGames().then(() => loadLocal().then((g) => setStars(g.stars))).catch(() => {});
  }, []));
  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={s.head}>
        <Text style={s.title}>Jeux et Divertissement 🎮</Text>
        <View style={s.pill}><Text style={s.pillText}>⭐ {stars}</Text></View>
      </View>
      <View style={s.offline}><Text style={s.offlineText}>📴 Pas d'internet ? Tous les jeux marchent hors ligne, contre le téléphone. Tes étoiles se synchronisent plus tard.</Text></View>
      {TILES.map((t) => (
        <TouchableOpacity key={t.title} style={s.tile} onPress={() => navigation.navigate(t.route, t.params)} activeOpacity={0.85}>
          <View style={[s.icon, { backgroundColor: t.bg }]}><Text style={{ fontSize: 26 }}>{t.icon}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={s.tileTitle}>{t.title}</Text>
            <Text style={s.tileSub}>{t.sub}</Text>
          </View>
          <Text style={s.go}>›</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: spacing.md },
  title: { fontSize: 20, fontWeight: "800", color: colors.prune, flex: 1 },
  pill: { backgroundColor: "#FFD84D", borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 6 },
  pillText: { fontWeight: "800", color: colors.text },
  offline: { backgroundColor: "#DDF5E8", borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md },
  offlineText: { color: "#1E5C3A", fontSize: 13, lineHeight: 18 },
  tile: { backgroundColor: colors.surface, borderRadius: 26, padding: 14, flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 12, shadowColor: "#3B1D33", shadowOpacity: 0.08, shadowRadius: 10, elevation: 2 },
  icon: { width: 50, height: 50, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  tileTitle: { fontWeight: "800", fontSize: 15, color: colors.text },
  tileSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  go: { fontSize: 26, color: colors.textMuted },
});
