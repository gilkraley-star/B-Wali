import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { colors, radius, spacing } from "../theme/colors";
import { ErrorText, FieldLabel, PrimaryButton, ScreenTitle, TextInput } from "../theme/ui";
import { ApiError } from "../api/client";
import { COUNTRIES, DEFAULT_COUNTRY } from "../config/countries";
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
  const [country, setCountry] = useState(DEFAULT_COUNTRY);
  const [byPhone, setByPhone] = useState(true);
  const [contact, setContact] = useState("");
  const [password, setPassword] = useState("");
  const [pseudonyme, setPseudonyme] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const goStep2 = () => {
    setError(null);
    if (!contact.trim()) { setError(byPhone ? "Écris ton numéro de téléphone." : "Écris ton e-mail."); return; }
    if (password.length < 8) { setError("Choisis un mot de passe d'au moins 8 caractères."); return; }
    if (pseudonyme.trim().length < 3) { setError("Choisis un pseudonyme d'au moins 3 lettres."); return; }
    if (!acceptTerms) { setError("Lis et accepte les conditions d'utilisation pour continuer."); return; }
    setStep(2);
  };
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
      try { await AsyncStorage.setItem("wali.welcome", pseudonyme); } catch {}
      await signup({ ...(byPhone ? { phone: contact } : { email: contact }), password, pseudonyme, birthDate, acceptTerms: true, country, photo: photo.dataUrl });
    } catch (e) {
      try { await AsyncStorage.removeItem("wali.welcome"); } catch {}
      setError(e instanceof ApiError ? e.message : t("error_generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.step}>ÉTAPE {step} SUR 2</Text>
        <ScreenTitle>{step === 1 ? t("signup") : "Ajoute ta photo"}</ScreenTitle>
        {step === 1 ? (<>
        <FieldLabel>Ton pays</FieldLabel>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {COUNTRIES.map((c) => (
            <TouchableOpacity key={c.code} onPress={() => setCountry(c.code)} activeOpacity={0.8}
              style={{ paddingVertical: 8, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1.5, borderColor: country === c.code ? "#FF5470" : "#F3DEE1", backgroundColor: country === c.code ? "#FFE3E8" : "#fff" }}>
              <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12.5, color: "#3B1D33" }}>{c.flag} {c.name}</Text>
            </TouchableOpacity>))}
        </View>
        {!COUNTRIES.find((c) => c.code === country)?.ready ? <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 6, lineHeight: 17 }}>Wali démarre en Centrafrique. Pour ton pays, les centres de santé et les numéros d'urgence arrivent bientôt. Le reste de l'appli fonctionne déjà.</Text> : null}

        <FieldLabel>{byPhone ? "Ton numéro de téléphone" : "Ton e-mail"}</FieldLabel>
        <TextInput value={contact} onChangeText={setContact} autoCapitalize="none" keyboardType={byPhone ? "phone-pad" : "email-address"} placeholder={byPhone ? "70 12 34 56" : "nom@exemple.com"} />
        <Text style={{ color: colors.rose, fontWeight: "700", marginTop: 6 }} onPress={() => { setByPhone(!byPhone); setContact(""); }}>
          {byPhone ? "Je préfère utiliser un e-mail" : "Je n'ai pas d'e-mail : utiliser mon numéro"}
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>Ton numéro reste privé. Personne ne le voit dans l'appli.</Text>

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
        <TouchableOpacity style={styles.accept} onPress={() => setAcceptTerms(!acceptTerms)} activeOpacity={0.8}>
          <View style={[styles.box, acceptTerms && styles.boxOn]}>{acceptTerms ? <Text style={{ color: "#fff", fontSize: 13 }}>✓</Text> : null}</View>
          <Text style={styles.consentText}>{t("accept_terms")}</Text>
        </TouchableOpacity>

        <ErrorText>{error}</ErrorText>
        <PrimaryButton title="Continuer" onPress={goStep2} disabled={!acceptTerms} />
        {!acceptTerms ? <Text style={[styles.hint, { textAlign: "center" }]}>Lis et accepte les conditions pour continuer.</Text> : null}
        <TouchableOpacity onPress={() => navigation.navigate("Login")}><Text style={styles.back}>J'ai déjà un compte</Text></TouchableOpacity>
        </>) : (<>
        <Text style={styles.hint}>Ajoute une photo de toi, prise maintenant ou choisie dans tes photos. Elle n'est pas montrée aux autres filles dans Entre Nous.</Text>
        <View style={styles.circle}>{photo ? <Image source={{ uri: photo.uri }} style={{ width: 140, height: 140, borderRadius: 70 }} /> : <Text style={{ fontSize: 48 }}>📷</Text>}</View>
        <PrimaryButton title="📷 Prendre ma photo" variant="secondary" onPress={() => addPhoto(true)} />
        <PrimaryButton title="🖼️ Choisir dans mes photos" variant="secondary" onPress={() => addPhoto(false)} />
        <ErrorText>{error}</ErrorText>
        <PrimaryButton title={t("signup")} onPress={handleSignup} loading={loading} disabled={!photo} />
        <TouchableOpacity onPress={() => { setError(null); setStep(1); }}><Text style={styles.back}>Retour</Text></TouchableOpacity>
        </>)}
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
  step: { color: "#FF5470", fontSize: 11, letterSpacing: 0.8, fontFamily: "Inter_700Bold", marginBottom: 2 },
  accept: { flexDirection: "row", alignItems: "flex-start", gap: 10, backgroundColor: "#FFF0E9", borderRadius: 16, padding: 14, marginTop: 10 },
  box: { width: 22, height: 22, borderRadius: 7, borderWidth: 2, borderColor: "#FF5470", alignItems: "center", justifyContent: "center", backgroundColor: "#fff" }, boxOn: { backgroundColor: "#FF5470" },
  back: { textAlign: "center", color: "#8C7A86", marginTop: 10, fontFamily: "Inter_500Medium" },
  circle: { alignSelf: "center", width: 140, height: 140, borderRadius: 70, backgroundColor: "#FFE3E8", alignItems: "center", justifyContent: "center", marginVertical: 18, overflow: "hidden" },
  consentRow: { flexDirection: "row", alignItems: "center", marginTop: spacing.md, gap: spacing.sm },
  dateRow: { flexDirection: "row", gap: spacing.sm },
  dateBox: { flex: 1, textAlign: "center" },
  hint: { color: colors.textMuted, fontSize: 12, marginTop: spacing.xs },
  link: { color: colors.rose, fontWeight: "600", marginTop: spacing.md, fontSize: 14 },
  termsBox: { backgroundColor: "#FFF0E9", borderRadius: radius.md, padding: spacing.md, marginTop: spacing.sm },
  termsTitle: { fontWeight: "700", color: colors.text, marginBottom: spacing.sm, fontSize: 14 },
  termsText: { color: colors.text, fontSize: 13, lineHeight: 19, marginBottom: spacing.sm },
  consentText: { flex: 1, color: colors.text, fontSize: 13.5, lineHeight: 19 },
});
