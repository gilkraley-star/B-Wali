import React, { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { apiRequest, ApiError } from "../api/client";
import { cacheSavedArticles, getCachedSavedArticles } from "../storage/offlineStorage";
import { useI18n } from "../i18n";
import { colors, spacing } from "../theme/colors";
import { Card, ScreenTitle } from "../theme/ui";

interface Category {
  id: string;
  slug: string;
  titleFr: string;
}

interface Article {
  id: string;
  slug: string;
  titleFr: string;
  category?: { titleFr: string };
}

export default function LibraryScreen({ navigation }: any) {
  const { t } = useI18n();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const load = async (categorySlug?: string | null) => {
    try {
      const [cats, arts] = await Promise.all([
        apiRequest<Category[]>("/content/categories"),
        apiRequest<Article[]>(`/content/articles${categorySlug ? `?category=${categorySlug}` : ""}`),
      ]);
      setCategories(cats);
      setArticles(arts);
      setOffline(false);
      if (!categorySlug) await cacheSavedArticles(arts);
    } catch (e) {
      if (e instanceof ApiError && e.status === 0) {
        const cached = await getCachedSavedArticles<Article>();
        setArticles(cached);
        setOffline(true);
      }
    }
  };

  useFocusEffect(useCallback(() => { load(selectedCategory); }, [selectedCategory]));

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg }}
      data={articles}
      keyExtractor={(a) => a.id}
      ListHeaderComponent={
        <View>
          <ScreenTitle>{t("library_title")}</ScreenTitle>
          {offline && <Text style={styles.offlineBadge}>{t("offline_notice")}</Text>}
          <Text style={styles.sectionHeader}>{t("library_categories")}</Text>
          <View style={styles.chipsRow}>
            <TouchableOpacity
              style={[styles.chip, !selectedCategory && styles.chipActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={!selectedCategory ? styles.chipTextActive : styles.chipText}>Tout</Text>
            </TouchableOpacity>
            {categories.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, selectedCategory === c.slug && styles.chipActive]}
                onPress={() => setSelectedCategory(c.slug)}
              >
                <Text style={selectedCategory === c.slug ? styles.chipTextActive : styles.chipText}>
                  {c.titleFr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      }
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate("Article", { slug: item.slug })}>
          <Card>
            <Text style={styles.articleTitle}>{item.titleFr}</Text>
            {item.category && <Text style={styles.muted}>{item.category.titleFr}</Text>}
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sectionHeader: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xs, textTransform: "uppercase" },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm, marginBottom: spacing.md },
  chip: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  chipActive: { backgroundColor: colors.corail, borderColor: colors.corail },
  chipText: { color: colors.text, fontSize: 13 },
  chipTextActive: { color: "#fff", fontSize: 13, fontWeight: "600" },
  articleTitle: { fontSize: 16, fontWeight: "600", color: colors.prune },
  muted: { color: colors.textMuted, marginTop: 2, fontSize: 13 },
  offlineBadge: { backgroundColor: colors.warning, color: "#fff", padding: spacing.sm, borderRadius: 8, marginBottom: spacing.sm, overflow: "hidden" },
});
