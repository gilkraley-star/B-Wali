import React, { useEffect, useState } from "react";
import { Alert, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { colors, spacing } from "../theme/colors";
import { Carnet, Entry, MOODS, frToKey, loadCarnets, saveCarnets, todayFr, typeOf } from "../storage/carnets";

export default function CarnetScreen({ route, navigation }: any) {
  const [all, setAll] = useState<Carnet[]>([]);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayFr());
  const [vals, setVals] = useState<Record<string, string>>({});
  const carnet = all.find((c) => c.id === route.params.id);
  const t = carnet ? typeOf(carnet.type) : null;

  useEffect(() => { loadCarnets().then(setAll); }, []);
  useEffect(() => { if (carnet) navigation.setOptions({ title: `${carnet.emoji} ${carnet.title}` }); }, [carnet?.title]);
  if (!carnet || !t) return <View style={s.c} />;

  async function persist(next: Carnet[]) { await saveCarnets(next); setAll(next); }
  async function save() {
    if (!/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(date.trim())) return Alert.alert("Date", "Écris la date comme ceci : 14/03/2025.");
    if (!Object.values(vals).some((v) => v && v.trim())) return Alert.alert("Page vide", "Écris au moins une chose.");
    for (const f of t!.fields) if ((f.kind === "date") && vals[f.key] && !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(vals[f.key].trim())) return Alert.alert("Date", `« ${f.label} » : écris la date comme 14/03/2025.`);
    const e: Entry = { id: String(Date.now()), date: date.trim(), values: vals };
    await persist(all.map((c) => (c.id === carnet!.id ? { ...c, entries: [...c.entries, e] } : c)));
    setOpen(false); setVals({}); setDate(todayFr());
  }
  function delEntry(e: Entry) { Alert.alert("Supprimer cette page ?", "Elle sera effacée pour toujours.", [{ text: "Garder", style: "cancel" }, { text: "Supprimer", style: "destructive", onPress: () => persist(all.map((c) => (c.id === carnet!.id ? { ...c, entries: c.entries.filter((x) => x.id !== e.id) } : c))) }]); }
  function delCarnet() { Alert.alert("Supprimer ce carnet ?", "Toutes ses pages seront effacées pour toujours.", [{ text: "Garder", style: "cancel" }, { text: "Supprimer", style: "destructive", onPress: async () => { await persist(all.filter((c) => c.id !== carnet!.id)); navigation.goBack(); } }]); }

  const entries = [...carnet.entries].sort((a, b) => frToKey(b.date).localeCompare(frToKey(a.date)));
  return (
    <View style={s.c}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <Text style={s.small}>{t.about}</Text>
        {t.note ? <Text style={s.note}>{t.note}</Text> : null}
        {entries.length === 0 && <Text style={[s.small, { textAlign: "center", marginVertical: 24 }]}>Aucune page pour l'instant. Appuie sur « Nouvelle page ».</Text>}
        {entries.map((e) => (
          <TouchableOpacity key={e.id} style={s.card} onLongPress={() => delEntry(e)} activeOpacity={0.9}>
            <Text style={s.date}>📅 {e.date}</Text>
            {t.fields.map((f) => e.values[f.key] && carnet.type === "journal" && f.key === "text" ? <View key={f.key} style={s.handBox}><Text style={s.hand}>{e.values[f.key]}</Text></View> : e.values[f.key] ? <Text key={f.key} style={s.line}>{f.kind === "mood" ? <Text style={{ fontSize: 22 }}>{e.values[f.key]}</Text> :  <><Text style={s.lab}>{f.label} : </Text>{e.values[f.key]}{f.key === "fcfa" ? " FCFA" : ""}</>}</Text> : null)}
          </TouchableOpacity>))}
        {entries.length > 0 && <Text style={[s.small, { textAlign: "center" }]}>Reste appuyée sur une page pour la supprimer.</Text>}
        <TouchableOpacity onPress={delCarnet}><Text style={[s.small, { textAlign: "center", marginTop: 20, color: colors.danger }]}>Supprimer ce carnet</Text></TouchableOpacity>
      </ScrollView>
      <TouchableOpacity style={s.fab} onPress={() => setOpen(true)}><Text style={s.fabT}>＋ Nouvelle page</Text></TouchableOpacity>

      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <KeyboardAvoidingView style={s.back} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <View style={s.sheet}><ScrollView keyboardShouldPersistTaps="handled">
            <Text style={s.h}>{carnet.emoji} Nouvelle page</Text>
            <Text style={s.lab2}>Date (JJ/MM/AAAA)</Text>
            <TextInput style={s.in} value={date} onChangeText={setDate} />
            {t.fields.map((f) => (
              <View key={f.key}>
                <Text style={s.lab2}>{f.label}</Text>
                {f.kind === "mood" ? (
                  <View style={s.row}>{MOODS.map((m) => (<TouchableOpacity key={m} onPress={() => setVals({ ...vals, [f.key]: m })} style={[s.mood, vals[f.key] === m && s.moodOn]}><Text style={{ fontSize: 26 }}>{m}</Text></TouchableOpacity>))}</View>
                ) : f.kind === "choice" ? (
                  <View style={s.row}>{f.options!.map((o) => (<TouchableOpacity key={o} onPress={() => setVals({ ...vals, [f.key]: o })} style={[s.chip, vals[f.key] === o && s.chipOn]}><Text style={vals[f.key] === o ? s.chipOnT : s.chipT}>{o}</Text></TouchableOpacity>))}</View>
                ) : (
                  <TextInput style={[s.in, f.kind === "long" && { minHeight: 90, textAlignVertical: "top" }, carnet.type === "journal" && f.key === "text" && s.handIn]} placeholder={carnet.type === "journal" && f.key === "text" ? "Cher journal…" : undefined} placeholderTextColor="#B9A7B2" multiline={f.kind === "long"} value={vals[f.key] || ""} keyboardType={f.kind === "number" ? "decimal-pad" : "default"} onChangeText={(v) => setVals({ ...vals, [f.key]: v })} />
                )}
              </View>))}
            <TouchableOpacity style={s.save} onPress={save}><Text style={s.fabT}>Enregistrer</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setOpen(false)}><Text style={[s.small, { textAlign: "center", marginTop: 10 }]}>Annuler</Text></TouchableOpacity>
          </ScrollView></View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
const s = StyleSheet.create({
  hand: { fontFamily: "Caveat_500Medium", fontSize: 24, lineHeight: 34, color: "#3B1D33", paddingTop: 4 },
  handBox: { marginTop: 8, backgroundColor: "#FFFBF2", padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#F0DDB8" },
  handIn: { fontFamily: "Caveat_500Medium", fontSize: 24, lineHeight: 32, minHeight: 280, backgroundColor: "#FFFBF2", borderColor: "#F0DDB8" },
  c: { flex: 1, backgroundColor: colors.background }, small: { fontSize: 12, color: "#6E5C68", lineHeight: 17 }, note: { fontSize: 12, color: "#7A5410", backgroundColor: "#FDF1DC", padding: 10, borderRadius: 10, marginTop: 8 },
  card: { backgroundColor: "#fff", borderRadius: 18, padding: 14, marginTop: 10 }, date: { fontWeight: "800", color: colors.prune, marginBottom: 4 }, line: { color: colors.text, lineHeight: 20, marginTop: 2 }, lab: { fontWeight: "700", color: colors.prune },
  fab: { position: "absolute", bottom: 16, alignSelf: "center", backgroundColor: colors.rose, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14, elevation: 4 }, fabT: { color: "#fff", fontWeight: "800", fontSize: 15 },
  back: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }, sheet: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "90%" },
  h: { fontSize: 18, fontWeight: "800", color: colors.prune }, lab2: { fontWeight: "700", color: colors.prune, marginTop: 12, marginBottom: 4 },
  in: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E8D9E2", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, mood: { padding: 6, borderRadius: 14, backgroundColor: "#fff" }, moodOn: { backgroundColor: "#FFD6DD" },
  chip: { borderWidth: 1, borderColor: colors.rose, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 }, chipOn: { backgroundColor: colors.rose }, chipT: { color: colors.rose, fontWeight: "600" }, chipOnT: { color: "#fff", fontWeight: "700" },
  save: { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 14, alignItems: "center", marginTop: 18 },
});
