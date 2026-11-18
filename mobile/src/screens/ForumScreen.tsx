import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useI18n } from "../i18n";
import { colors, spacing } from "../theme/colors";
import { Card, ScreenTitle } from "../theme/ui";
import { useRealtime } from "../realtime/realtime";

interface Topic { id: string; title: string; lastText: string; author: { pseudonyme: string }; _count: { comments: number }; lastActivityAt: string }

interface Category {
  id: string;
  slug: string;
  titleFr: string;
  icon?: string | null;
  parentId?: string | null;
  postCount?: number;
  lastPostAt?: number;
}

const ICONS: [RegExp, string][] = [[/sexual|intim|amour|relation/i, "💗"], [/maladie|sant|douleur|infection|vih|palud/i, "🩺"], [/école|ecole|univers|étud|etud|cours/i, "🎓"], [/relig|foi|prière|priere|église|eglise|mosqu/i, "🙏"], [/famil|maman|mère|mere|enfant|bébé|bebe|grossesse/i, "👶"], [/cycle|règle|regle|menstru/i, "🌸"], [/travail|emploi|argent|business|entrepr/i, "💼"], [/mental|stress|moral|émotion|emotion|anx/i, "🧠"], [/beauté|beaute|mode|corps/i, "💄"], [/violence|harcel|danger|protection/i, "🛡️"], [/ami|amitié|amitie|social/i, "🤝"], [/cuisine|nutrition|aliment|manger/i, "🥗"]];
export const themeIcon = (c: { icon?: string | null; titleFr: string; slug?: string }) => (c.icon && c.icon.trim()) || ICONS.find(([r]) => r.test(c.titleFr + " " + (c.slug || "")))?.[1] || "💬";

export default function ForumScreen({ navigation }: any) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [topics, setTopics] = useState<Record<string, Topic[]>>({});
  const loadTopics = useCallback((id: string) => { apiRequest<Topic[]>(`/forum/categories/${id}/posts`, { silent: true }).then((r) => setTopics((m) => ({ ...m, [id]: r }))).catch(() => {}); }, []);
  const reload = useCallback(() => { apiRequest<Category[]>("/forum/categories", { silent: true }).then(setCategories).catch(() => {}); }, []);
  useRealtime((e) => { if (e.t === "post" || e.t === "comment") { reload(); if (openId) loadTopics(openId); } });

  useFocusEffect(useCallback(() => {
    apiRequest<Category[]>("/forum/categories").then(setCategories).catch(() => {});
    if (openId) loadTopics(openId);
  }, [openId]));

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
      ListHeaderComponent={<View><ScreenTitle>{t("forum_title")}</ScreenTitle><TouchableOpacity style={styles.create} activeOpacity={0.85} onPress={() => navigation.navigate("NewPost", {})}><Text style={styles.createT}>✍️  Créer un sujet</Text></TouchableOpacity></View>}
      renderItem={({ item }) => {
        const subs = categories.filter((c) => c.parentId === item.id);
        const open = openId === item.id;
        const hot = !!item.lastPostAt && Date.now() - item.lastPostAt < 86400000;
        return (
          <View style={styles.theme}>
            <TouchableOpacity style={styles.head} activeOpacity={0.85} onPress={() => { setOpenId(open ? null : item.id); if (!open) loadTopics(item.id); }}>
              <View style={styles.ico}><Text style={{ fontSize: 26, lineHeight: 32 }}>{themeIcon(item)}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.categoryTitle}>{item.titleFr}</Text>
                <Text style={styles.muted}>{item.postCount || 0} sujet{(item.postCount || 0) > 1 ? "s" : ""}{hot ? " · 🔥 actif aujourd'hui" : ""}</Text>
              </View>
              <Text style={{ color: colors.rose, fontSize: 22 }}>{open ? "⌃" : "⌄"}</Text>
            </TouchableOpacity>
            {open ? (
              <View>
                <TouchableOpacity style={styles.sub} activeOpacity={0.8} onPress={() => navigation.navigate("NewPost", { categoryId: item.id })}>
                  <Text style={[styles.subT, { color: colors.rose }]}>＋ Nouveau sujet dans « {item.titleFr} »</Text>
                </TouchableOpacity>
                {(topics[item.id] || []).map((c) => (
                  <TouchableOpacity key={c.id} style={styles.sub} activeOpacity={0.8} onPress={() => navigation.navigate("Thread", { postId: c.id })}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.subT} numberOfLines={1}>{c.title}</Text>
                      <Text style={styles.muted} numberOfLines={1}>{c.lastText}</Text>
                    </View>
                    {c._count.comments ? <Text style={styles.cnt}>{c._count.comments}</Text> : null}
                    <Text style={{ color: colors.rose, fontSize: 18 }}>›</Text>
                  </TouchableOpacity>))}
                {topics[item.id] && !topics[item.id].length ? <Text style={[styles.muted, { padding: 16 }]}>Aucun sujet pour l'instant. Lance la conversation !</Text> : null}
              </View>) : null}
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
  create: { backgroundColor: colors.rose, borderRadius: 999, paddingVertical: 14, alignItems: "center", marginBottom: 14 }, createT: { color: "#fff", fontWeight: "700", fontSize: 15.5 },
  cnt: { backgroundColor: "#FFD6DD", color: colors.prune, fontWeight: "700", fontSize: 12, borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 },
});
