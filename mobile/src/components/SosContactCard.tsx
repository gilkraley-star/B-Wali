import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { getTrusted, setTrusted } from "../sos";

import { Switch } from "react-native";
import { AppState } from "react-native";
import { bubbleCanDraw, bubbleEnabled, bubbleRequestPermission, bubbleSupported, setBubbleEnabled } from "../bubble";

export function BubbleToggle() {
  const [on, setOn] = useState(false);
  useEffect(() => { bubbleEnabled().then(setOn); const sub = AppState.addEventListener("change", (st) => { if (st === "active") bubbleEnabled().then(setOn); }); return () => sub.remove(); }, []);
  if (!bubbleSupported()) return null;
  const flip = async (v: boolean) => {
    if (v && !bubbleCanDraw()) { Alert.alert("Une autorisation est nécessaire", "Android va ouvrir un écran : active « Afficher par-dessus les autres applications » pour Wali, puis reviens ici et active la bulle.", [{ text: "Annuler" }, { text: "Ouvrir", onPress: bubbleRequestPermission }]); return; }
    await setBubbleEnabled(v); setOn(v);
  };
  return (
    <View style={[s.card, { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 }]}>
      <View style={{ flex: 1 }}>
        <Text style={[s.t, { color: "#3A2030" }]}>🫧 Bulle flottante</Text>
        <Text style={s.d}>Quand tu quittes Wali, son icône reste en petite bulle sur l'écran : un appui rouvre Wali, tu peux la déplacer. Désactivée par défaut, car elle se voit si quelqu'un regarde ton téléphone.</Text>
      </View>
      <Switch value={on} onValueChange={flip} trackColor={{ true: "#FF5470" }} />
    </View>
  );
}

export default function SosContactCard() {
  const [name, setName] = useState(""); const [phone, setPhone] = useState(""); const [saved, setSaved] = useState(false);
  useEffect(() => { getTrusted().then((c) => { if (c) { setName(c.name); setPhone(c.phone); setSaved(true); } }); }, []);
  const save = async () => {
    const p = phone.replace(/[^\d+]/g, "");
    if (p.replace(/\D/g, "").length < 8) return Alert.alert("Numéro", "Écris le numéro complet, avec l'indicatif (ex. +236 …).");
    await setTrusted({ name: name.trim() || "Ma personne de confiance", phone: p }); setSaved(true); Alert.alert("C'est enregistré", "Appuie 3 fois vite sur SOS : un SMS prêt à partir, avec ta position, s'ouvre vers cette personne.");
  };
  const remove = async () => { await setTrusted(null); setName(""); setPhone(""); setSaved(false); };
  return (
    <View style={s.card}>
      <Text style={s.t}>🆘 Personne de confiance</Text>
      <Text style={s.d}>En danger ? Appuie 3 fois vite sur le bouton SOS : un SMS « SOS, je suis en danger » avec ta position s'ouvre vers cette personne (maman, sœur, tante…). Il ne te reste qu'à appuyer sur Envoyer. Ce numéro reste sur ton téléphone.</Text>
      <TextInput style={s.in} placeholder="Son prénom (ex. Maman)" placeholderTextColor="#A78" value={name} onChangeText={(v) => { setName(v); setSaved(false); }} />
      <TextInput style={s.in} placeholder="Son numéro (+236 …)" placeholderTextColor="#A78" keyboardType="phone-pad" value={phone} onChangeText={(v) => { setPhone(v); setSaved(false); }} />
      <View style={{ flexDirection: "row", gap: 10 }}>
        <TouchableOpacity style={[s.b, saved && { backgroundColor: "#7BC8A4" }]} onPress={save}><Text style={s.bt}>{saved ? "✓ Enregistré" : "Enregistrer"}</Text></TouchableOpacity>
        {saved ? <TouchableOpacity style={s.b2} onPress={remove}><Text style={{ color: "#C23B3B", fontWeight: "700" }}>Retirer</Text></TouchableOpacity> : null}
      </View>
    </View>
  );
}
const s = StyleSheet.create({
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 16, borderWidth: 1, borderColor: "#F6D5D5", marginBottom: 6 },
  t: { fontWeight: "800", color: "#C23B3B", fontSize: 15.5, marginBottom: 6 }, d: { color: "#5B4852", lineHeight: 19, fontSize: 13, marginBottom: 10 },
  in: { backgroundColor: "#FFF7F5", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 11, marginBottom: 8, color: "#3A2030", fontSize: 15 },
  b: { backgroundColor: "#C23B3B", borderRadius: 999, paddingVertical: 11, paddingHorizontal: 22 }, bt: { color: "#fff", fontWeight: "700" }, b2: { paddingVertical: 11, paddingHorizontal: 14 },
});
