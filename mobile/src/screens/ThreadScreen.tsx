import React, { useCallback, useEffect, useState } from "react";
import { Alert, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ResizeMode, Video } from "expo-av";
import { useFocusEffect } from "@react-navigation/native";
import { apiOrigin, apiRequest, ApiError, uploadMedia } from "../api/client";
import { useNet } from "../context/NetContext";
import { useI18n } from "../i18n";
import { colors, spacing } from "../theme/colors";
import { Card, PrimaryButton, TextInput } from "../theme/ui";

interface Comment {
  id: string;
  body: string;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | null;
  author: { pseudonyme: string };
  reactionCounts?: Record<string, number>;
  myReaction?: string | null;
}

const EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🙏", "👏", "💪"];
const FALLBACK_REASONS = [
  { code: "HAINE", label: "Message haineux ou insultant" }, { code: "RACISME", label: "Racisme" }, { code: "HARCELEMENT", label: "Harcèlement" },
  { code: "VIOLENCE", label: "Menaces ou violence" }, { code: "SEXUEL", label: "Contenu sexuel ou choquant" }, { code: "PROFIL_SUSPECT", label: "Profil suspect" },
  { code: "ARNAQUE", label: "Arnaque ou demande d'argent" }, { code: "SPAM", label: "Spam" }, { code: "AUTRE", label: "Autre raison" },
];

interface Post {
  id: string;
  title: string;
  body: string;
  author: { pseudonyme: string };
  comments: Comment[];
  maxMessages?: number;
  retentionHours?: number;
}

// Photo ou vidéo d'un message : floutée tant qu'on n'appuie pas dessus (protège les plus jeunes).
function MediaView({ url, type }: { url: string; type: "image" | "video" }) {
  const [shown, setShown] = useState(false);
  const uri = apiOrigin + url;
  if (!shown) {
    return (
      <TouchableOpacity onPress={() => setShown(true)} style={styles.mediaHidden} accessibilityRole="button">
        <Text style={styles.mediaHiddenText}>{type === "video" ? "🎬 Vidéo" : "🖼️ Photo"} — appuie pour afficher</Text>
      </TouchableOpacity>
    );
  }
  return type === "video" ? (
    <Video source={{ uri }} style={styles.media} useNativeControls resizeMode={ResizeMode.CONTAIN} />
  ) : (
    <Image source={{ uri }} style={styles.media} resizeMode="cover" />
  );
}

export default function ThreadScreen({ route }: any) {
  const { postId } = route.params;
  const { t } = useI18n();
  const [post, setPost] = useState<Post | null>(null);
  const { requireOnline } = useNet();
  const [reply, setReply] = useState("");
  const [attachment, setAttachment] = useState<{ uri: string; mime: string; kind: "image" | "video" } | null>(null);
  const [sending, setSending] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ id: string; kind: "postId" | "commentId" } | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [reasons, setReasons] = useState(FALLBACK_REASONS);
  useEffect(() => { apiRequest<typeof FALLBACK_REASONS>("/forum/report-reasons", { silent: true }).then(setReasons).catch(() => {}); }, []);

  const load = useCallback(() => {
    apiRequest<Post>(`/forum/posts/${postId}`).then(setPost);
  }, [postId]);

  useFocusEffect(load);

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Autorisation nécessaire", "Autorise l'accès à tes photos pour en envoyer une.");
      return;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      quality: 0.6, // photo allégée : moins de données mobiles
      videoMaxDuration: 30,
      exif: false, // pas de lieu caché dans la photo
    });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    const kind = a.type === "video" ? "video" : "image";
    setAttachment({ uri: a.uri, kind, mime: a.mimeType || (kind === "video" ? "video/mp4" : "image/jpeg") });
  };

  const handleReply = async () => {
    if (!reply.trim() && !attachment) return;
    if (!requireOnline()) return; // jolie notification si pas de réseau
    setSending(true);
    try {
      let media: { url: string; kind: "image" | "video" } | null = null;
      if (attachment) media = await uploadMedia(attachment.uri, attachment.mime);
      await apiRequest(`/forum/posts/${postId}/comments`, {
        method: "POST",
        body: { body: reply, ...(media ? { mediaUrl: media.url, mediaType: media.kind } : {}) },
      });
      setReply("");
      setAttachment(null);
      load();
    } catch (e) {
      if (e instanceof ApiError && e.status !== 0) Alert.alert("Message non envoyé", e.message);
    } finally {
      setSending(false);
    }
  };

  const openReport = (targetId: string, kind: "postId" | "commentId") => {
    setReportReason("");
    setReportTarget({ id: targetId, kind });
  };

  const submitReport = async () => {
    if (!reportTarget || !reportReason.trim()) return;
    await apiRequest("/forum/reports", {
      method: "POST",
      body: { [reportTarget.kind]: reportTarget.id, reason: reportReason },
    }).then(() => { setReportTarget(null); Alert.alert(t("forum_report"), "Signalement envoyé, merci."); })
      .catch((e: any) => { setReportTarget(null); Alert.alert(t("forum_report"), e?.message || "Impossible d'envoyer."); });
  };

  const react = async (c: Comment, emoji: string) => {
    try {
      await apiRequest(`/forum/comments/${c.id}/reaction`, { method: "PUT", body: { emoji } });
      setPost((p) => p && {
        ...p,
        comments: p.comments.map((x) => {
          if (x.id !== c.id) return x;
          const counts = { ...(x.reactionCounts || {}) };
          if (x.myReaction) counts[x.myReaction] = Math.max(0, (counts[x.myReaction] || 1) - 1);
          const mine = x.myReaction === emoji ? null : emoji;
          if (mine) counts[mine] = (counts[mine] || 0) + 1;
          return { ...x, reactionCounts: counts, myReaction: mine };
        }),
      });
    } catch (e: any) { Alert.alert("Oups", e?.message || "Impossible pour le moment."); }
  };

  if (!post) return null;

  return (
    <FlatList
      style={styles.container}
      contentContainerStyle={{ padding: spacing.lg }}
      data={post.comments}
      keyExtractor={(c) => c.id}
      ListHeaderComponent={
        <View>
          <Card>
            <Text style={styles.postTitle}>{post.title}</Text>
            <Text style={styles.postBody}>{post.body}</Text>
            <Text style={styles.muted}>{post.author.pseudonyme}</Text>
            <Text style={styles.reportLink} onPress={() => openReport(post.id, "postId")}>
              {t("forum_report")}
            </Text>
          </Card>
          <Text style={styles.sectionHeader}>{t("forum_comment")}</Text>
          <Text style={styles.retention}>
            ⏳ Les vieux messages disparaissent après {post.retentionHours ?? 48} h.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <Card>
          {!!item.body && <Text style={styles.commentBody}>{item.body}</Text>}
          {item.mediaUrl && item.mediaType && <MediaView url={item.mediaUrl} type={item.mediaType} />}
          <Text style={styles.muted}>{item.author.pseudonyme}</Text>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {EMOJIS.map((e) => {
              const n = item.reactionCounts?.[e] || 0; const mine = item.myReaction === e;
              return (
                <TouchableOpacity key={e} onPress={() => react(item, e)} style={{ flexDirection: "row", alignItems: "center", borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: mine ? "#FFE0E6" : "#F5EEF3", borderWidth: mine ? 1.5 : 0, borderColor: colors.rose }}>
                  <Text style={{ fontSize: 15 }}>{e}</Text>{n > 0 && <Text style={{ fontSize: 12, fontWeight: "700", marginLeft: 3 }}>{n}</Text>}
                </TouchableOpacity>);
            })}
          </View>
          <Text style={styles.reportLink} onPress={() => openReport(item.id, "commentId")}>
            {t("forum_report")}
          </Text>
        </Card>
      )}
      ListFooterComponent={
        <View style={{ marginTop: spacing.md }}>
          <TextInput value={reply} onChangeText={setReply} placeholder={t("forum_comment")} multiline />
          {attachment && (
            <View style={styles.attachRow}>
              <Text style={styles.muted}>{attachment.kind === "video" ? "🎬 Vidéo prête" : "🖼️ Photo prête"}</Text>
              <Text style={styles.reportLink} onPress={() => setAttachment(null)}>Retirer</Text>
            </View>
          )}
          <PrimaryButton title="📎 Ajouter une photo ou une vidéo" variant="secondary" onPress={pickMedia} />
          <PrimaryButton title={t("forum_comment")} onPress={handleReply} loading={sending} />

          <Modal visible={!!reportTarget} transparent animationType="fade" onRequestClose={() => setReportTarget(null)}>
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
                <Text style={styles.postTitle}>{t("forum_report")}</Text>
                <Text style={styles.muted}>Pourquoi tu signales ?</Text>
                {reasons.map((r) => (
                  <TouchableOpacity key={r.code} onPress={() => setReportReason(r.code)} style={{ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 14, marginTop: 6, backgroundColor: reportReason === r.code ? "#FFE0E6" : "#F5EEF3" }}>
                    <Text style={{ fontWeight: reportReason === r.code ? "800" : "500", color: colors.text }}>{r.label}</Text>
                  </TouchableOpacity>))}
                <PrimaryButton title={t("forum_report_send")} onPress={submitReport} />
                <PrimaryButton title={t("cancel")} variant="secondary" onPress={() => setReportTarget(null)} />
              </View>
            </View>
          </Modal>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  postTitle: { fontSize: 18, fontWeight: "700", color: colors.prune },
  postBody: { color: colors.text, marginVertical: spacing.sm },
  commentBody: { color: colors.text },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  reportLink: { color: colors.danger, fontSize: 12, marginTop: spacing.xs },
  sectionHeader: { fontSize: 14, color: colors.textMuted, marginVertical: spacing.sm, textTransform: "uppercase" },
  retention: { fontSize: 12, color: colors.textMuted, backgroundColor: "#FFF0E9", borderRadius: 12, padding: spacing.sm, marginBottom: spacing.sm, overflow: "hidden", lineHeight: 17 },
  media: { width: "100%", height: 220, borderRadius: 14, marginTop: spacing.sm, backgroundColor: "#000" },
  mediaHidden: { height: 120, borderRadius: 14, marginTop: spacing.sm, backgroundColor: "#E7D5FF", alignItems: "center", justifyContent: "center" },
  mediaHiddenText: { color: colors.text, fontWeight: "700", fontSize: 13 },
  attachRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.xs },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: spacing.lg },
  modalCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg },
});
