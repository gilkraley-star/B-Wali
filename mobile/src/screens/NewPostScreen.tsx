import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from "react-native";
import { apiRequest, ApiError } from "../api/client";
import { useI18n } from "../i18n";
import { colors, spacing } from "../theme/colors";
import { ErrorText, FieldLabel, PrimaryButton, ScreenTitle, TextInput } from "../theme/ui";

export default function NewPostScreen({ route, navigation }: any) {
  const { categoryId } = route.params;
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePublish = async () => {
    setError(null);
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
  notice: { color: colors.textMuted, fontSize: 13, marginBottom: spacing.md, fontStyle: "italic" },
});
