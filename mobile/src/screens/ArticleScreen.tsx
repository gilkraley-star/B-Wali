import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { apiRequest } from "../api/client";
import { useI18n } from "../i18n";
import { colors, spacing } from "../theme/colors";
import { PrimaryButton } from "../theme/ui";
import { Source, SourcesBlock, CertifiedBadge } from "../components/Sources";

interface Article {
  id: string;
  titleFr: string;
  bodyFr: string;
  reviewedBy?: string | null;
  sources?: Source[];
  author?: { fullName: string | null; profession: string | null; certified: boolean } | null;
}

export default function ArticleScreen({ route }: any) {
  const { slug } = route.params;
  const { t } = useI18n();
  const [article, setArticle] = useState<Article | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    apiRequest<Article>(`/content/articles/${slug}`).then(setArticle);
  }, [slug]);

  const handleSave = async () => {
    await apiRequest(`/content/articles/${slug}/save`, { method: "POST" });
    setSaved(true);
  };

  if (!article) return null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: spacing.lg }}>
      <Text style={styles.title}>{article.titleFr}</Text>
      <Text style={styles.body}>{article.bodyFr}</Text>
      {article.author?.fullName ? (
        <Text style={styles.reviewed}>
          Rédigé par {article.author.fullName}
          {article.author.profession ? `, ${article.author.profession}` : ""}
        </Text>
      ) : null}
      {article.author?.certified ? <CertifiedBadge /> : null}
      {article.reviewedBy && <Text style={styles.reviewed}>{t("library_reviewed_by")}: {article.reviewedBy}</Text>}
      <SourcesBlock sources={article.sources} />
      <PrimaryButton
        title={saved ? t("library_saved") : t("library_save_offline")}
        variant="secondary"
        onPress={handleSave}
        disabled={saved}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  title: { fontSize: 22, fontWeight: "700", color: colors.prune, marginBottom: spacing.md },
  body: { fontSize: 16, color: colors.text, lineHeight: 24, marginBottom: spacing.md },
  reviewed: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.md, fontStyle: "italic" },
});
