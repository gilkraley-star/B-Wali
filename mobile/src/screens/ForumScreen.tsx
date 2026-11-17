import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { colors, spacing } from "../theme/colors";
import { Card, ScreenTitle } from "../theme/ui";

interface Category {
  id: string;
  slug: string;
  titleFr: string;
  icon?: string | null;
  parentId?: string | null;
  postCount?: number;
  lastPostAt?: number;
}

export default function ForumScreen({ navigation }: any) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => {
    apiRequest<Category[]>("/forum/categories").then(setCategories).catch(() => {});
  }, []));

  if (user && user.participatesForum === false) {
    return (
      <View style={styles.container}>
        <ScreenTitle>{t("forum_title")}</ScreenTitle>
        <Card>
          <Text style={styles.muted}>{t("forum_disabled")}</Text>
        </Card>
      </View>
    );
  }

  const parents = categories.filter((c) => !c.parentId);
  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg, paddingBottom: 120 }}
      data={parents}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={<ScreenTitle>{t("forum_title")}</ScreenTitle>}
      renderItem={({ item }) => {
        const subs = categories.filter((c) => c.parentId === item.id);
        const open = openId === item.id;
        const hot = !!item.lastPostAt && Date.now() - item.lastPostAt < 86400000;
        return (
          <View style={styles.theme}>
            <TouchableOpacity style={styles.head} activeOpacity={0.85} onPress={() => setOpenId(open ? null : item.id)}>
              <View style={styles.ico}><Text style={{ fontSize: 26 }}>{item.icon || "💬"}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.categoryTitle}>{item.titleFr}</Text>
                <Text style={styles.muted}>{subs.length} sujet{subs.length > 1 ? "s" : ""}{hot ? " · 🔥 actif aujourd'hui" : ""}</Text>
              </View>
              <Text style={{ color: colors.rose, fontSize: 22 }}>{open ? "⌃" : "⌄"}</Text>
            </TouchableOpacity>
            {open ? subs.map((c) => (
              <TouchableOpacity key={c.id} style={styles.sub} activeOpacity={0.8} onPress={() => navigation.navigate("ForumCategory", { categoryId: c.id, title: c.titleFr })}>
                <Text style={styles.subT}>{c.titleFr}</Text>
                {c.postCount ? <Text style={styles.cnt}>{c.postCount}</Text> : null}
                <Text style={{ color: colors.rose, fontSize: 18 }}>›</Text>
              </TouchableOpacity>)) : null}
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  categoryTitle: { fontSize: 16, fontWeight: "600", color: colors.prune },
  muted: { color: colors.textMuted, fontSize: 12.5, marginTop: 2 },
  theme: { backgroundColor: "#fff", borderRadius: 22, marginBottom: 12, overflow: "hidden", elevation: 1 },
  head: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }, ico: { width: 48, height: 48, borderRadius: 16, backgroundColor: "#FFE9EE", alignItems: "center", justifyContent: "center" },
  sub: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13, paddingHorizontal: 18, borderTopWidth: 1, borderTopColor: "#F5E8EC", backgroundColor: "#FFFAF8" }, subT: { flex: 1, color: colors.prune, fontWeight: "600", fontSize: 14 },
  cnt: { backgroundColor: "#FFD6DD", color: colors.prune, fontWeight: "700", fontSize: 12, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
});
