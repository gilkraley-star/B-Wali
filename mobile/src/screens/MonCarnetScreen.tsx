import { KeyboardTapDismiss, Backdrop } from "../theme/kb";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { colors, spacing } from "../theme/colors";
import { Carnet, TYPES, getPin, loadCarnets, saveCarnets, setPin, typeOf } from "../storage/carnets";
import { useI18n } from "../i18n";

export default function MonCarnetScreen({ navigation }: any) {
  const { t } = useI18n();
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
    const ty = typeOf(id);
    if (id === "libre") { setAdd(false); setCustom({ title: "", emoji: "✏️" }); return; }
    if (carnets.some((c) => c.type === id)) { setAdd(false); return Alert.alert(t("carnet_already_added_title"), t("carnet_already_added")); }
    const next = [...carnets, { id: String(Date.now()), type: id, title: ty.title, emoji: ty.emoji, entries: [] }];
    await saveCarnets(next); setCarnets(next); setAdd(false);
  }
  async function addCustom() {
    if (!custom || custom.title.trim().length < 2) return Alert.alert(t("carnet_name_title"), t("carnet_name_hint"));
    const next = [...carnets, { id: String(Date.now()), type: "libre", title: custom.title.trim(), emoji: custom.emoji || "✏️", entries: [] }];
    await saveCarnets(next); setCarnets(next); setCustom(null);
  }

  if (pin === undefined) return <View style={s.c} />;
  if (!unlocked) return (
    <View style={[s.c, s.lock]}>
      <Text style={{ fontSize: 48 }}>🔒</Text>
      <Text style={s.h}>{t("carnet_locked_title")}</Text>
      <TextInput style={s.pin} value={code} onChangeText={(v) => { setCode(v); if (v === pin) setUnlocked(true); }} keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="••••" />
      <Text style={s.small}>{t("carnet_locked_hint")}</Text>
    </View>);

  const groups: [string, string][] = [["moi", t("carnet_group_me")], ["maman", t("carnet_group_mom")], ["autre", t("carnet_group_other")]];
  return (
    <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={s.title}>{t("carnet_title")}</Text>
      <Text style={s.small}>{t("carnet_privacy")}</Text>
      <TouchableOpacity style={s.lockBtn} onPress={() => setPinModal(true)}><Text style={s.lockT}>{pin ? t("carnet_change_code") : t("carnet_set_code")}</Text></TouchableOpacity>
      {carnets.length === 0 && <Text style={[s.small, { marginVertical: 20, textAlign: "center" }]}>{t("carnet_empty")}</Text>}
      {carnets.map((c) => (
        <TouchableOpacity key={c.id} style={s.card} onPress={() => navigation.navigate("Carnet", { id: c.id })}>
          <Text style={{ fontSize: 30 }}>{c.emoji}</Text>
          <View style={{ flex: 1, marginLeft: 12 }}><Text style={s.cardT}>{c.title}</Text><Text style={s.small}>{c.entries.length} {c.entries.length > 1 ? t("carnet_pages_plural") : t("carnet_pages")}</Text></View>
          <Text style={{ color: colors.rose, fontSize: 20 }}>›</Text>
        </TouchableOpacity>))}
      <TouchableOpacity style={s.add} onPress={() => setAdd(true)}><Text style={s.addT}>{t("carnet_add")}</Text></TouchableOpacity>

      <Modal visible={add} animationType="slide" transparent onRequestClose={() => setAdd(false)}>
        <KeyboardTapDismiss style={s.back}><Backdrop onClose={() => setAdd(false)} /><View style={s.sheet}><ScrollView>
          <Text style={s.h}>{t("carnet_which")}</Text>
          {groups.map(([g, label]) => (<View key={g}><Text style={s.group}>{label}</Text>
            {TYPES.filter((ty) => ty.group === g).map((ty) => (
              <TouchableOpacity key={ty.id} style={s.card} onPress={() => addType(ty.id)}><Text style={{ fontSize: 26 }}>{ty.emoji}</Text><View style={{ flex: 1, marginLeft: 12 }}><Text style={s.cardT}>{ty.title}</Text><Text style={s.small}>{ty.about}</Text></View></TouchableOpacity>))}
          </View>))}
          <TouchableOpacity onPress={() => setAdd(false)}><Text style={[s.small, { textAlign: "center", marginTop: 12 }]}>{t("carnet_close")}</Text></TouchableOpacity>
        </ScrollView></View></KeyboardTapDismiss>
      </Modal>

      <Modal visible={!!custom} animationType="fade" transparent onRequestClose={() => setCustom(null)}>
        <KeyboardTapDismiss style={s.back}><Backdrop onClose={() => setCustom(null)} /><View style={s.sheet}>
          <Text style={s.h}>{t("carnet_my_own")}</Text>
          <TextInput style={s.in} value={custom?.title} onChangeText={(v) => setCustom({ ...custom!, title: v })} placeholder={t("carnet_name_placeholder")} />
          <TextInput style={s.in} value={custom?.emoji} onChangeText={(v) => setCustom({ ...custom!, emoji: v })} placeholder={t("carnet_emoji_placeholder")} maxLength={4} />
          <TouchableOpacity style={s.add} onPress={addCustom}><Text style={s.addT}>{t("carnet_create")}</Text></TouchableOpacity>
          <TouchableOpacity onPress={() => setCustom(null)}><Text style={[s.small, { textAlign: "center", marginTop: 10 }]}>{t("carnet_cancel")}</Text></TouchableOpacity>
        </View></KeyboardTapDismiss>
      </Modal>

      <Modal visible={pinModal} animationType="fade" transparent onRequestClose={() => setPinModal(false)}>
        <KeyboardTapDismiss style={s.back}><Backdrop onClose={() => setPinModal(false)} /><View style={s.sheet}>
          <Text style={s.h}>{t("carnet_code_title")}</Text>
          <Text style={s.small}>{t("carnet_code_hint")}</Text>
          <TextInput style={s.pin} value={newPin} onChangeText={setNewPin} keyboardType="number-pad" secureTextEntry maxLength={4} placeholder="••••" />
          <TouchableOpacity style={s.add} onPress={async () => { if (!/^\d{4}$/.test(newPin)) return Alert.alert(t("carnet_code_title2"), t("carnet_code_digits")); await setPin(newPin); setPinState(newPin); setNewPin(""); setPinModal(false); }}><Text style={s.addT}>{t("carnet_save_code")}</Text></TouchableOpacity>
          {pin ? <TouchableOpacity onPress={async () => { await setPin(null); setPinState(null); setPinModal(false); }}><Text style={[s.small, { textAlign: "center", marginTop: 12, color: colors.danger }]}>{t("carnet_remove_code")}</Text></TouchableOpacity> : null}
          <TouchableOpacity onPress={() => setPinModal(false)}><Text style={[s.small, { textAlign: "center", marginTop: 10 }]}>{t("carnet_close")}</Text></TouchableOpacity>
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
