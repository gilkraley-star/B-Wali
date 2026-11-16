import React, { useEffect, useMemo, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiRequest, ApiError } from "../api/client";
import { colors, radius, spacing } from "../theme/colors";
import { Card, ScreenTitle } from "../theme/ui";
import { Source, SourcesBlock } from "../components/Sources";

interface Activity {
  id: string;
  title: string;
  icon: string;
  capitalMinFcfa: number;
  summary: string;
  needsMd: string;
  stepsMd: string;
  risksMd: string;
  sources: Source[];
}

const FILTERS = [
  { id: "all", label: "Tout" },
  { id: "zero", label: "Sans argent (0 F)" },
  { id: "low", label: "Moins de 25 000 F" },
  { id: "high", label: "25 000 F et +" },
];

function fcfa(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ") + " FCFA";
}

export default function RevenusScreen() {
  const [list, setList] = useState<Activity[]>([]);
  const [filter, setFilter] = useState("all");
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiRequest<Activity[]>("/catalog/income")
      .then(setList)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erreur de chargement."));
  }, []);

  const shown = useMemo(
    () => list.filter((a) => (filter === "zero" ? a.capitalMinFcfa === 0 : filter === "low" ? a.capitalMinFcfa < 25000 : filter === "high" ? a.capitalMinFcfa >= 25000 : true)),
    [list, filter]
  );

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg }}
      data={shown}
      keyExtractor={(a) => a.id}
      ListHeaderComponent={
        <View>
          <ScreenTitle>Gagner un revenu</ScreenTitle>
          <Text style={styles.intro}>Des idées d'activités pour démarrer, avec le capital minimum indicatif. Les montants sont à vérifier avec les prix réels de ton marché.</Text>
          <View style={styles.chips}>
            {FILTERS.map((f) => (
              <TouchableOpacity key={f.id} onPress={() => setFilter(f.id)} style={[styles.chip, filter === f.id && styles.chipOn]}>
                <Text style={[styles.chipText, filter === f.id && { color: "#fff" }]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {error && <Text style={{ color: colors.danger }}>{error}</Text>}
        </View>
      }
      renderItem={({ item: a }) => (
        <Card>
          <TouchableOpacity onPress={() => setOpen(open === a.id ? null : a.id)}>
            <Text style={styles.title}>
              {a.icon} {a.title}
            </Text>
            <Text style={styles.capital}>Dès {fcfa(a.capitalMinFcfa)}</Text>
            <Text style={styles.body}>{a.summary}</Text>
            <Text style={styles.more}>{open === a.id ? "Réduire ▲" : "Voir comment démarrer ▼"}</Text>
          </TouchableOpacity>
          {open === a.id && (
            <View>
              <Text style={styles.h}>Il te faut</Text>
              <Text style={styles.body}>{a.needsMd}</Text>
              <Text style={styles.h}>Comment démarrer</Text>
              <Text style={styles.body}>{a.stepsMd}</Text>
              <Text style={styles.h}>Précautions</Text>
              <Text style={styles.body}>{a.risksMd}</Text>
              <SourcesBlock sources={a.sources} />
            </View>
          )}
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  intro: { color: "#6E5C68", marginBottom: spacing.md, lineHeight: 20 },
  chips: { flexDirection: "row", gap: spacing.sm, marginBottom: spacing.md, flexWrap: "wrap" },
  chip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 7, backgroundColor: "#fff" },
  chipOn: { backgroundColor: colors.prune, borderColor: colors.prune },
  chipText: { color: colors.prune, fontWeight: "600", fontSize: 12 },
  title: { fontSize: 17, fontWeight: "700", color: colors.prune },
  capital: { fontSize: 13, fontWeight: "700", color: "#C23B3B", marginTop: 2 },
  body: { fontSize: 14, color: colors.text, lineHeight: 20, marginTop: 4 },
  more: { fontSize: 12, color: "#15609E", marginTop: spacing.sm, fontWeight: "600" },
  h: { fontSize: 13, fontWeight: "700", color: colors.prune, marginTop: spacing.md },
});
