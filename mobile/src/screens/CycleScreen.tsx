import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { Calendar, DateData } from "react-native-calendars";
import { addLocalPeriod, estimateLocal, loadLocalPeriods, LocalPeriod, syncCycle } from "../storage/localCycle";
import { useI18n } from "../i18n";
import { colors, spacing } from "../theme/colors";
import { Card, PrimaryButton, ScreenTitle } from "../theme/ui";

type Period = LocalPeriod;

export default function CycleScreen({ navigation }: any) {
  const { t } = useI18n();
  const [periods, setPeriods] = useState<Period[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [loading, setLoading] = useState(true);

  // Le téléphone est la référence : on affiche tout de suite ce qui est enregistré, puis on synchronise si possible.
  const load = useCallback(async () => {
    const local = await loadLocalPeriods();
    setPeriods(local);
    setPendingCount(local.filter((p) => p.pending).length);
    setLoading(false);
    const synced = await syncCycle();
    if (synced) {
      setPeriods(synced);
      setPendingCount(0);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleDayPress = async (day: DateData) => {
    Alert.alert(
      t("cycle_log_period"),
      day.dateString,
      [
        { text: t("cancel"), style: "cancel" },
        {
          text: t("cycle_save"),
          onPress: async () => {
            const list = await addLocalPeriod(day.dateString);
            setPeriods(list);
            setPendingCount(list.filter((p) => p.pending).length);
            load(); // envoie au serveur si internet, sinon reste sur le téléphone
          },
        },
      ],
      { cancelable: true }
    );
  };

  const estimate = estimateLocal(periods);

  const markedDates = periods.reduce((acc: Record<string, any>, p) => {
    const date = p.startDate.slice(0, 10);
    acc[date] = { selected: true, selectedColor: colors.rose };
    return acc;
  }, {});

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg }}
      data={periods}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={
        <View>
          <ScreenTitle>{t("cycle_title")}</ScreenTitle>
          {pendingCount > 0 && (
            <Text style={styles.offlineBadge}>
              📱 Enregistré sur ton téléphone
            </Text>
          )}

          <Calendar markedDates={markedDates} onDayPress={handleDayPress} theme={calendarTheme} />

          <Card>
            <Text style={styles.cardTitle}>{t("home_next_period")}</Text>
            {estimate.nextEstimatedStart ? (
              <Text style={styles.estimateDate}>
                {new Date(estimate.nextEstimatedStart).toLocaleDateString("fr-FR")}
              </Text>
            ) : (
              <Text style={styles.muted}>{t("home_no_data")}</Text>
            )}
            <Text style={styles.disclaimer}>{t("cycle_disclaimer")}</Text>
          </Card>

          <View style={styles.actionsRow}>
            <PrimaryButton title={t("cycle_add_symptom")} variant="secondary" onPress={() => navigation.navigate("Symptoms")} />
            <PrimaryButton title={t("cycle_add_reminder")} variant="secondary" onPress={() => navigation.navigate("Reminders")} />
          </View>

          <Text style={styles.sectionHeader}>{t("cycle_history")}</Text>
        </View>
      }
      renderItem={({ item }) => (
        <Card style={styles.historyRow}>
          <Text style={styles.historyDate}>{new Date(item.startDate).toLocaleDateString("fr-FR")}</Text>
          {item.endDate && (
            <Text style={styles.muted}> → {new Date(item.endDate).toLocaleDateString("fr-FR")}</Text>
          )}
        </Card>
      )}
      refreshing={loading}
      onRefresh={load}
    />
  );
}

const calendarTheme = {
  todayTextColor: colors.rose,
  arrowColor: colors.rose,
  selectedDayBackgroundColor: colors.rose,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  cardTitle: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xs },
  estimateDate: { fontSize: 20, fontWeight: "700", color: colors.prune },
  disclaimer: { fontSize: 12, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 16 },
  muted: { color: colors.textMuted },
  actionsRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  sectionHeader: { fontSize: 14, color: colors.textMuted, marginTop: spacing.lg, marginBottom: spacing.xs, textTransform: "uppercase" },
  historyRow: { flexDirection: "row", alignItems: "center" },
  historyDate: { color: colors.text, fontWeight: "600" },
  offlineBadge: { backgroundColor: colors.warning, color: "#fff", padding: spacing.sm, borderRadius: 8, marginBottom: spacing.sm, overflow: "hidden" },
});
