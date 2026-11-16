import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { colors, radius, spacing } from "../theme/colors";
import HomeCarousel from "../components/HomeCarousel";
import PendingNotice from "../components/PendingNotice";
import { Card, ScreenTitle } from "../theme/ui";

interface Estimate {
  nextEstimatedStart: string | null;
  disclaimer: string;
}

export default function HomeScreen({ navigation }: any) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [estimate, setEstimate] = useState<Estimate | null>(null);

  useEffect(() => {
    apiRequest<Estimate>("/cycle/estimate").then(setEstimate).catch(() => {});
  }, []);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <PendingNotice />
      <Text style={styles.greeting}>
        {t("home_greeting")}, {user?.pseudonyme} 💕
      </Text>
      <ScreenTitle>{t("app_name")}</ScreenTitle>

      <HomeCarousel nextPeriod={estimate?.nextEstimatedStart} navigation={navigation} />

      <Text style={styles.sectionHeader}>{t("home_quick_actions")}</Text>
      <View style={styles.grid}>
        <QuickAction label={t("tab_cycle")} emoji="🩸" onPress={() => navigation.navigate("Cycle")} />
        <QuickAction label={t("tab_library")} emoji="📚" onPress={() => navigation.navigate("Library")} />
        <QuickAction label={t("tab_forum")} emoji="💬" onPress={() => navigation.navigate("Forum")} />
        <QuickAction label={t("tab_settings")} emoji="⚙️" onPress={() => navigation.navigate("Settings")} />
        <QuickAction label="Jeux et divertissement" emoji="🎮" onPress={() => navigation.navigate("Games")} />
        <QuickAction label="Mon Carnet" emoji="📒" onPress={() => navigation.navigate("MonCarnet")} />
        <QuickAction label="Formations" emoji="🎓" onPress={() => navigation.navigate("Formations")} />
        <QuickAction label="Inviter une amie" emoji="💌" onPress={() => navigation.navigate("Partager")} />
        <QuickAction label="Gagner un revenu" emoji="💼" onPress={() => navigation.navigate("Revenus")} />
        <QuickAction label="Nos professionnelles" emoji="👩‍⚕️" onPress={() => navigation.navigate("Professionnelles")} />
        {["PROFESSIONNELLE", "COACH", "FORMATRICE"].includes(user?.role || "") && (
          <QuickAction label="Espace pro" emoji="🩺" onPress={() => navigation.navigate("ProSpace")} />
        )}
        {user?.role === "ADMIN" && <QuickAction label="Administration" emoji="🛠️" onPress={() => navigation.navigate("Admin")} />}
      </View>
      <TouchableOpacity style={styles.advisor} onPress={() => navigation.navigate("Assistant")} accessibilityRole="button">
        <Text style={styles.advisorT}>✨ Pose-moi tes questions</Text>
        <Text style={styles.advisorS}>Ta conseillère IA, en toute discrétion</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sos} onPress={() => navigation.navigate("Urgence")} accessibilityRole="button">
        <Text style={styles.sosText}>SOS · Obtenir de l'aide immédiatement</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function QuickAction({ label, emoji, onPress }: { label: string; emoji: string; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <Text style={styles.quickActionEmoji}>{emoji}</Text>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  advisor: { backgroundColor: "#FFD84D", borderRadius: 20, padding: 16, marginTop: 12 },
  advisorT: { fontWeight: "800", fontSize: 16, color: "#3B1D33" },
  advisorS: { color: "#3B1D33", marginTop: 2 },
  container: { flex: 1, backgroundColor: colors.background },
  greeting: { fontSize: 16, color: colors.rose, marginBottom: spacing.xs },
  cardLabel: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xs },
  estimateDate: { fontSize: 22, fontWeight: "700", color: colors.prune },
  muted: { color: colors.textMuted },
  sectionHeader: { fontSize: 14, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.sm, textTransform: "uppercase" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  quickAction: {
    width: "47%",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  sos: { backgroundColor: "#D64545", borderRadius: radius.pill, padding: spacing.md, alignItems: "center", marginTop: spacing.lg },
  sosText: { color: "#fff", fontWeight: "700" },
  quickActionEmoji: { fontSize: 28, marginBottom: spacing.xs },
  quickActionLabel: { color: colors.text, fontWeight: "600" },
});
