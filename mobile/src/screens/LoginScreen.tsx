import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { colors, spacing } from "../theme/colors";
import { ErrorText, FieldLabel, PrimaryButton, ScreenTitle, TextInput } from "../theme/ui";
import { ApiError } from "../api/client";

export default function LoginScreen({ navigation }: any) {
  const { t } = useI18n();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle>{t("login")}</ScreenTitle>

        <FieldLabel>Numéro de téléphone ou e-mail</FieldLabel>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="70 12 34 56" />

        <FieldLabel>{t("password")}</FieldLabel>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry />

        <ErrorText>{error}</ErrorText>

        <PrimaryButton title={t("login")} onPress={handleLogin} loading={loading} />
        <PrimaryButton title={t("signup")} variant="secondary" onPress={() => navigation.navigate("Signup")} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
});
