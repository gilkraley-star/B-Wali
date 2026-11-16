import React, { useEffect, useState } from "react";
import { setSoundsEnabled, soundsEnabled } from "../games/sounds";
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { apiOrigin, apiRequest, setToken } from "../api/client";
import { colors, radius, spacing } from "../theme/colors";
import { Card, PrimaryButton, ScreenTitle } from "../theme/ui";

export default function SettingsScreen() {
  const { t, lang, setLang } = useI18n();
  const { user, logout, refreshUser } = useAuth();
  const [participatesForum, setParticipatesForum] = useState(user?.participatesForum ?? true);
  const [saving, setSaving] = useState(false);
  const [sounds, setSounds] = useState(true);
  useEffect(() => { soundsEnabled().then(setSounds); }, []);

  const toggleForumParticipation = async (value: boolean) => {
    setParticipatesForum(value);
    setSaving(true);
    try {
      await apiRequest("/auth/privacy", { method: "PATCH", body: { participatesForum: value } });
      await refreshUser();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(t("settings_delete_account"), t("settings_delete_confirm"), [
      { text: t("cancel"), style: "cancel" },
      {
        text: t("confirm"),
        style: "destructive",
        onPress: async () => {
          await apiRequest("/auth/account", { method: "DELETE" });
          await setToken(null);
          await logout();
        },
      },
    ]);
  };

  const [server, setServer] = useState<"…" | "ok" | "ko">("…");
  useEffect(() => { fetch(apiOrigin + "/api/health").then((r) => setServer(r.ok ? "ok" : "ko")).catch(() => setServer("ko")); }, []);
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <ScreenTitle>{t("settings_title")}</ScreenTitle>

      <Card>
        <Text style={styles.sectionTitle}>{user?.pseudonyme}</Text>
        <Text style={styles.muted}>{user?.ageBracket}</Text>
      </Card>

      <Text style={styles.sectionHeader}>{t("settings_language")}</Text>
      <Card style={{ flexDirection: "row", gap: spacing.sm }}>
        <TouchableOpacity
          style={[styles.langButton, lang === "fr" && styles.langButtonActive]}
          onPress={() => setLang("fr")}
        >
          <Text style={lang === "fr" ? styles.langTextActive : styles.langText}>Français</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.langButton, lang === "en" && styles.langButtonActive]}
          onPress={() => setLang("en")}
        >
          <Text style={lang === "en" ? styles.langTextActive : styles.langText}>English</Text>
        </TouchableOpacity>
      </Card>

      <Text style={styles.sectionHeader}>Sons</Text>
      <Card>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>🔊 Sons des jeux</Text>
          <Switch value={sounds} onValueChange={(v) => { setSounds(v); setSoundsEnabled(v); }} trackColor={{ true: colors.rose }} />
        </View>
      </Card>

      <Text style={styles.sectionHeader}>{t("settings_privacy")}</Text>
      <Card>
        <View style={styles.row}>
          <Text style={styles.rowLabel}>{t("settings_participate_forum")}</Text>
          <Switch value={participatesForum} onValueChange={toggleForumParticipation} disabled={saving} trackColor={{ true: colors.rose }} />
        </View>
      </Card>

      <PrimaryButton title={t("logout")} variant="secondary" onPress={logout} />
      <PrimaryButton title={t("settings_delete_account")} variant="danger" onPress={handleDeleteAccount} />
      <Text style={{ textAlign: "center", color: "#8C7A86", fontSize: 11.5, marginTop: 14, marginBottom: 6 }}>
        {server === "ok" ? "✅ Connectée au serveur" : server === "ko" ? "⚠️ Serveur injoignable (mode hors ligne)" : "Connexion…"}
        {user?.pending ? " · compte pas encore créé en ligne" : ""}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: colors.prune },
  muted: { color: colors.textMuted, marginTop: 2 },
  sectionHeader: { fontSize: 14, color: colors.textMuted, marginTop: spacing.md, marginBottom: spacing.xs, textTransform: "uppercase" },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowLabel: { flex: 1, color: colors.text, fontSize: 15, marginRight: spacing.sm },
  langButton: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  langButtonActive: { backgroundColor: colors.rose, borderColor: colors.rose },
  langText: { color: colors.text },
  langTextActive: { color: "#fff", fontWeight: "600" },
});
