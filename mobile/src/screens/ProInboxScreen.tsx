import React, { useCallback, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiRequest } from "../api/client";
import { colors, spacing } from "../theme/colors";
import { ScreenTitle } from "../theme/ui";
import { useRealtime } from "../realtime/realtime";

interface Convo {
  id: string;
  unread: boolean;
  lastText: string;
  lastMessageAt: string;
  with: { displayName: string };
}

// Boîte de réception de la professionnelle : la liste de ses conversations avec des filles.
export default function ProInboxScreen({ navigation }: any) {
  const [list, setList] = useState<Convo[]>([]);
  const load = useCallback(() => { apiRequest<Convo[]>("/messages/pro/conversations").then(setList).catch(() => {}); }, []);
  useFocusEffect(load);
  useRealtime((e: any) => { if (e.t === "dm") load(); });

  return (
    <FlatList
      style={styles.c}
      contentContainerStyle={{ padding: spacing.lg }}
      data={list}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={<ScreenTitle>Mes messages</ScreenTitle>}
      ListEmptyComponent={<Text style={styles.empty}>Aucune conversation pour le moment.</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={styles.row}
          activeOpacity={0.85}
          onPress={() => navigation.navigate("Conversation", { conversationId: item.id, withName: item.with.displayName })}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.with.displayName}</Text>
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
  row: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", borderRadius: 16, padding: spacing.md, marginBottom: spacing.sm },
  name: { fontWeight: "700", color: colors.prune, fontSize: 15 },
  preview: { color: "#6E5C68", marginTop: 2, fontSize: 13 },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.rose, marginLeft: 8 },
});
