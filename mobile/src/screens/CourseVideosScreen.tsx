import React, { useCallback, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ResizeMode, Video } from "expo-av";
import { useFocusEffect } from "@react-navigation/native";
import { ApiError, apiOrigin, apiRequest } from "../api/client";
import { colors, spacing } from "../theme/colors";
import { useI18n } from "../i18n";

// Les vidéos d'une formation : on les regarde dans l'ordre ; chacune terminée est cochée.
interface V { id: string; title: string; url: string; done: boolean }
export default function CourseVideosScreen({ route }: any) {
  const { t } = useI18n();
  const { slug, title } = route.params;
  const [vids, setVids] = useState<V[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try { const r = await apiRequest<{ videos: V[] }>(`/catalog/courses/${slug}/videos`); setVids(r.videos); setError(null); if (!open && r.videos.length) setOpen((r.videos.find((v) => !v.done) || r.videos[0]).id); }
    catch (e) { setError(e instanceof ApiError ? e.message : t("videos_load_error")); }
  }, [slug]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const markDone = async (id: string) => {
    if (vids.find((v) => v.id === id)?.done) return;
    try {
      const r = await apiRequest<{ done: number; total: number; allDone: boolean }>(`/catalog/courses/${slug}/videos/${id}/done`, { method: "POST" });
      setVids((l) => l.map((v) => (v.id === id ? { ...v, done: true } : v)));
      if (r.allDone) Alert.alert(t("videos_bravo_title"), t("videos_bravo"));
    } catch { /* hors ligne : on réessaiera à la prochaine vidéo */ }
  };
  const doneCount = vids.filter((v) => v.done).length;

  return (
    <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg, paddingBottom: 60 }}>
      <Text style={s.h1}>{title}</Text>
      {error ? <Text style={s.err}>{error}</Text> : <Text style={s.meta}>{doneCount} {doneCount > 1 ? t("videos_done_plural") : t("videos_done_singular")} {vids.length}</Text>}
      {vids.length > 0 ? <View style={s.bar}><View style={[s.fill, { width: `${(doneCount / vids.length) * 100}%` }]} /></View> : null}
      {vids.map((v, i) => (
        <View key={v.id} style={s.card}>
          <TouchableOpacity style={s.head} onPress={() => setOpen(open === v.id ? null : v.id)} activeOpacity={0.8}>
            <View style={[s.num, v.done && { backgroundColor: "#2FB67C" }]}><Text style={s.numT}>{v.done ? "✓" : i + 1}</Text></View>
            <Text style={s.t} numberOfLines={2}>{v.title}</Text>
            <Text style={{ color: colors.rose, fontSize: 20 }}>{open === v.id ? "⌃" : "▶"}</Text>
          </TouchableOpacity>
          {open === v.id ? (
            <Video source={{ uri: v.url.startsWith("http") ? v.url : apiOrigin + v.url }} style={s.video} useNativeControls resizeMode={ResizeMode.CONTAIN} shouldPlay={false}
              onPlaybackStatusUpdate={(st: any) => { if (st?.didJustFinish) markDone(v.id); }} />
          ) : null}
        </View>))}
      {!error && vids.length === 0 ? <Text style={s.meta}>{t("videos_coming_soon")}</Text> : null}
    </ScrollView>
  );
}
const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background }, h1: { fontSize: 20, fontWeight: "800", color: colors.prune, marginBottom: 6 },
  meta: { color: "#6E5C68", marginBottom: 8 }, err: { color: "#C23B3B", marginVertical: 10 },
  bar: { height: 8, borderRadius: 4, backgroundColor: "#F0E0E6", marginBottom: 16, overflow: "hidden" }, fill: { height: 8, backgroundColor: "#2FB67C" },
  card: { backgroundColor: "#fff", borderRadius: 18, marginBottom: 12, overflow: "hidden", elevation: 1 },
  head: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 }, num: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.rose, alignItems: "center", justifyContent: "center" }, numT: { color: "#fff", fontWeight: "800" },
  t: { flex: 1, color: colors.prune, fontWeight: "700", fontSize: 15 }, video: { width: "100%", height: 210, backgroundColor: "#000" },
});
