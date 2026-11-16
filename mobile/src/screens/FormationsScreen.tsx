import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { apiRequest, ApiError } from "../api/client";
import { colors, spacing } from "../theme/colors";
import { Card, PrimaryButton, ScreenTitle } from "../theme/ui";
import { Source, SourcesBlock } from "../components/Sources";

interface Course {
  id: string;
  slug: string;
  title: string;
  summary: string;
  icon: string;
  partner?: string | null;
  durationMin: number;
  startsAt?: string | null;
  postponedTo?: string | null;
  state: string;
  outlineMd: string;
  sources: Source[];
}
interface Enrollment {
  courseSlug: string;
  attendedToEnd: boolean;
  score: number | null;
  certificateNo: string | null;
}

function fmt(d?: string | null) {
  return d ? new Date(d).toLocaleString("fr-FR", { dateStyle: "long", timeStyle: "short" }) : "Date à venir";
}

export default function FormationsScreen() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [mine, setMine] = useState<Record<string, Enrollment>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, e] = await Promise.all([apiRequest<Course[]>("/catalog/courses"), apiRequest<any[]>("/catalog/my-enrollments")]);
      setCourses(c);
      setMine(Object.fromEntries(e.map((x) => [x.courseSlug, x])));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Erreur de chargement.");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const enroll = async (slug: string) => {
    try {
      await apiRequest(`/catalog/courses/${slug}/enroll`, { method: "POST" });
      Alert.alert("Inscription enregistrée", "Tu recevras un rappel avant le direct.");
      load();
    } catch (err) {
      Alert.alert("Erreur", err instanceof ApiError ? err.message : "Réessaie plus tard.");
    }
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg }}
      data={courses}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={
        <View>
          <ScreenTitle>Formations</ScreenTitle>
          <Text style={styles.intro}>
            Tout se suit ici, dans l'application : tu t'inscris, tu suis le direct jusqu'au bout, puis tu passes le test pour obtenir ton attestation.
          </Text>
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      }
      ListEmptyComponent={!error ? <Text style={styles.intro}>Les premières formations arrivent bientôt.</Text> : null}
      renderItem={({ item: c }) => {
        const e = mine[c.slug];
        const postponed = c.state === "REPORTEE";
        return (
          <Card>
            <Text style={styles.title}>
              {c.icon} {c.title}
            </Text>
            {c.partner ? <Text style={styles.meta}>En partenariat avec {c.partner}</Text> : null}
            <Text style={styles.body}>{c.summary}</Text>
            <Text style={styles.meta}>⏱ {c.durationMin} min · 🎓 Attestation après le test</Text>
            {postponed ? (
              <Text style={styles.postponed}>
                📅 Session reportée : la formatrice n'était pas disponible. Nouvelle date : {fmt(c.postponedTo)}. Ton inscription reste valable.
              </Text>
            ) : (
              <Text style={styles.meta}>📅 {fmt(c.startsAt)}</Text>
            )}
            {e ? (
              <Text style={styles.ok}>
                ✓ Inscrite
                {e.certificateNo ? ` · Attestation ${e.certificateNo}` : e.attendedToEnd ? " · Test disponible" : " · Test après le direct"}
              </Text>
            ) : (
              <PrimaryButton title="Je m'inscris" onPress={() => enroll(c.slug)} />
            )}
            <SourcesBlock sources={c.sources} />
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  intro: { color: "#6E5C68", marginBottom: spacing.md, lineHeight: 20 },
  title: { fontSize: 17, fontWeight: "700", color: colors.prune, marginBottom: 4 },
  meta: { fontSize: 12, color: "#6E5C68", marginTop: 4 },
  body: { fontSize: 14, color: colors.text, marginTop: 6, lineHeight: 20 },
  ok: { color: colors.success, fontWeight: "700", marginTop: spacing.sm },
  postponed: { fontSize: 12, color: "#7A5410", backgroundColor: "#FDF1DC", padding: spacing.sm, borderRadius: 10, marginTop: spacing.sm },
  error: { color: colors.danger, marginBottom: spacing.sm },
});
