import React, { useEffect, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiRequest, apiOrigin, ApiError } from "../api/client";
import { colors, spacing } from "../theme/colors";
import { Card, ScreenTitle } from "../theme/ui";
import { CertifiedBadge } from "../components/Sources";

interface Pro {
  id: string;
  fullName: string | null;
  profession: string | null;
  bio: string | null;
  photoUrl: string | null;
  certified: boolean;
  available: boolean;
  role: string;
}

export default function ProfessionnellesScreen({ navigation }: any) {
  const [pros, setPros] = useState<Pro[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    apiRequest<Pro[]>("/catalog/professionals")
      .then(setPros)
      .catch((e) => setError(e instanceof ApiError ? e.message : "Erreur de chargement."));
  }, []);

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg }}
      data={pros}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={
        <View>
          <ScreenTitle>Nos professionnelles</ScreenTitle>
          <Text style={styles.intro}>Sages-femmes, médecins, psychologues, coachs : des personnes vérifiées par l'équipe Wali. Touche une carte pour lui écrire en privé.</Text>
          <TouchableOpacity style={styles.myConvos} activeOpacity={0.85} onPress={() => navigation.navigate("MesConversations")} accessibilityRole="button">
            <Text style={styles.myConvosT}>💌 Mes conversations</Text>
          </TouchableOpacity>
          {error && <Text style={{ color: colors.danger }}>{error}</Text>}
        </View>
      }
      ListEmptyComponent={!error ? <Text style={styles.intro}>Les professionnelles seront ajoutées par l'équipe très bientôt.</Text> : null}
      renderItem={({ item: p }) => (
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Conversation", { proId: p.id, proName: p.fullName })}
          accessibilityRole="button"
          accessibilityLabel={`Écrire à ${p.fullName}`}
        >
          <Card style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
            {p.photoUrl ? <Image source={{ uri: apiOrigin + p.photoUrl }} style={styles.photo} /> : <View style={[styles.photo, { backgroundColor: colors.roseLight }]} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{p.fullName}</Text>
              <Text style={styles.prof}>{p.profession}</Text>
              {p.certified && <CertifiedBadge />}
              {p.bio ? <Text style={styles.bio}>{p.bio}</Text> : null}
              <Text style={{ fontSize: 12, color: p.available ? colors.success : "#6E5C68", marginTop: 4 }}>
                {p.available ? "● Disponible aujourd'hui" : "○ Réponse sous 24 h"}
              </Text>
            </View>
            <Text style={{ fontSize: 18, color: "#B59CAE" }}>›</Text>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  intro: { color: "#6E5C68", marginBottom: spacing.md, lineHeight: 20 },
  photo: { width: 64, height: 64, borderRadius: 32 },
  name: { fontSize: 16, fontWeight: "700", color: colors.prune },
  prof: { fontSize: 13, color: "#6E5C68", marginBottom: 4 },
  bio: { fontSize: 13, color: colors.text, marginTop: 4 },
  myConvos: { backgroundColor: colors.roseLight, borderRadius: 999, paddingVertical: 11, alignItems: "center", marginBottom: spacing.md },
  myConvosT: { color: colors.prune, fontWeight: "700" },
});
