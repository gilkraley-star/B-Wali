import React from "react";
import { Image, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useI18n } from "../i18n";
import { PrimaryButton } from "../theme/ui";
import { FadeUp, Float } from "../components/anim";

// Écran de bienvenue (maquette Onboarding) : fond rosé dégradé, logo, titre, boutons. La pastille de langue passe FR → SG → EN.
export default function OnboardingScreen({ navigation }: any) {
  const { t, lang, setLang } = useI18n();
  const next = lang === "fr" ? "en" : "fr";
  return (
    <LinearGradient colors={["#FFF6F0", "#FFE3E8"]} style={{ flex: 1 }}>
      <Float style={[s.blob, { top: -60, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: "#FFD6DD", opacity: 0.6 }]} />
      <Float delay={3000} style={[s.blob, { bottom: 160, left: -70, width: 170, height: 170, borderRadius: 85, backgroundColor: "#E7D5FF", opacity: 0.45 }]} />
      <SafeAreaView style={{ flex: 1, justifyContent: "space-between" }}>
        <TouchableOpacity style={s.lang} onPress={() => setLang(next)} accessibilityLabel="Changer de langue"><Text style={s.langT}>{lang === "fr" ? "FR" : "EN"}</Text></TouchableOpacity>
        <View style={s.content}>
          <FadeUp delay={50}><View style={s.logoCard}><Image source={require("../../assets/logo.png")} style={s.logo} resizeMode="contain" accessibilityLabel="Wali" /></View></FadeUp>
          <FadeUp delay={150}><Text style={s.title}>{t("onboarding_welcome").replace(/ (sur|on) /, " $1\n")}</Text></FadeUp>
          <FadeUp delay={230}><Text style={s.tagline}>{t("app_tagline")}</Text></FadeUp>
          <FadeUp delay={300}><Text style={s.subtitle}>{t("onboarding_subtitle")}</Text></FadeUp>
        </View>
        <FadeUp delay={380} style={s.actions}>
          <PrimaryButton title={t("get_started")} onPress={() => navigation.navigate("Signup")} />
          <PrimaryButton title={t("already_have_account")} variant="secondary" onPress={() => navigation.navigate("Login")} />
        </FadeUp>
      </SafeAreaView>
    </LinearGradient>
  );
}
const s = StyleSheet.create({
  blob: { position: "absolute" },
  lang: { alignSelf: "flex-end", marginTop: 18, marginRight: 20, borderWidth: 1.5, borderColor: "#3B1D33", borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  langT: { fontSize: 11, color: "#3B1D33", fontFamily: "Inter_700Bold" },
  content: { alignItems: "center", paddingHorizontal: 28, gap: 14 },
  logoCard: { width: 140, height: 140, borderRadius: 14, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", overflow: "hidden", shadowColor: "#E85D75", shadowOpacity: 0.28, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 8, marginBottom: 14 },
  logo: { width: 150, height: 150 },
  title: { fontSize: 28, fontFamily: "Poppins_800ExtraBold", color: "#3B1D33", textAlign: "center", lineHeight: 36 },
  tagline: { fontSize: 15, fontStyle: "italic", color: "#FF5470", textAlign: "center", fontFamily: "Inter_400Regular" },
  subtitle: { fontSize: 15, color: "#8C7A86", textAlign: "center", lineHeight: 22, maxWidth: 290, fontFamily: "Inter_400Regular" },
  actions: { paddingHorizontal: 20, paddingBottom: 24 },
});
