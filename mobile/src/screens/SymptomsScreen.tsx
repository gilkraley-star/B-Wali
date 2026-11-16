import React, { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiRequest } from "../api/client";
import { useI18n } from "../i18n";
import { colors, radius, spacing } from "../theme/colors";
import { Card, PrimaryButton, ScreenTitle } from "../theme/ui";

interface Symptom {
  id: string;
  date: string;
  type: string;
  intensity: number;
}

const TYPES: { value: string; labelKey: "symptom_douleur" | "symptom_fatigue" | "symptom_humeur" | "symptom_autre" }[] = [
  { value: "douleur", labelKey: "symptom_douleur" },
  { value: "fatigue", labelKey: "symptom_fatigue" },
  { value: "humeur", labelKey: "symptom_humeur" },
  { value: "autre", labelKey: "symptom_autre" },
];

export default function SymptomsScreen() {
  const { t } = useI18n();
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [selectedType, setSelectedType] = useState("douleur");
  const [intensity, setIntensity] = useState(3);

  const load = async () => setSymptoms(await apiRequest<Symptom[]>("/cycle/symptoms"));

  useEffect(() => {
    load();
  }, []);

  const handleAdd = async () => {
    await apiRequest("/cycle/symptoms", {
      method: "POST",
      body: { date: new Date().toISOString(), type: selectedType, intensity },
    });
    load();
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg }}
      data={symptoms}
      keyExtractor={(s) => s.id}
      ListHeaderComponent={
        <View>
          <ScreenTitle>{t("cycle_symptoms")}</ScreenTitle>

          <Card>
            <Text style={styles.label}>{t("cycle_add_symptom")}</Text>
            <View style={styles.typeRow}>
              {TYPES.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.typeChip, selectedType === opt.value && styles.typeChipActive]}
                  onPress={() => setSelectedType(opt.value)}
                >
                  <Text style={selectedType === opt.value ? styles.typeChipTextActive : styles.typeChipText}>
                    {t(opt.labelKey)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>
              {t("cycle_intensity")}: {intensity}/5
            </Text>
            <View style={styles.typeRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity
                  key={i}
                  style={[styles.intensityDot, intensity === i && styles.intensityDotActive]}
                  onPress={() => setIntensity(i)}
                >
                  <Text style={intensity === i ? { color: "#fff" } : { color: colors.text }}>{i}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <PrimaryButton title={t("save")} onPress={handleAdd} />
          </Card>
        </View>
      }
      renderItem={({ item }) => (
        <Card style={styles.row}>
          <Text style={styles.rowDate}>{new Date(item.date).toLocaleDateString("fr-FR")}</Text>
          <Text style={styles.rowType}>{item.type}</Text>
          <Text style={styles.muted}>{item.intensity}/5</Text>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  label: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xs, marginTop: spacing.sm },
  typeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.sm },
  typeChip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border },
  typeChipActive: { backgroundColor: colors.rose, borderColor: colors.rose },
  typeChipText: { color: colors.text },
  typeChipTextActive: { color: "#fff", fontWeight: "600" },
  intensityDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: colors.border },
  intensityDotActive: { backgroundColor: colors.corail, borderColor: colors.corail },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  rowDate: { color: colors.text, fontWeight: "600" },
  rowType: { color: colors.rose },
  muted: { color: colors.textMuted },
});
