import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Switch, Text, View } from "react-native";
import { apiRequest } from "../api/client";
import { useI18n } from "../i18n";
import { colors, spacing } from "../theme/colors";
import { Card, FieldLabel, PrimaryButton, ScreenTitle, TextInput } from "../theme/ui";

interface Reminder {
  id: string;
  label: string;
  daysBefore: number;
  active: boolean;
}

export default function RemindersScreen() {
  const { t } = useI18n();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [label, setLabel] = useState("");
  const [daysBefore, setDaysBefore] = useState("2");

  const load = async () => setReminders(await apiRequest<Reminder[]>("/cycle/reminders"));

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    if (!label.trim()) return;
    await apiRequest("/cycle/reminders", {
      method: "POST",
      body: { label, daysBefore: Number(daysBefore) || 2 },
    });
    setLabel("");
    load();
  };

  const toggleActive = async (reminder: Reminder) => {
    await apiRequest(`/cycle/reminders/${reminder.id}`, {
      method: "PATCH",
      body: { active: !reminder.active },
    });
    load();
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg }}
      data={reminders}
      keyExtractor={(r) => r.id}
      ListHeaderComponent={
        <View>
          <ScreenTitle>{t("cycle_reminders")}</ScreenTitle>
          <Card>
            <FieldLabel>{t("cycle_add_reminder")}</FieldLabel>
            <TextInput value={label} onChangeText={setLabel} placeholder="Ex: Préparer mes protections" />
            <FieldLabel>{t("reminder_days_before")}</FieldLabel>
            <TextInput value={daysBefore} onChangeText={setDaysBefore} keyboardType="number-pad" />
            <PrimaryButton title={t("save")} onPress={handleAdd} />
          </Card>
        </View>
      }
      renderItem={({ item }) => (
        <Card style={styles.row}>
          <View style={{ flex: 1 }}>
            <Text style={styles.rowLabel}>{item.label}</Text>
            <Text style={styles.muted}>
              {item.daysBefore} {t("reminder_days_before")}
            </Text>
          </View>
          <Switch value={item.active} onValueChange={() => toggleActive(item)} trackColor={{ true: colors.rose }} />
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  row: { flexDirection: "row", alignItems: "center" },
  rowLabel: { color: colors.text, fontWeight: "600" },
  muted: { color: colors.textMuted, fontSize: 12 },
});
