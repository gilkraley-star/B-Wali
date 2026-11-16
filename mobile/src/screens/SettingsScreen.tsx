import React, { useEffect, useState } from "react";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { setSoundsEnabled, soundsEnabled } from "../games/sounds";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { apiOrigin, apiRequest, setToken } from "../api/client";
import { remindersEnabled, setReminders } from "../notifications";
import SosChip from "../components/SosChip";
import { FadeUp } from "../components/anim";

// Réglages (maquette) : profil, invitation, langue, confidentialité, déconnexion, suppression du compte.
const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
function ageOf(iso: string) { const b = new Date(iso), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; return a; }

function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={s.tog}>
      <View style={{ flex: 1 }}><Text style={s.togT}>{label}</Text>{hint ? <Text style={s.togH}>{hint}</Text> : null}</View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: "#E5D9DD", true: "#FF5470" }} thumbColor="#fff" />
    </View>
  );
}

export default function SettingsScreen({ navigation }: any) {
  const { t, lang, setLang } = useI18n();
  const { user, logout, refreshUser } = useAuth();
  const u: any = user;
  const [forum, setForum] = useState(u?.participatesForum ?? true);
  const [anon, setAnon] = useState(u?.anonymousDefault ?? false);
  const [remind, setRemind] = useState(false);
  const [sounds, setSounds] = useState(true);
  const [server, setServer] = useState<"…" | "ok" | "ko">("…");
  useEffect(() => { soundsEnabled().then(setSounds); remindersEnabled().then(setRemind); refreshUser().catch(() => {}); }, []);
  useEffect(() => { fetch(apiOrigin + "/api/health").then((r) => setServer(r.ok ? "ok" : "ko")).catch(() => setServer("ko")); }, []);

  const privacy = async (patch: any) => { try { await apiRequest("/auth/privacy", { method: "PATCH", body: patch, silent: true }); await refreshUser(); } catch { /* hors ligne : réessayer plus tard */ } };
  const toggleRemind = async (v: boolean) => {
    setRemind(v);
    const ok = await setReminders(v);
    if (v && !ok) { setRemind(false); await setReminders(false); Alert.alert("Rappels", "Autorise les notifications de Wali dans les réglages du téléphone pour recevoir les rappels."); }
  };
  const deleteAccount = () => Alert.alert(t("settings_delete_account"), t("settings_delete_confirm"), [
    { text: t("cancel"), style: "cancel" },
    { text: t("confirm"), style: "destructive", onPress: async () => { await apiRequest("/auth/account", { method: "DELETE" }); await setToken(null); await logout(); } },
  ]);

  const initials = (u?.pseudonyme || "?").replace(/[^A-Za-zÀ-ÿ]/g, "").slice(0, 2).toUpperCase();
  const born = u?.birthDate ? new Date(u.birthDate) : null;

  return (
    <View style={s.screen}>
      <View style={[s.blob, { top: -70, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: "#FFD6DD", opacity: 0.6 }]} />
      <View style={[s.blob, { top: 360, left: -90, width: 170, height: 170, borderRadius: 85, backgroundColor: "#FFE9A8", opacity: 0.45 }]} />
      <SosChip navigation={navigation} />
      <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 24, paddingBottom: 30 }} showsVerticalScrollIndicator={false}>
        <FadeUp><Text style={s.h1}>{t("settings_title")}</Text></FadeUp>

        <FadeUp delay={60}>
          <View style={s.card}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
              <View style={s.av}><Text style={s.avT}>{initials}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={s.name} numberOfLines={1}>{u?.pseudonyme}</Text>
                {born ? <Text style={s.sub}>Née le {born.getUTCDate()} {MONTHS[born.getUTCMonth()]} {born.getUTCFullYear()} · {ageOf(u.birthDate)} ans</Text> : <Text style={s.sub}>{u?.ageBracket === "ADOLESCENTE" ? "Adolescente" : u?.ageBracket === "JEUNE_FEMME" ? "Jeune femme" : "Femme"}</Text>}
              </View>
            </View>
            <Text style={s.note}>Ta date de naissance ne se change pas toute seule. Si elle est fausse, écris à l'équipe : elle la corrige après vérification.</Text>
          </View>
        </FadeUp>

        <FadeUp delay={100}>
          <TouchableOpacity style={s.invite} onPress={() => navigation.navigate("Partager")} activeOpacity={0.85}>
            <Text style={{ fontSize: 22 }}>💌</Text><Text style={s.inviteT}>Inviter une amie (lien, QR, WhatsApp)</Text><Text style={{ color: "#1E5B3E", fontSize: 20 }}>›</Text>
          </TouchableOpacity>
        </FadeUp>

        <Text style={s.sec}>LANGUE</Text>
        <View style={s.seg}>
          {([["fr", "Français"], ["en", "English"]] as const).map(([k, l]) => (
            <TouchableOpacity key={k} style={[s.segB, lang === k && s.segOn]} onPress={() => setLang(k)} activeOpacity={0.85}>
              <Text style={[s.segT, lang === k && { color: "#fff" }]}>{l}</Text>
            </TouchableOpacity>))}
        </View>

        <Text style={s.sec}>CONFIDENTIALITÉ</Text>
        <Toggle label="Participer à la communauté" hint="Si tu éteins, tu peux lire sans que ton pseudo apparaisse." value={forum} onChange={(v) => { setForum(v); privacy({ participatesForum: v }); }} />
        <Toggle label="Écrire en anonyme par défaut" hint="Dans les forums seulement : le direct reste à visage découvert." value={anon} onChange={(v) => { setAnon(v); privacy({ anonymousDefault: v }); }} />
        <Toggle label="Rappels de règles sur mon téléphone" hint="Notification discrète, sans le mot « règles »." value={remind} onChange={toggleRemind} />
        <Toggle label="🔊 Sons des jeux" value={sounds} onChange={(v) => { setSounds(v); setSoundsEnabled(v); }} />

        <TouchableOpacity style={s.ghost} onPress={logout} activeOpacity={0.85}><Text style={s.ghostT}>{t("logout")}</Text></TouchableOpacity>
        <TouchableOpacity activeOpacity={0.9} onPress={deleteAccount}>
          <LinearGradient colors={["#C23B3B", "#A82E2E"]} style={s.del}><Text style={s.delT}>{t("settings_delete_account")}</Text></LinearGradient>
        </TouchableOpacity>
        <Text style={s.warn}>Supprimer ton compte efface aussi ton cycle, ton journal privé et tes messages. C'est définitif.</Text>
        <Text style={s.srv}>{server === "ok" ? "✅ Connectée au serveur" : server === "ko" ? "⚠️ Serveur injoignable (mode hors ligne)" : "Connexion…"}{u?.pending ? " · compte pas encore créé en ligne" : ""}</Text>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFF6F0", overflow: "hidden" }, blob: { position: "absolute" },
  h1: { fontFamily: "Poppins_800ExtraBold", fontSize: 24, color: "#3B1D33", marginBottom: 14 },
  card: { backgroundColor: "#fff", borderRadius: 24, padding: 16, shadowColor: "#3B1D33", shadowOpacity: 0.06, shadowRadius: 10, elevation: 2 },
  av: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#FF5470", alignItems: "center", justifyContent: "center" }, avT: { color: "#fff", fontFamily: "Poppins_700Bold", fontSize: 18 },
  name: { fontFamily: "Poppins_700Bold", fontSize: 18, color: "#3B1D33" }, sub: { color: "#8C7A86", marginTop: 2, fontSize: 13 },
  note: { color: "#6E5C68", fontSize: 12.5, lineHeight: 18, marginTop: 12 },
  invite: { backgroundColor: "#C9F0DC", borderRadius: 999, paddingVertical: 15, paddingHorizontal: 18, flexDirection: "row", alignItems: "center", gap: 12, marginTop: 14 }, inviteT: { flex: 1, color: "#1E5B3E", fontFamily: "Inter_700Bold", fontSize: 14 },
  sec: { color: "#8C7A86", fontFamily: "Inter_700Bold", fontSize: 12.5, letterSpacing: 0.6, marginTop: 22, marginBottom: 8, marginLeft: 4 },
  seg: { backgroundColor: "#fff", borderRadius: 999, padding: 6, flexDirection: "row" }, segB: { flex: 1, paddingVertical: 12, borderRadius: 999, alignItems: "center" }, segOn: { backgroundColor: "#FF5470" }, segT: { fontFamily: "Inter_700Bold", color: "#3B1D33", fontSize: 14 },
  tog: { backgroundColor: "#fff", borderRadius: 22, padding: 16, marginBottom: 10, flexDirection: "row", alignItems: "center", gap: 12 }, togT: { fontFamily: "Inter_600SemiBold", color: "#3B1D33", fontSize: 15 }, togH: { color: "#8C7A86", fontSize: 12.5, lineHeight: 18, marginTop: 3 },
  ghost: { borderWidth: 1.5, borderColor: "#FF8FA3", borderRadius: 999, paddingVertical: 15, alignItems: "center", marginTop: 14, backgroundColor: "#fff" }, ghostT: { color: "#C23B3B", fontFamily: "Inter_700Bold", fontSize: 15 },
  del: { borderRadius: 999, paddingVertical: 16, alignItems: "center", marginTop: 10 }, delT: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 15 },
  warn: { color: "#8C7A86", fontSize: 12, textAlign: "center", lineHeight: 17, marginTop: 10 }, srv: { textAlign: "center", color: "#8C7A86", fontSize: 11.5, marginTop: 16 },
});
