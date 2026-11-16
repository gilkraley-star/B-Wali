import React from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { useI18n } from "../i18n";
import { colors, spacing } from "../theme/colors";
import { PrimaryButton } from "../theme/ui";

export default function OnboardingScreen({ navigation }: any) {
  const { t } = useI18n();
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoText}>BW</Text>
        </View>
        <Text style={styles.title}>{t("onboarding_welcome")}</Text>
        <Text style={styles.tagline}>{t("app_tagline")}</Text>
        <Text style={styles.subtitle}>{t("onboarding_subtitle")}</Text>
      </View>
      <View style={styles.actions}>
        <PrimaryButton title={t("get_started")} onPress={() => navigation.navigate("Signup")} />
        <PrimaryButton
          title={t("already_have_account")}
          variant="secondary"
          onPress={() => navigation.navigate("Login")}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, justifyContent: "space-between" },
  content: { alignItems: "center", paddingTop: 80, paddingHorizontal: spacing.lg },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.rose,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.lg,
  },
  logoText: { color: "#fff", fontSize: 32, fontWeight: "700" },
  title: { fontSize: 28, fontWeight: "700", color: colors.prune, textAlign: "center" },
  tagline: { fontSize: 16, fontStyle: "italic", color: colors.rose, marginTop: spacing.sm, textAlign: "center" },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: spacing.lg,
    lineHeight: 22,
  },
  actions: { padding: spacing.lg, paddingBottom: spacing.xl },
});
