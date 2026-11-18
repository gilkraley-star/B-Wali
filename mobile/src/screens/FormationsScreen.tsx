import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";
import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, StyleSheet, Text, View } from "react-native";
import { apiRequest, ApiError } from "../api/client";
import { colors, spacing } from "../theme/colors";
import { Card, PrimaryButton, ScreenTitle } from "../theme/ui";
import { Source, SourcesBlock } from "../components/Sources";
import { useI18n } from "../i18n";

interface Course {
  liveState?: string;
  id: string;
  slug: string;
  title: string;
  summary: string;
  icon: string;
  partner?: string | null;
  durationMin: number;
  startsAt?: string | null;
  postponedTo?: string | null;
  state: string;
  outlineMd: string;
  sources: Source[];
  format?: string; certified?: boolean; hasTest?: boolean; qcmReady?: boolean; videos?: { id: string; title: string }[];
}
interface Enrollment {
  courseSlug: string;
  attendedToEnd: boolean;
  score: number | null;
  certificateNo: string | null;
}

export default function FormationsScreen({ navigation }: any) {
  const { user } = useAuth();
  const { t, lang } = useI18n();
  const fmt = (d?: string | null) =>
    d ? new Date(d).toLocaleString(lang === "en" ? "en-US" : "fr-FR", { dateStyle: "long", timeStyle: "short" }) : t("formations_date_tbd");
  const isTeacher = ["FORMATRICE", "PROFESSIONNELLE", "COACH", "ADMIN"].includes(user?.role || "");
  const [courses, setCourses] = useState<Course[]>([]);
  const [mine, setMine] = useState<Record<string, Enrollment>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [c, e] = await Promise.all([apiRequest<Course[]>("/catalog/courses"), apiRequest<any[]>("/catalog/my-enrollments")]);
      setCourses(c);
      setMine(Object.fromEntries(e.map((x) => [x.courseSlug, x])));
      setError(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t("formations_load_error"));
    }
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const getCert = async (slug: string) => {
    try { await apiRequest(`/catalog/courses/${slug}/complete`, { method: "POST" }); await load(); await downloadCert(slug); }
    catch (err) { Alert.alert(t("formations_oops"), err instanceof ApiError ? err.message : t("formations_retry_later")); }
  };
  const downloadCert = async (slug: string) => {
    try {
      const r = await apiRequest<{ pdf: string; fileName: string }>(`/catalog/courses/${slug}/certificate`);
      const uri = (FileSystem.cacheDirectory || "") + r.fileName;
      await FileSystem.writeAsStringAsync(uri, r.pdf, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { mimeType: "application/pdf", dialogTitle: t("formations_cert_share_title") });
      else Alert.alert(t("formations_cert_ready_title"), uri);
    } catch (err) { Alert.alert(t("formations_cert"), err instanceof ApiError ? err.message : t("formations_retry_later")); }
  };

  const enroll = async (slug: string) => {
    try {
      await apiRequest(`/catalog/courses/${slug}/enroll`, { method: "POST" });
      Alert.alert(t("formations_enroll_ok_title"), t("formations_enroll_ok"));
      load();
    } catch (err) {
      Alert.alert(t("formations_error"), err instanceof ApiError ? err.message : t("formations_retry_later"));
    }
  };

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg }}
      data={courses}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={
        <View>
          <ScreenTitle>{t("formations_title")}</ScreenTitle>
          <Text style={styles.intro}>{t("formations_intro")}</Text>
          {error && <Text style={styles.error}>{error}</Text>}
        </View>
      }
      ListEmptyComponent={!error ? <Text style={styles.intro}>{t("formations_empty")}</Text> : null}
      renderItem={({ item: c }) => {
        const e = mine[c.slug];
        const postponed = c.state === "REPORTEE";
        return (
          <Card>
            <Text style={styles.title}>
              {c.icon} {c.title}
            </Text>
            {c.partner ? <Text style={styles.meta}>{t("formations_with_partner")} {c.partner}</Text> : null}
            <Text style={styles.body}>{c.summary}</Text>
            <Text style={styles.meta}>⏱ {c.durationMin >= 60 ? (c.durationMin / 60).toString().replace(".", ",") + " h" : c.durationMin + " min"} · {c.certified === false ? t("formations_no_cert") : c.hasTest === false ? t("formations_cert_end") : t("formations_cert_after_test")}</Text>
            {postponed ? (
              <Text style={styles.postponed}>{t("formations_postponed").replace("{date}", fmt(c.postponedTo))}</Text>
            ) : (
              <Text style={styles.meta}>📅 {fmt(c.startsAt)}</Text>
            )}
            {e && c.videos && c.videos.length > 0 ? <PrimaryButton title={t("formations_watch_videos").replace("{n}", String(c.videos.length))} onPress={() => navigation.navigate("CourseVideos", { slug: c.slug, title: c.title })} /> : null}
            {c.liveState === "EN_COURS" && c.format !== "VIDEOS" ? (
              <PrimaryButton title={t("formations_join_live")} onPress={() => navigation.navigate("Live", { slug: c.slug, host: false })} />
            ) : null}
            {isTeacher ? (
              <PrimaryButton title={t("formations_start_live")} onPress={() => navigation.navigate("Live", { slug: c.slug, host: true })} />
            ) : null}
            {e && e.attendedToEnd && !e.certificateNo && c.certified !== false && c.hasTest === false ? <PrimaryButton title={t("formations_get_cert")} onPress={() => getCert(c.slug)} /> : null}
            {e && e.attendedToEnd && !e.certificateNo && c.certified !== false && c.hasTest !== false ? <PrimaryButton title={t("formations_take_test")} onPress={() => navigation.navigate("Test", { slug: c.slug, title: c.title })} /> : null}
            {e && e.certificateNo ? <PrimaryButton title={t("formations_download_cert")} onPress={() => downloadCert(c.slug)} /> : null}
            {e ? (
              <Text style={styles.ok}>
                {t("formations_enrolled")}
                {e.certificateNo ? t("formations_cert_no").replace("{no}", e.certificateNo) : c.certified === false ? "" : e.attendedToEnd ? (c.hasTest === false ? t("formations_course_done") : c.qcmReady === false ? t("formations_test_soon") : t("formations_test_ready")) : c.hasTest === false ? t("formations_cert_at_end") : c.format === "VIDEOS" ? t("formations_test_after_videos") : t("formations_test_after_live")}
              </Text>
            ) : (
              <PrimaryButton title={t("formations_see_and_enroll")} onPress={() => navigation.navigate("Course", { course: c })} />
            )}
            <SourcesBlock sources={c.sources} />
          </Card>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  intro: { color: "#6E5C68", marginBottom: spacing.md, lineHeight: 20 },
  title: { fontSize: 17, fontWeight: "700", color: colors.prune, marginBottom: 4 },
  meta: { fontSize: 12, color: "#6E5C68", marginTop: 4 },
  body: { fontSize: 14, color: colors.text, marginTop: 6, lineHeight: 20 },
  ok: { color: colors.success, fontWeight: "700", marginTop: spacing.sm },
  postponed: { fontSize: 12, color: "#7A5410", backgroundColor: "#FDF1DC", padding: spacing.sm, borderRadius: 10, marginTop: spacing.sm },
  error: { color: colors.danger, marginBottom: spacing.sm },
});
