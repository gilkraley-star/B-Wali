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
}

export default function ForumScreen({ navigation }: any) {
  const { t } = useI18n();
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);

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

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg }}
      data={categories}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={<ScreenTitle>{t("forum_title")}</ScreenTitle>}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate("ForumCategory", { categoryId: item.id, title: item.titleFr })}>
          <Card>
            <Text style={styles.categoryTitle}>{item.titleFr}</Text>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  categoryTitle: { fontSize: 16, fontWeight: "600", color: colors.prune },
  muted: { color: colors.textMuted },
});
