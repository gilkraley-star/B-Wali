import { KeyboardTapDismiss, Backdrop } from "../theme/kb";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, spacing } from "../theme/colors";
import { Carnet, TYPES, getPin, loadCarnets, saveCarnets, setPin, typeOf } from "../storage/carnets";

export default function MonCarnetScreen({ navigation }: any) {
  const [carnets, setCarnets] = useState<Carnet[]>([]);
  const [pin, setPinState] = useState<string | null | undefined>(undefined);
  const [unlocked, setUnlocked] = useState(false);
  const [code, setCode] = useState("");
  const [add, setAdd] = useState(false);
  const [pinModal, setPinModal] = useState(false);
  const [newPin, setNewPin] = useState("");
  const [custom, setCustom] = useState<{ title: string; emoji: string } | null>(null);

  useEffect(() => { getPin().then((p) => { setPinState(p); setUnlocked(!p); }); }, []);
  useFocusEffect(useCallback(() => { loadCarnets().then(setCarnets); }, []));

  async function addType(id: string) {
    const t = typeOf(id);
    if (id === "libre") { setAdd(false); setCustom({ title: "", emoji: "✏️" }); return; }
    if (carnets.some((c) => c.type === id)) { setAdd(false); return Alert.alert("Déjà ajouté", "Ce carnet est déjà dans Mon Carnet."); }
    const next = [...carnets, { id: String(Date.now()), type: id, title: t.title, emoji: t.emoji, entries: [] }];
    await saveCarnets(next); setCarnets(next); setAdd(false);
  }
  async function addCustom() {
    if (!custom || custom.title.trim().length < 2) return Alert.alert("Nom du carnet", "Écris un nom pour ton carnet.");
    const next = [...carnets, { id: String(Date.now()), type: "libre", title: custom.title.trim(), emoji: custom.emoji || "✏️", entries: [] }];
    await saveCarnets(next); setCarnets(next); setCustom(null);
  }

  if (pin === undefined) return <View style={s.c} />;
  if (!unlocked) return (
    <View style={[s.c, s.lock]}>
      <Text style={{ fontSize: 48 }}>🔒</Text>
      <Text style={s.h}>Mon Carnet est verrouillé</Text>
      <TextInput style={s.pin} value={code} onChangeText={(v) => { setCode(v); if (v === pin) setUnlocked(true); }} keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="••••" />
      <Text style={s.small}>Écris ton code à 4 chiffres.</Text>
    </View>);

  const groups: [string, string][] = [["moi", "Pour moi"], ["maman", "Pour les jeunes mamans 🤱"], ["autre", "Autre"]];
  return (
    <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={s.title}>Mon Carnet 📒</Text>
      <Text style={s.small}>Tout reste sur ton téléphone. Personne d'autre ne le voit, même pas nous.</Text>
      <TouchableOpacity style={s.lockBtn} onPress={() => setPinModal(true)}><Text style={s.lockT}>{pin ? "🔒 Changer ou retirer mon code" : "🔓 Mettre un code secret"}</Text></TouchableOpacity>
      {carnets.length === 0 && <Text style={[s.small, { marginVertical: 20, textAlign: "center" }]}>Tu n'as pas encore de carnet. Appuie sur « Ajouter un carnet ».</Text>}
      {carnets.map((c) => (
        <TouchableOpacity key={c.id} style={s.card} onPress={() => navigation.navigate("Carnet", { id: c.id })}>
          <Text style={{ fontSize: 30 }}>{c.emoji}</Text>
          <View style={{ flex: 1, marginLeft: 12 }}><Text style={s.cardT}>{c.title}</Text><Text style={s.small}>{c.entries.length} page{c.entries.length > 1 ? "s" : ""}</Text></View>
          <Text style={{ color: colors.rose, fontSize: 20 }}>›</Text>
        </TouchableOpacity>))}
      <TouchableOpacity style={s.add} onPress={() => setAdd(true)}><Text style={s.addT}>＋ Ajouter un carnet</Text></TouchableOpacity>

      <Modal visible={add} animationType="slide" transparent onRequestClose={() => setAdd(false)}>
        <KeyboardTapDismiss style={s.back}><Backdrop onClose={() => setAdd(false)} /><View style={s.sheet}><ScrollView>
          <Text style={s.h}>Quel carnet veux-tu ?</Text>
          {groups.map(([g, label]) => (<View key={g}><Text style={s.group}>{label}</Text>
            {TYPES.filter((t) => t.group === g).map((t) => (
              <TouchableOpacity key={t.id} style={s.card} onPress={() => addType(t.id)}><Text style={{ fontSize: 26 }}>{t.emoji}</Text><View style={{ flex: 1, marginLeft: 12 }}><Text style={s.cardT}>{t.title}</Text><Text style={s.small}>{t.about}</Text></View></TouchableOpacity>))}
          </View>))}
          <TouchableOpacity onPress={() => setAdd(false)}><Text style={[s.small, { textAlign: "center", marginTop: 12 }]}>Fermer</Text></TouchableOpacity>
        </ScrollView></View></KeyboardTapDismiss>
      </Modal>

      <Modal visible={!!custom} animationType="fade" transparent onRequestClose={() => setCustom(null)}>
        <KeyboardTapDismiss style={s.back}><Backdrop onClose={() => setCustom(null)} /><View style={s.sheet}>
          <Text style={s.h}>Mon propre carnet</Text>
          <TextInput style={s.in} value={custom?.title} onChangeText={(v) => setCustom({ ...custom!, title: v })} placeholder="Nom (ex. Mes recettes)" />
          <TextInput style={s.in} value={custom?.emoji} onChangeText={(v) => setCustom({ ...custom!, emoji: v })} placeholder="Un emoji" maxLength={4} />
          <TouchableOpacity style={s.add} onPress={addCustom}><Text style={s.addT}>Créer</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setCustom(null)}><Text style={[s.small, { textAlign: "center", marginTop: 10 }]}>Annuler</Text></TouchableOpacity>
        </View></KeyboardTapDismiss>
      </Modal>

      <Modal visible={pinModal} animationType="fade" transparent onRequestClose={() => setPinModal(false)}>
        <KeyboardTapDismiss style={s.back}><Backdrop onClose={() => setPinModal(false)} /><View style={s.sheet}>
          <Text style={s.h}>Code secret à 4 chiffres</Text>
          <Text style={s.small}>Si tu oublies ce code, il faudra retirer l'appli : tes carnets seront perdus. Choisis un code facile à retenir pour toi.</Text>
          <TextInput style={s.pin} value={newPin} onChangeText={setNewPin} keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="••••" />
          <TouchableOpacity style={s.add} onPress={async () => { if (!/^\d{4}$/.test(newPin)) return Alert.alert("Code", "4 chiffres exactement."); await setPin(newPin); setPinState(newPin); setNewPin(""); setPinModal(false); }}><Text style={s.addT}>Enregistrer le code</Text></TouchableOpacity>
          {pin ? <TouchableOpacity onPress={async () => { await setPin(null); setPinState(null); setPinModal(false); }}><Text style={[s.small, { textAlign: "center", marginTop: 12, color: colors.danger }]}>Retirer le code</Text></TouchableOpacity> : null}
          <TouchableOpacity onPress={() => setPinModal(false)}><Text style={[s.small, { textAlign: "center", marginTop: 10 }]}>Fermer</Text></TouchableOpacity>
        </View></KeyboardTapDismiss>
      </Modal>
    </ScrollView>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background }, lock: { alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 24, fontWeight: "800", color: colors.prune }, h: { fontSize: 18, fontWeight: "800", color: colors.prune, marginVertical: 8 },
  small: { fontSize: 12, color: "#6E5C68", lineHeight: 17 }, group: { fontWeight: "800", color: colors.prune, marginTop: 14, marginBottom: 4 },
  card: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 18, padding: 14, marginTop: 10 }, cardT: { fontWeight: "700", color: colors.text, fontSize: 15 },
  add: { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 14, alignItems: "center", marginTop: 16 }, addT: { color: "#fff", fontWeight: "800", fontSize: 15 },
  lockBtn: { alignSelf: "flex-start", marginTop: 10, backgroundColor: "#FFF1CC", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 }, lockT: { fontSize: 12, fontWeight: "700", color: colors.prune },
  back: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }, sheet: { backgroundColor: colors.background, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: "85%" },
  in: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#E8D9E2", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginTop: 10 },
  pin: { backgroundColor: "#fff", borderRadius: 14, fontSize: 28, letterSpacing: 12, textAlign: "center", paddingVertical: 10, marginVertical: 14, minWidth: 160 },
});
