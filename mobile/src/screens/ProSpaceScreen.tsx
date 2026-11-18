import React, { useCallback, useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { apiRequest, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
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
export default function ProSpaceScreen({ navigation }: any) {
  const { user } = useAuth();
  const partner = user?.role === "PARTENAIRE";
  const [cTitle, setCTitle] = useState(""); const [cSum, setCSum] = useState(""); const [cOutline, setCOutline] = useState(""); const [cHours, setCHours] = useState("2");
  const [cFmt, setCFmt] = useState("DIRECT"); const [cCert, setCCert] = useState(true); const [cTest, setCTest] = useState(true);
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

  const submitCourse = async () => {
    setError(null);
    const h = parseFloat(cHours.replace(",", "."));
    if (!(h >= 0.5)) return setError("Écris la durée en heures (ex. 2).");
    setLoading(true);
    try {
      await apiRequest("/pro/submit/courses", { method: "POST", body: { title: cTitle.trim(), summary: cSum.trim(), outlineMd: cOutline.trim(), durationMin: Math.round(h * 60), format: cFmt, certified: cCert, hasTest: cCert && cTest } });
      Alert.alert("Envoyée", "Ta formation est envoyée à l'équipe Wali. Elle sera visible après validation.");
      setCTitle(""); setCSum(""); setCOutline(""); load();
    } catch (e) { setError(e instanceof ApiError ? e.message : "Erreur d'envoi."); }
    finally { setLoading(false); }
  };
  const all = mine ? [...mine.articles, ...mine.courses, ...mine.income] : [];

  return (
    <ScrollView style={styles.c} contentContainerStyle={{ padding: spacing.lg }}>
      <ScreenTitle>{partner ? "Espace partenaire" : "Espace professionnelle"}</ScreenTitle>
      {!partner && (
        <Card style={{ marginBottom: spacing.md }}>
          <PrimaryButton title="💌 Mes messages" onPress={() => navigation.navigate("ProInbox")} />
        </Card>
      )}
      {partner ? (<>
        <Text style={styles.p}>Propose une formation pour les filles. L'équipe Wali la relit, ajoute les vidéos et la programme. Les sources sont facultatives.</Text>
        <FieldLabel>Titre de la formation</FieldLabel>
        <TextInput value={cTitle} onChangeText={setCTitle} />
        <FieldLabel>Description courte</FieldLabel>
        <TextInput value={cSum} onChangeText={setCSum} multiline style={{ minHeight: 70, textAlignVertical: "top" }} />
        <FieldLabel>Programme (un thème par ligne)</FieldLabel>
        <TextInput value={cOutline} onChangeText={setCOutline} multiline style={{ minHeight: 110, textAlignVertical: "top" }} />
        <FieldLabel>Durée totale (en heures)</FieldLabel>
        <TextInput value={cHours} onChangeText={setCHours} keyboardType="decimal-pad" />
        <FieldLabel>Type</FieldLabel>
        <View style={styles.row}>{[["DIRECT", "En direct"], ["VIDEOS", "Vidéos"], ["REPLAY", "Replay"]].map(([k, l]) => <Text key={k} onPress={() => setCFmt(k)} style={[styles.chip, cFmt === k && styles.chipOn]}>{l}</Text>)}</View>
        <View style={[styles.row, { marginTop: 10 }]}><Text onPress={() => setCCert(!cCert)} style={[styles.chip, cCert && styles.chipOn]}>🎓 Avec attestation</Text><Text onPress={() => cCert && setCTest(!cTest)} style={[styles.chip, cCert && cTest && styles.chipOn]}>📝 Avec test</Text></View>
        <ErrorText>{error}</ErrorText>
        <PrimaryButton title="Envoyer pour validation" onPress={submitCourse} loading={loading} />
      </>) : (<>
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
      </>)}

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
