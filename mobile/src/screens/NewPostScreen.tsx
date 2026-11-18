import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Keyboard, Modal, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { themeIcon } from "./ForumScreen";
import { apiRequest, ApiError } from "../api/client";
import { useI18n } from "../i18n";
import { colors, spacing } from "../theme/colors";
import { ErrorText, FieldLabel, PrimaryButton, ScreenTitle, TextInput } from "../theme/ui";

export default function NewPostScreen({ route, navigation }: any) {
  const [categoryId, setCategoryId] = useState<string | null>(route.params?.categoryId || null);
  const [cats, setCats] = useState<any[]>([]);
  const [catsError, setCatsError] = useState<string | null>(null);
  const [catsLoading, setCatsLoading] = useState(true);
  const loadCats = useCallback(() => {
    setCatsLoading(true); setCatsError(null);
    apiRequest<any[]>("/forum/categories")
      .then((r) => { setCats(r); setCatsLoading(false); })
      .catch((e) => { setCatsLoading(false); setCatsError(e instanceof ApiError ? e.message : "Impossible de charger les thèmes. Vérifie ta connexion."); });
  }, []);
  useFocusEffect(loadCats);
  const parents = cats.filter((c) => !c.parentId);
  const [pick, setPick] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const chosen: any = (() => { const c = cats.find((x) => x.id === categoryId); return c ? { ...c, parent: c.parentId ? cats.find((x) => x.id === c.parentId) : null } : null; })();
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setError(null);
    if (!categoryId) return setError("Choisis d’abord un thème.");
    setLoading(true);
    try {
      const created = await apiRequest<{ id: string }>("/forum/posts", { method: "POST", body: { categoryId, title, body } });
      navigation.replace("Thread", { postId: created.id });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg }}>
        <ScreenTitle>{t("forum_new_post")}</ScreenTitle>
        <Text style={styles.notice}>{t("forum_pending_note")}</Text>

        <FieldLabel>Thème</FieldLabel>
        <TouchableOpacity style={styles.field} activeOpacity={0.85} onPress={() => { Keyboard.dismiss(); setPick(true); }} accessibilityRole="button">
          <Text style={[styles.fieldT, !chosen && { color: "#A78" }]} numberOfLines={1}>{chosen ? `${themeIcon(chosen.parent || chosen)}  ${chosen.parent ? chosen.parent.titleFr + " › " : ""}${chosen.titleFr}` : "Choisir un thème"}</Text>
          <Text style={{ color: "#C24B6A", fontSize: 16 }}>▾</Text>
        </TouchableOpacity>
        <Modal visible={pick} transparent animationType="slide" onRequestClose={() => setPick(false)}>
          <View style={styles.back}>
            <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setPick(false)} />
            <View style={styles.sheet}>
              <Text style={styles.sheetT}>Dans quel thème ?</Text>
              <ScrollView style={{ maxHeight: 460 }}>
                {parents.map((p) => (
                  <TouchableOpacity key={p.id} style={styles.row} activeOpacity={0.8} onPress={() => { setCategoryId(p.id); setPick(false); }}>
                    <Text style={{ fontSize: 22 }}>{themeIcon(p)}</Text>
                    <Text style={styles.rowT}>{p.titleFr}</Text>
                    <Text style={{ color: "#C24B6A", fontSize: 15 }}>{categoryId === p.id ? "✓" : ""}</Text>
                  </TouchableOpacity>))}
                {catsError ? (
                  <View style={{ padding: 14, alignItems: "center" }}>
                    <Text style={{ color: colors.danger, textAlign: "center", marginBottom: 10 }}>{catsError}</Text>
                    <PrimaryButton title="Réessayer" onPress={loadCats} />
                  </View>
                ) : catsLoading ? (
                  <Text style={{ color: "#5B4852", padding: 14 }}>Chargement des thèmes…</Text>
                ) : !parents.length ? (
                  <View style={{ padding: 14, alignItems: "center" }}>
                    <Text style={{ color: "#5B4852", textAlign: "center", marginBottom: 10 }}>Aucun thème pour l'instant.</Text>
                    <PrimaryButton title="Réessayer" onPress={loadCats} />
                  </View>
                ) : null}
              </ScrollView>
            </View>
          </View>
        </Modal>

        <FieldLabel>{t("forum_post_title")}</FieldLabel>
        <TextInput value={title} onChangeText={setTitle} />

        <FieldLabel>{t("forum_post_body")}</FieldLabel>
        <TextInput value={body} onChangeText={setBody} multiline numberOfLines={6} style={{ minHeight: 120, textAlignVertical: "top" }} />

        <ErrorText>{error}</ErrorText>

        <PrimaryButton title={t("forum_publish")} onPress={handlePublish} loading={loading} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  field: { backgroundColor: "#fff", borderRadius: 14, borderWidth: 1, borderColor: "#F2D3DA", paddingHorizontal: 14, paddingVertical: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }, fieldT: { color: "#3B1D33", fontWeight: "600", fontSize: 15, flex: 1 },
  back: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }, sheet: { backgroundColor: "#FFF6F0", borderTopLeftRadius: 26, borderTopRightRadius: 26, padding: 18, paddingBottom: 28 }, sheetT: { fontWeight: "800", fontSize: 17, color: "#3B1D33", marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#fff", borderRadius: 16, paddingVertical: 14, paddingHorizontal: 14, marginBottom: 8 }, rowT: { flex: 1, fontWeight: "700", color: "#3B1D33", fontSize: 15 },
  sub: { paddingVertical: 12, paddingHorizontal: 18, marginLeft: 22, marginBottom: 4, borderLeftWidth: 2, borderLeftColor: "#F2D3DA" }, subT: { color: "#5B4852", fontSize: 14.5 },
  pt: { color: colors.prune, fontWeight: "700", marginBottom: 6 }, wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#F2D3DA" }, chipOn: { backgroundColor: colors.rose, borderColor: colors.rose }, chipT: { color: colors.prune, fontWeight: "600", fontSize: 13 },
  notice: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.md, fontStyle: "italic" },
});
