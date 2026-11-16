import { useRealtime } from "../realtime/realtime";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { apiRequest } from "../api/client";
import { useI18n } from "../i18n";
import { colors, spacing } from "../theme/colors";
import { Card, PrimaryButton, ScreenTitle } from "../theme/ui";

interface Post {
  id: string;
  title: string;
  body: string;
  author: { pseudonyme: string };
  _count: { comments: number };
}

export default function ForumCategoryScreen({ route, navigation }: any) {
  const { categoryId, title } = route.params;
  const { t } = useI18n();
  const [posts, setPosts] = useState<Post[]>([]);

  const load = useCallback(() => {
    apiRequest<Post[]>(`/forum/categories/${categoryId}/posts`).then(setPosts);
  }, [categoryId]);

  useFocusEffect(load);
  useRealtime((e) => {
    if (e.t === "post" && e.cat === categoryId) apiRequest<Post[]>(`/forum/categories/${categoryId}/posts`, { silent: true }).then(setPosts).catch(() => {});
  });

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg }}
      data={posts}
      keyExtractor={(p) => p.id}
      ListHeaderComponent={
        <View>
          <ScreenTitle>{title}</ScreenTitle>
          <PrimaryButton
            title={t("forum_new_post")}
            onPress={() => navigation.navigate("NewPost", { categoryId })}
          />
        </View>
      }
      ListEmptyComponent={<Text style={styles.muted}>—</Text>}
      renderItem={({ item }) => (
        <TouchableOpacity onPress={() => navigation.navigate("Thread", { postId: item.id })}>
          <Card>
            <Text style={styles.postTitle}>{item.title}</Text>
            <Text style={styles.postBody} numberOfLines={2}>
              {item.body}
            </Text>
            <Text style={styles.muted}>
              {item.author.pseudonyme} · {item._count.comments} réponses
            </Text>
          </Card>
        </TouchableOpacity>
      )}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  postTitle: { fontSize: 16, fontWeight: "600", color: colors.prune },
  postBody: { color: colors.text, marginVertical: 4 },
  muted: { color: colors.textMuted, fontSize: 12 },
});
