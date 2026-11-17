import React, { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError, apiOrigin, apiRequest } from "../api/client";
import { colors, spacing } from "../theme/colors";
import { Card, PrimaryButton, ScreenTitle } from "../theme/ui";

// Fiche d'une formation : description, profil de la formatrice, puis inscription avec les VRAIES informations
// (elles serviront à écrire le nom de l'apprenante sur l'attestation).
export default function CourseScreen({ route, navigation }: any) {
  const c = route.params.course;
  const [fullName, setFullName] = useState("");
  const [d, setD] = useState(""); const [m, setM] = useState(""); const [y, setY] = useState("");
  const [place, setPlace] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(false);
  const enrolled = !!route.params.enrolled;

  async function submit() {
    const dd = d.padStart(2, "0"), mm = m.padStart(2, "0");
    if (fullName.trim().length < 5) return Alert.alert("Nom complet", "Écris ton nom et tes prénoms, comme sur ton acte de naissance.");
    if (!/^\d{1,2}$/.test(d) || !/^\d{1,2}$/.test(m) || !/^\d{4}$/.test(y)) return Alert.alert("Date de naissance", "Écris le jour, le mois et l'année (ex. 14 / 03 / 2008).");
    if (place.trim().length < 2) return Alert.alert("Lieu de naissance", "Écris ta ville ou ton village de naissance.");
    setBusy(true);
    try {
      await apiRequest(`/catalog/courses/${c.slug}/enroll`, { method: "POST", body: { fullName: fullName.trim(), birthDate: `${y}-${mm}-${dd}`, birthPlace: place.trim() } });
      Alert.alert("Inscription enregistrée 🎉", "Tu recevras un rappel avant le direct. Ces informations seront écrites sur ton attestation.");
      navigation.goBack();
    } catch (e) { Alert.alert("Oups", e instanceof ApiError ? e.message : "Réessaie plus tard."); }
    setBusy(false);
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg }} keyboardShouldPersistTaps="handled">
        <ScreenTitle>{c.icon} {c.title}</ScreenTitle>
        {c.partner ? <Text style={s.meta}>En partenariat avec {c.partner}</Text> : null}
        <Text style={s.body}>{c.summary}</Text>
        {c.outlineMd ? <Card><Text style={s.h}>Au programme</Text><Text style={s.body}>{String(c.outlineMd).replace(/[#*]/g, "").trim()}</Text></Card> : null}
        <Text style={s.meta}>⏱ {c.durationMin >= 60 ? (c.durationMin / 60).toString().replace(".", ",") + " h" : c.durationMin + " min"} · 🎓 Attestation après le test</Text>
        {c.startsAt ? <Text style={s.meta}>📅 {new Date(c.startsAt).toLocaleString("fr-FR", { dateStyle: "full", timeStyle: "short" })}</Text> : null}
        {c.location ? <Text style={s.meta}>📍 {c.location}</Text> : null}
        {!c.author && c.trainerName ? <Card><Text style={s.h}>Ta formatrice</Text><Text style={s.body}>{c.trainerName}{c.trainerTitle ? " · " + c.trainerTitle : ""}</Text></Card> : null}
        {c.author ? (
          <Card>
            <Text style={s.h}>Ta formatrice</Text>
            <View style={s.row}>
              {c.author.photoUrl ? <Image source={{ uri: apiOrigin + c.author.photoUrl }} style={s.photo} /> : <View style={[s.photo, { backgroundColor: "#FFD6DD" }]} />}
              <View style={{ flex: 1 }}>
                <Text style={s.name}>{c.author.fullName}{c.author.certified ? " ✓" : ""}</Text>
                <Text style={s.meta}>{c.author.profession}</Text>
              </View>
            </View>
          </Card>) : null}
        {enrolled ? <Text style={s.ok}>✓ Tu es déjà inscrite</Text> : !form ? (
          <PrimaryButton title="Je m'inscris" onPress={() => setForm(true)} />
        ) : (
          <Card>
            <Text style={s.h}>Tes vraies informations</Text>
            <Text style={s.meta}>Elles seront écrites sur ton attestation : vérifie bien l'orthographe.</Text>
            <Text style={s.lab}>Nom et prénoms</Text>
            <TextInput style={s.in} value={fullName} onChangeText={setFullName} placeholder="Ex. Marie Ngaïssona" autoCapitalize="words" />
            <Text style={s.lab}>Date de naissance</Text>
            <View style={s.row}>
              <TextInput style={[s.in, { flex: 1, minWidth: 0, width: 0 }]} value={d} onChangeText={setD} placeholder="Jour" keyboardType="number-pad" maxLength={2} />
              <TextInput style={[s.in, { flex: 1, minWidth: 0, width: 0 }]} value={m} onChangeText={setM} placeholder="Mois" keyboardType="number-pad" maxLength={2} />
              <TextInput style={[s.in, { flex: 1.6, minWidth: 0, width: 0 }]} value={y} onChangeText={setY} placeholder="Année" keyboardType="number-pad" maxLength={4} />
            </View>
            <Text style={s.lab}>Lieu de naissance</Text>
            <TextInput style={s.in} value={place} onChangeText={setPlace} placeholder="Ville ou village" autoCapitalize="words" />
            <PrimaryButton title={busy ? "Un instant…" : "Confirmer mon inscription"} onPress={submit} />
          </Card>)}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  h: { fontWeight: "800", color: colors.prune, fontSize: 15, marginBottom: 6 },
  body: { color: colors.text, lineHeight: 21, marginVertical: 6 }, meta: { fontSize: 12, color: "#6E5C68", marginVertical: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 10 }, photo: { width: 64, height: 64, borderRadius: 32 }, name: { fontWeight: "700", color: colors.text, fontSize: 16 },
  lab: { fontWeight: "700", color: colors.prune, marginTop: 10, marginBottom: 4 },
  in: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E8D9E2", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  ok: { color: colors.success, fontWeight: "700", marginVertical: 12 },
});
