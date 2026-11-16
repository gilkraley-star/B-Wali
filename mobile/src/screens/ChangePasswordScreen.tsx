import React, { useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { apiRequest, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { colors, spacing } from "../theme/colors";
import { ErrorText, FieldLabel, PrimaryButton, ScreenTitle, TextInput } from "../theme/ui";

/** Écran obligatoire à la première connexion d'un compte créé par l'administration. */
export default function ChangePasswordScreen() {
  const { refreshUser, logout } = useAuth();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (next !== again) return setError("Les deux mots de passe ne sont pas identiques.");
    setLoading(true);
    try {
      await apiRequest("/auth/change-password", { method: "POST", body: { currentPassword: current, newPassword: next } });
      await refreshUser();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.c} contentContainerStyle={{ padding: spacing.lg, paddingTop: 60 }}>
      <ScreenTitle>Choisis ton mot de passe</ScreenTitle>
      <Text style={styles.t}>Ton compte a été créé par l'équipe Bê Wali. Remplace le mot de passe provisoire par un mot de passe que toi seule connais (8 caractères minimum).</Text>
      <FieldLabel>Mot de passe provisoire</FieldLabel>
      <TextInput secureTextEntry value={current} onChangeText={setCurrent} autoCapitalize="none" />
      <FieldLabel>Nouveau mot de passe</FieldLabel>
      <TextInput secureTextEntry value={next} onChangeText={setNext} autoCapitalize="none" />
      <FieldLabel>Répète le nouveau mot de passe</FieldLabel>
      <TextInput secureTextEntry value={again} onChangeText={setAgain} autoCapitalize="none" />
      <ErrorText>{error}</ErrorText>
      <PrimaryButton title="Enregistrer" onPress={submit} loading={loading} />
      <PrimaryButton title="Me déconnecter" variant="secondary" onPress={logout} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  t: { color: colors.text, marginBottom: spacing.md, lineHeight: 20 },
});
