import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { apiRequest, ApiError } from "../api/client";
import { colors, spacing } from "../theme/colors";
import { Card, ErrorText, FieldLabel, PrimaryButton, ScreenTitle, TextInput } from "../theme/ui";

interface Mine {
  articles: Item[];
  courses: Item[];
  income: Item[];
}
interface Item {
  id: string;
  title: string;
  status: string;
  reviewNote?: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  BROUILLON: "Brouillon",
  A_VALIDER: "En attente de validation",
  PUBLIE: "Publié ✓",
  REJETE: "Refusé",
};

const CATEGORIES = [
  ["cycle-menstruel", "Cycle menstruel"],
  ["premieres-regles", "Premières règles"],
  ["hygiene-menstruelle", "Hygiène menstruelle"],
  ["contraception", "Contraception"],
  ["ist", "IST"],
  ["grossesse-maternite", "Grossesse et maternité"],
  ["sante-mentale", "Santé mentale"],
  ["violences", "Violences"],
];

/**
 * Espace des professionnelles : proposer une fiche, suivre le statut de ses propositions.
 * Rien n'est visible des filles avant la validation d'un compte administrateur.
 */
export default function ProSpaceScreen() {
  const [mine, setMine] = useState<Mine | null>(null);
  const [available, setAvailable] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0][0]);
  const [body, setBody] = useState("");
  const [srcTitle, setSrcTitle] = useState("");
  const [srcOrg, setSrcOrg] = useState("");
  const [srcUrl, setSrcUrl] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    apiRequest<Mine>("/pro/mine").then(setMine).catch(() => {});
  }, []);
  useEffect(load, [load]);

  const toggleAvail = async (v: boolean) => {
    setAvailable(v);
    try {
      await apiRequest("/pro/availability", { method: "PATCH", body: { available: v } });
    } catch {
      setAvailable(!v);
    }
  };

  const submit = async () => {
    setError(null);
    setLoading(true);
    try {
      await apiRequest("/pro/submit/articles", {
        method: "POST",
        body: {
          titleFr: title.trim(),
          categorySlug: category,
          bodyFr: body.trim(),
          sources: [{ title: srcTitle.trim(), org: srcOrg.trim(), url: srcUrl.trim() }],
        },
      });
      Alert.alert("Envoyé", "Ta proposition est envoyée à l'administration pour validation.");
      setTitle("");
      setBody("");
      setSrcTitle("");
      setSrcOrg("");
      setSrcUrl("");
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur d'envoi.");
    } finally {
      setLoading(false);
    }
  };

  const all = mine ? [...mine.articles, ...mine.courses, ...mine.income] : [];

  return (
    <ScrollView style={styles.c} contentContainerStyle={{ padding: spacing.lg }}>
      <ScreenTitle>Espace professionnelle</ScreenTitle>
      <Card style={{ flexDirection: "row", alignItems: "center" }}>
        <Text style={{ flex: 1, fontWeight: "600", color: colors.prune }}>Je suis disponible pour répondre aux filles</Text>
        <Switch value={available} onValueChange={toggleAvail} />
      </Card>

      <Text style={styles.h}>Proposer une fiche</Text>
      <Text style={styles.p}>Ta fiche sera relue par l'administration avant d'être visible. Cite au moins une source fiable (OMS, UNICEF, ministère…).</Text>
      <FieldLabel>Titre</FieldLabel>
      <TextInput value={title} onChangeText={setTitle} />
      <FieldLabel>Rubrique</FieldLabel>
      <View style={styles.row}>
        {CATEGORIES.map(([slug, label]) => (
          <Text key={slug} onPress={() => setCategory(slug)} style={[styles.chip, category === slug && styles.chipOn]}>
            {label}
          </Text>
        ))}
      </View>
      <FieldLabel>Contenu</FieldLabel>
      <TextInput value={body} onChangeText={setBody} multiline numberOfLines={8} style={{ minHeight: 140, textAlignVertical: "top" }} />
      <FieldLabel>Source : titre du document</FieldLabel>
      <TextInput value={srcTitle} onChangeText={setSrcTitle} />
      <FieldLabel>Source : organisation</FieldLabel>
      <TextInput value={srcOrg} onChangeText={setSrcOrg} />
      <FieldLabel>Source : adresse web (https://…)</FieldLabel>
      <TextInput value={srcUrl} onChangeText={setSrcUrl} autoCapitalize="none" keyboardType="url" />
      <ErrorText>{error}</ErrorText>
      <PrimaryButton title="Envoyer pour validation" onPress={submit} loading={loading} />

      <Text style={styles.h}>Mes propositions</Text>
      {all.length === 0 && <Text style={styles.p}>Aucune proposition pour l'instant.</Text>}
      {all.map((i) => (
        <Card key={i.id}>
          <Text style={{ fontWeight: "700", color: colors.prune }}>{i.title}</Text>
          <Text style={{ color: i.status === "PUBLIE" ? colors.success : i.status === "REJETE" ? colors.danger : "#6E5C68", fontSize: 12, marginTop: 2 }}>
            {STATUS_LABEL[i.status] || i.status}
          </Text>
          {i.status === "REJETE" && i.reviewNote ? <Text style={styles.p}>Motif : {i.reviewNote}</Text> : null}
        </Card>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  h: { fontSize: 16, fontWeight: "700", color: colors.prune, marginTop: spacing.lg, marginBottom: 4 },
  p: { color: "#6E5C68", lineHeight: 20, marginBottom: spacing.sm },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, color: colors.prune, backgroundColor: "#fff", overflow: "hidden", fontSize: 12 },
  chipOn: { backgroundColor: colors.prune, color: "#fff", borderColor: colors.prune },
});
