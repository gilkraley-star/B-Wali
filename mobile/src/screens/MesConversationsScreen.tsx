import React, { useCallback, useState } from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiRequest, apiOrigin } from "../api/client";
import { colors, spacing } from "../theme/colors";
import { ScreenTitle } from "../theme/ui";
import { useRealtime } from "../realtime/realtime";

interface Convo {
  id: string;
  unread: boolean;
  lastText: string;
  with: { id: string; fullName: string | null; profession: string | null; photoUrl: string | null; certified: boolean };
}

// Liste des conversations de la fille avec les professionnelles.
export default function MesConversationsScreen({ navigation }: any) {
  const [list, setList] = useState<Convo[]>([]);
  const load = useCallback(() => { apiRequest<Convo[]>("/messages/conversations").then(setList).catch(() => {}); }, []);
  useFocusEffect(load);
  useRealtime((e: any) => { if (e.t === "dm") load(); });

  return (
    <FlatList
      style={styles.c}
      contentContainerStyle={{ padding: spacing.lg }}
      data={list}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={<ScreenTitle>Mes conversations</ScreenTitle>}
      ListEmptyComponent={<Text style={styles.empty}>Tu n'as écrit à aucune professionnelle pour l'instant.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Conversation", { conversationId: item.id, withName: item.with.fullName })}
        >
          {item.with.photoUrl ? <Image source={{ uri: apiOrigin + item.with.photoUrl }} style={styles.photo} /> : <View style={[styles.photo, { backgroundColor: colors.roseLight }]} />}
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.with.fullName}</Text>
            <Text style={styles.preview} numberOfLines={1}>{item.lastText}</Text>
          </View>
          {item.unread && <View style={styles.dot} />}
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  empty: { color: "#6E5C68", textAlign: "center", marginTop: 30 },
  row: { flexDirection: "row", alignItems: "center", gap: spacing.md, backgroundColor: "#fff", borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm },
  photo: { width: 46, height: 46, borderRadius: 23 },
  name: { fontWeight: "700", color: colors.prune, fontSize: 15 },
  preview: { color: "#6E5C68", marginTop: 2, fontSize: 13 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.rose, marginLeft: 8 },
});
