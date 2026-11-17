import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { themeIcon } from "./ForumScreen";
import { apiRequest, ApiError } from "../api/client";
import { useI18n } from "../i18n";
import { colors, spacing } from "../theme/colors";
import { ErrorText, FieldLabel, PrimaryButton, ScreenTitle, TextInput } from "../theme/ui";

export default function NewPostScreen({ route, navigation }: any) {
  const [categoryId, setCategoryId] = useState<string | null>(route.params?.categoryId || null);
  const [cats, setCats] = useState<any[]>([]);
  useFocusEffect(useCallback(() => { apiRequest<any[]>("/forum/categories").then(setCats).catch(() => {}); }, []));
  const parents = cats.filter((c) => !c.parentId);
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
      await apiRequest("/forum/posts", { method: "POST", body: { categoryId, title, body } });
      navigation.goBack();
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
        {parents.map((p) => {
          const subs = cats.filter((c) => c.parentId === p.id);
          return (
            <View key={p.id} style={{ marginBottom: 8 }}>
              <Text style={styles.pt}>{themeIcon(p)}  {p.titleFr}</Text>
              <View style={styles.wrap}>
                {subs.map((c) => (
                  <TouchableOpacity key={c.id} onPress={() => setCategoryId(c.id)} style={[styles.chip, categoryId === c.id && styles.chipOn]}>
                    <Text style={[styles.chipT, categoryId === c.id && { color: "#fff" }]}>{c.titleFr}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}

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
  pt: { color: colors.prune, fontWeight: "700", marginBottom: 6 }, wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: "#F2D3DA" }, chipOn: { backgroundColor: colors.rose, borderColor: colors.rose }, chipT: { color: colors.prune, fontWeight: "600", fontSize: 13 },
  notice: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.md, fontStyle: "italic" },
});
