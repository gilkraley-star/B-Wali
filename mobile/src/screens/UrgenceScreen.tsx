import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors, spacing } from "../theme/colors";
import { Card, ScreenTitle } from "../theme/ui";
import { useAuth } from "../context/AuthContext";
import { getCountry } from "../config/countries";

export default function UrgenceScreen({ navigation }: any) {
  const { user } = useAuth();
  const country = getCountry(user?.country);
  const NUMBERS = country.emergency;
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <ScreenTitle>Urgence</ScreenTitle>
      <Text style={styles.intro}>Si tu es en danger maintenant, appelle. Si un numéro ne répond pas, essaie le suivant.</Text>
      {NUMBERS.length === 0 ? (
        <Card><Text style={styles.body}>Les numéros d'urgence de {country.name} ne sont pas encore vérifiés dans Wali, donc on ne t'en montre pas pour ne pas te tromper. Si tu es en danger, appelle les secours de ton pays ou va vers un adulte de confiance ou le centre de santé le plus proche.</Text></Card>
      ) : null}
      {NUMBERS.map((n) => (
        <TouchableOpacity key={n.number} style={styles.call} onPress={() => Linking.openURL(`tel:${n.number}`)} accessibilityRole="button">
          <Text style={styles.callLabel}>{n.label}</Text>
          <Text style={styles.callNumber}>📞 {n.number}</Text>
        </TouchableOpacity>
      ))}
      <TouchableOpacity style={styles.pro} activeOpacity={0.85} onPress={() => navigation.navigate("Professionnelles")} accessibilityRole="button">
        <Text style={styles.proT}>👩‍⚕️  Écrire à une professionnelle</Text>
        <Text style={styles.proS}>Une sage-femme, psychologue ou conseillère te répond en toute confidentialité.</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  intro: { color: colors.text, marginBottom: spacing.md, lineHeight: 20 },
  call: { backgroundColor: "#C23B3B", borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm },
  callLabel: { color: "#fff", fontSize: 13 },
  callNumber: { color: "#fff", fontSize: 24, fontWeight: "800" },
  warn: { color: "#7A5410", fontSize: 12 },
  h: { fontWeight: "700", color: colors.prune, marginBottom: 4 },
  body: { color: colors.text, lineHeight: 20 },
  pro: { backgroundColor: colors.rose, borderRadius: 16, padding: spacing.md, marginTop: spacing.sm }, proT: { color: "#fff", fontSize: 18, fontWeight: "800" }, proS: { color: "#fff", marginTop: 4, lineHeight: 19 },
  link: { color: "#15609E", fontWeight: "700", marginTop: spacing.md },
});
