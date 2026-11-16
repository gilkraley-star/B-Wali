import React, { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { colors, radius, spacing } from "../theme/colors";
import { ErrorText, FieldLabel, PrimaryButton, ScreenTitle, TextInput } from "../theme/ui";
import { ApiError } from "../api/client";
import { TERMS_PARAGRAPHS, TERMS_TITLE } from "../i18n/terms";

export default function SignupScreen({ navigation }: any) {
  const { t } = useI18n();
  const { signup } = useAuth();

  const [photo, setPhoto] = useState<{ uri: string; dataUrl: string } | null>(null);
  const addPhoto = async (fromCamera: boolean) => {
    const perm = fromCamera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Autorisation nécessaire", fromCamera ? "Autorise la caméra pour prendre ta photo." : "Autorise l'accès à tes photos."); return; }
    const opts = { quality: 0.4, base64: true, exif: false, allowsEditing: true, aspect: [1, 1] as [number, number], mediaTypes: ImagePicker.MediaTypeOptions.Images };
    const r = fromCamera ? await ImagePicker.launchCameraAsync({ ...opts, cameraType: ImagePicker.CameraType.front }) : await ImagePicker.launchImageLibraryAsync(opts);
    if (r.canceled || !r.assets[0]?.base64) return;
    setPhoto({ uri: r.assets[0].uri, dataUrl: "data:image/jpeg;base64," + r.assets[0].base64 });
  };
  const [byPhone, setByPhone] = useState(true);
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [pseudonyme, setPseudonyme] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setError(null);
    const d = parseInt(day, 10), m = parseInt(month, 10), y = parseInt(year, 10);
    const thisYear = new Date().getFullYear();
    if (!d || !m || !y || d > 31 || m > 12 || year.length !== 4 || y < thisYear - 110 || y > thisYear) {
      setError("Écris ta date de naissance complète : jour, mois et année (4 chiffres).");
      return;
    }
    const birthDate = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    if (!photo) { setError("Ajoute ta photo pour continuer."); return; }
    if (!acceptTerms) {
      setError("Lis et accepte les conditions d'utilisation pour continuer.");
      return;
    }
    setLoading(true);
    try {
      await signup({ ...(byPhone ? { phone: contact } : { email: contact }), password, pseudonyme, birthDate, acceptTerms: true, photo: photo.dataUrl });
    } catch (e) {
      setError(e instanceof ApiError ? e.message : t("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <ScreenTitle>{t("signup")}</ScreenTitle>

        <FieldLabel>{byPhone ? "Ton numéro de téléphone" : "Ton e-mail"}</FieldLabel>
        <TextInput value={contact} onChangeText={setContact} autoCapitalize="none" keyboardType={byPhone ? "phone-pad" : "email-address"} placeholder={byPhone ? "70 12 34 56" : "nom@exemple.com"} />
        <Text style={{ color: colors.rose, fontWeight: "700", marginTop: 6 }} onPress={() => { setByPhone(!byPhone); setContact(""); }}>
          {byPhone ? "Je préfère utiliser un e-mail" : "Je n'ai pas d'e-mail : utiliser mon numéro"}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>Ton numéro reste privé. Personne ne le voit dans l'appli.</Text>

        <FieldLabel>Ta photo</FieldLabel>
        <Text style={{ color: colors.textMuted, fontSize: 12.5, marginBottom: 8, lineHeight: 18 }}>Ajoute une photo de toi. Elle n'est pas montrée aux autres filles dans la communauté.</Text>
        {photo && <Image source={{ uri: photo.uri }} style={{ width: 110, height: 110, borderRadius: 55, marginBottom: 8 }} />}
        <PrimaryButton title="📷 Prendre une photo" variant="secondary" onPress={() => addPhoto(true)} />
        <PrimaryButton title="🖼️ Choisir dans mes photos" variant="secondary" onPress={() => addPhoto(false)} />

        <FieldLabel>{t("password")}</FieldLabel>
        <TextInput value={password} onChangeText={setPassword} secureTextEntry />

        <FieldLabel>{t("pseudonyme")}</FieldLabel>
        <TextInput value={pseudonyme} onChangeText={setPseudonyme} autoCapitalize="none" />

        <FieldLabel>{t("birth_date")}</FieldLabel>
        <View style={styles.dateRow}>
          <TextInput style={styles.dateBox} value={day} onChangeText={(v) => setDay(v.replace(/\D/g, "").slice(0, 2))} placeholder="Jour" keyboardType="number-pad" maxLength={2} />
          <TextInput style={styles.dateBox} value={month} onChangeText={(v) => setMonth(v.replace(/\D/g, "").slice(0, 2))} placeholder="Mois" keyboardType="number-pad" maxLength={2} />
          <TextInput style={[styles.dateBox, { flex: 1.6 }]} value={year} onChangeText={(v) => setYear(v.replace(/\D/g, "").slice(0, 4))} placeholder="Année" keyboardType="number-pad" maxLength={4} />
        </View>
        <Text style={styles.hint}>{t("birth_date_hint")}</Text>

        <TouchableOpacity onPress={() => setShowTerms(!showTerms)}>
          <Text style={styles.link}>{t("read_terms")} {showTerms ? "▲" : "▼"}</Text>
        </TouchableOpacity>
        {showTerms && (
          <View style={styles.termsBox}>
            <Text style={styles.termsTitle}>{TERMS_TITLE}</Text>
            {TERMS_PARAGRAPHS.map((p, i) => (
              <Text key={i} style={styles.termsText}>{p}</Text>
            ))}
          </View>
        )}
        <View style={styles.consentRow}>
          <Switch value={acceptTerms} onValueChange={setAcceptTerms} trackColor={{ true: colors.rose }} />
          <Text style={styles.consentText}>{t("accept_terms")}</Text>
        </View>

        <ErrorText>{error}</ErrorText>

        <PrimaryButton title={t("signup")} onPress={handleSignup} loading={loading} />
        <PrimaryButton title={t("login")} variant="secondary" onPress={() => navigation.navigate("Login")} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  ageOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
    marginBottom: spacing.xs,
    backgroundColor: colors.surface,
  },
  ageOptionSelected: { backgroundColor: colors.rose, borderColor: colors.rose },
  ageOptionText: { color: colors.text, fontSize: 15 },
  consentRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.md, gap: spacing.sm },
  dateRow: { flexDirection: "row", gap: spacing.sm },
  dateBox: { flex: 1 },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
  link: { color: colors.rose, fontWeight: "600", marginTop: spacing.md, fontSize: 14 },
  termsBox: { backgroundColor: "#FFF0E9", borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  termsTitle: { fontWeight: "700", color: colors.text, marginBottom: spacing.sm, fontSize: 14 },
  termsText: { color: colors.text, fontSize: 13, lineHeight: 19, marginBottom: spacing.sm },
  consentText: { flex: 1, marginLeft: spacing.sm, color: colors.text, fontSize: 14 },
});
