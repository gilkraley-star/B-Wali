import React from "react";
import { Linking, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors, spacing } from "../theme/colors";

export interface Source {
  title: string;
  org: string;
  url: string;
}

/** Affiche les sources d'un contenu (OMS, UNFPA…) — chaque fiche, formation et activité doit en citer. */
export function SourcesBlock({ sources }: { sources?: Source[] }) {
  if (!sources || sources.length === 0) return null;
  return (
    <View style={styles.box}>
      <Text style={styles.title}>Sources</Text>
      {sources.map((s, i) => (
        <TouchableOpacity key={i} onPress={() => Linking.openURL(s.url).catch(() => {})} accessibilityRole="link">
          <Text style={styles.line}>
            {s.org} — <Text style={styles.link}>{s.title}</Text>
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

/** Pastille « bleue » des professionnelles certifiées. */
export function CertifiedBadge() {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeText}>✓ Certifiée</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: { marginTop: spacing.md, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border },
  title: { fontSize: 12, fontWeight: "700", color: colors.textMuted, marginBottom: spacing.xs, textTransform: "uppercase" },
  line: { fontSize: 12, color: colors.text, marginBottom: 4 },
  link: { color: "#15609E", textDecorationLine: "underline" },
  badge: { backgroundColor: "#E3F0FA", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2, alignSelf: "flex-start" },
  badgeText: { color: "#15609E", fontSize: 11, fontWeight: "700" },
});
