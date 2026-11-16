import React from "react";
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors, spacing } from "../theme/colors";
import { Card, ScreenTitle } from "../theme/ui";

// ⚠️ NUMÉROS À CONFIRMER AVANT LE LANCEMENT auprès des autorités locales (Bangui et provinces).
// Les valeurs ci-dessous viennent des recherches initiales et ne sont PAS validées.
const NUMBERS = [
  { label: "Police", number: "117" },
  { label: "Ambulance / urgence médicale", number: "1220" },
  { label: "Pompiers", number: "118" },
  { label: "Autre numéro médical", number: "114" },
];

export default function UrgenceScreen({ navigation }: any) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <ScreenTitle>Urgence</ScreenTitle>
      <Text style={styles.intro}>Si tu es en danger maintenant, appelle. Si un numéro ne répond pas, essaie le suivant.</Text>
      {NUMBERS.map((n) => (
        <TouchableOpacity key={n.number} style={styles.call} onPress={() => Linking.openURL(`tel:${n.number}`)} accessibilityRole="button">
          <Text style={styles.callLabel}>{n.label}</Text>
          <Text style={styles.callNumber}>📞 {n.number}</Text>
        </TouchableOpacity>
      ))}
      <Card>
        <Text style={styles.warn}>Ces numéros doivent être confirmés localement avant la diffusion de l'application. [À CONFIRMER AVANT LANCEMENT]</Text>
      </Card>
      <Card>
        <Text style={styles.h}>Pour ta sécurité</Text>
        <Text style={styles.body}>Pense à effacer l'historique d'appels si quelqu'un peut voir ton téléphone. Les « espaces sûrs » pour femmes et filles offrent écoute, soins et aide juridique : demande l'adresse à une professionnelle.</Text>
      </Card>
      <TouchableOpacity onPress={() => navigation.navigate("Professionnelles")}>
        <Text style={styles.link}>👩‍⚕️ Écrire à une professionnelle</Text>
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
  link: { color: "#15609E", fontWeight: "700", marginTop: spacing.md },
});
