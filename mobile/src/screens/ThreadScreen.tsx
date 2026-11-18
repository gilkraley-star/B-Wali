import { useRealtime } from "../realtime/realtime";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, FlatList, Image, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TextInput as RNTextInput, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio, ResizeMode, Video } from "expo-av";
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
  mediaType?: "image" | "video" | "audio" | null;
  durationSec?: number | null;
  createdAt?: string;
  mine?: boolean;
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
function MediaView({ url, type }: { url: string; type: "image" | "video" | "audio" }) {
  if (type === "audio") return null;
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


// Message vocal : lecture / pause avec la durée
function VoicePlayer({ url, duration, mine }: { url: string; duration?: number | null; mine: boolean }) {
  const [snd, setSnd] = useState<Audio.Sound | null>(null);
  const [playing, setPlaying] = useState(false);
  const [pos, setPos] = useState(0);
  useEffect(() => () => { snd?.unloadAsync().catch(() => {}); }, [snd]);
  const toggle = async () => {
    try {
      if (snd) {
        const st: any = await snd.getStatusAsync();
        if (st.isLoaded && st.isPlaying) { await snd.pauseAsync(); return; }
        if (st.isLoaded && st.didJustFinish) await snd.setPositionAsync(0);
        await snd.playAsync(); return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: apiOrigin + url }, { shouldPlay: true }, (st: any) => {
        if (!st.isLoaded) return;
        setPlaying(st.isPlaying); setPos(Math.round((st.positionMillis || 0) / 1000));
        if (st.didJustFinish) { setPlaying(false); setPos(0); sound?.setPositionAsync(0).catch(() => {}); }
      });
      setSnd(sound);
    } catch { Alert.alert("Vocal", "Impossible de lire ce message vocal."); }
  };
  const total = duration || 0;
  const fmt = (n: number) => `${Math.floor(n / 60)}:${String(n % 60).padStart(2, "0")}`;
  const col = mine ? "#fff" : colors.rose;
  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.8} style={{ flexDirection: "row", alignItems: "center", gap: 10, minWidth: 170, paddingVertical: 4 }}>
      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: mine ? "rgba(255,255,255,0.25)" : "#FFE9EE", alignItems: "center", justifyContent: "center" }}><Text style={{ color: col, fontSize: 16 }}>{playing ? "❚❚" : "▶"}</Text></View>
      <View style={{ flex: 1 }}>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: mine ? "rgba(255,255,255,0.35)" : "#F2D3DA" }}><View style={{ height: 4, borderRadius: 2, width: `${total ? Math.min(100, (pos / total) * 100) : 0}%`, backgroundColor: col }} /></View>
        <Text style={{ fontSize: 11.5, marginTop: 4, color: mine ? "#FFE9EE" : colors.textMuted }}>🎤 {fmt(playing || pos ? pos : total)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const REC_OPTIONS: any = {
  ...Audio.RecordingOptionsPresets.HIGH_QUALITY,
  android: { ...Audio.RecordingOptionsPresets.HIGH_QUALITY.android, numberOfChannels: 1, sampleRate: 22050, bitRate: 48000 },
  ios: { ...Audio.RecordingOptionsPresets.HIGH_QUALITY.ios, numberOfChannels: 1, sampleRate: 22050, bitRate: 48000 },
};
const MAX_REC = 120;

export default function ThreadScreen({ route, navigation }: any) {
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
  const [menu, setMenu] = useState<{ c?: Comment; isPost?: boolean } | null>(null);
  const [rec, setRec] = useState<{ r: Audio.Recording; sec: number } | null>(null);
  const list = useRef<FlatList>(null);
  useEffect(() => { apiRequest<typeof FALLBACK_REASONS>("/forum/report-reasons", { silent: true }).then(setReasons).catch(() => {}); }, []);

  const load = useCallback(() => {
    apiRequest<Post>(`/forum/posts/${postId}`, { silent: true }).then((p) => { setPost(p); navigation.setOptions({ title: p.title }); });
  }, [postId]);

  useFocusEffect(load);
  // Temps réel : un nouveau message, un vocal ou une réaction arrive sans rien actualiser
  useRealtime((e) => { if (e.t === "comment" && e.post === postId) load(); });
  useEffect(() => () => { rec?.r.stopAndUnloadAsync().catch(() => {}); }, []);
  useEffect(() => { if (!rec) return; const id = setInterval(() => setRec((x) => (x ? { ...x, sec: x.sec + 1 } : x)), 1000); return () => clearInterval(id); }, [!!rec]);
  useEffect(() => { if (rec && rec.sec >= MAX_REC) stopRec(true); }, [rec?.sec]);

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert("Autorisation nécessaire", "Autorise l'accès à tes photos pour en envoyer une."); return; }
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.6, videoMaxDuration: 30, exif: false });
    if (res.canceled || !res.assets[0]) return;
    const a = res.assets[0];
    const kind = a.type === "video" ? "video" : "image";
    setAttachment({ uri: a.uri, kind, mime: a.mimeType || (kind === "video" ? "video/mp4" : "image/jpeg") });
  };

  const send = async (extra?: { url: string; kind: "image" | "video" | "audio"; dur?: number }) => {
    const text = extra ? "" : reply.trim();
    if (!text && !attachment && !extra) return;
    if (!requireOnline()) return;
    setSending(true);
    try {
      let media: { url: string; kind: "image" | "video" | "audio"; dur?: number } | null = extra || null;
      if (!media && attachment) media = await uploadMedia(attachment.uri, attachment.mime);
      await apiRequest(`/forum/posts/${postId}/comments`, { method: "POST", body: { body: text, ...(media ? { mediaUrl: media.url, mediaType: media.kind, ...(media.dur ? { durationSec: media.dur } : {}) } : {}) } });
      setReply(""); setAttachment(null);
      load();
    } catch (e) {
      if (e instanceof ApiError && e.status !== 0) Alert.alert("Message non envoyé", e.message);
    } finally { setSending(false); }
  };

  const startRec = async () => {
    try {
      const p = await Audio.requestPermissionsAsync();
      if (!p.granted) { Alert.alert("Micro", "Autorise le micro pour envoyer un message vocal."); return; }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(REC_OPTIONS);
      setRec({ r: recording, sec: 0 });
    } catch { Alert.alert("Micro", "Impossible de démarrer l'enregistrement."); }
  };
  const stopRec = async (sendIt: boolean) => {
    const cur = rec; if (!cur) return; setRec(null);
    try {
      await cur.r.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = cur.r.getURI();
      if (!sendIt || !uri || cur.sec < 1) return;
      if (!requireOnline()) return;
      setSending(true);
      try {
        const up = await uploadMedia(uri, "audio/mp4");
        await send({ url: up.url, kind: "audio", dur: cur.sec });
      } finally { setSending(false); }
    } catch (e: any) { if (e instanceof ApiError && e.status !== 0) Alert.alert("Vocal non envoyé", e.message); }
  };

  const openReport = (targetId: string, kind: "postId" | "commentId") => { setMenu(null); setReportReason(""); setReportTarget({ id: targetId, kind }); };
  const submitReport = async () => {
    if (!reportTarget || !reportReason.trim()) return;
    await apiRequest("/forum/reports", { method: "POST", body: { [reportTarget.kind]: reportTarget.id, reason: reportReason } })
      .then(() => { setReportTarget(null); Alert.alert(t("forum_report"), "Signalement envoyé, merci."); })
      .catch((e: any) => { setReportTarget(null); Alert.alert(t("forum_report"), e?.message || "Impossible d'envoyer."); });
  };

  const react = async (c: Comment, emoji: string) => {
    setMenu(null);
    try {
      await apiRequest(`/forum/comments/${c.id}/reaction`, { method: "PUT", body: { emoji } });
      load();
    } catch (e: any) { Alert.alert("Oups", e?.message || "Impossible pour le moment."); }
  };

  if (!post) return null;
  const hhmm = (d?: string) => (d ? new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }) : "");
  const data: (Comment & { first?: boolean })[] = [{ id: "first-" + post.id, body: post.body, author: post.author, first: true, mine: (post as any).mine, createdAt: (post as any).createdAt } as any, ...post.comments];

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <FlatList
        ref={list}
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: 8 }}
        data={data}
        keyExtractor={(c) => c.id}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        ListHeaderComponent={<Text style={styles.retention}>⏳ Les vieux messages disparaissent après {post.retentionHours ?? 48} h. Appuie longuement sur un message pour réagir ou le signaler.</Text>}
        renderItem={({ item }) => {
          const mine = !!item.mine;
          const counts = Object.entries((item.reactionCounts || {}) as Record<string, number>).filter(([, n]) => n > 0);
          return (
            <View style={{ alignItems: mine ? "flex-end" : "flex-start", marginBottom: 10 }}>
              {!mine && <Text style={styles.who}>{item.author.pseudonyme}</Text>}
              <TouchableOpacity activeOpacity={0.9} onLongPress={() => setMenu(item.first ? { isPost: true } : { c: item })} style={[styles.bubble, mine ? styles.mine : styles.other, item.first && { borderWidth: 1.5, borderColor: "#F2B8C6" }]}>
                {item.first ? <Text style={[styles.topic, mine && { color: "#fff" }]}>{post.title}</Text> : null}
                {!!item.body && <Text style={[styles.msg, mine && { color: "#fff" }]}>{item.body}</Text>}
                {item.mediaUrl && item.mediaType === "audio" ? <VoicePlayer url={item.mediaUrl} duration={item.durationSec} mine={mine} /> : null}
                {item.mediaUrl && (item.mediaType === "image" || item.mediaType === "video") ? <MediaView url={item.mediaUrl} type={item.mediaType} /> : null}
                <Text style={[styles.time, mine && { color: "#FFE0E6" }]}>{hhmm(item.createdAt)}</Text>
              </TouchableOpacity>
              {counts.length ? <View style={{ flexDirection: "row", gap: 4, marginTop: 2 }}>{counts.map(([e, n]) => <Text key={e} style={styles.react}>{e} {n}</Text>)}</View> : null}
            </View>
          );
        }}
      />
      {attachment ? (
        <View style={styles.attachRow}><Text style={styles.muted}>{attachment.kind === "video" ? "🎬 Vidéo prête" : "🖼️ Photo prête"}</Text><Text style={styles.reportLink} onPress={() => setAttachment(null)}>Retirer</Text></View>
      ) : null}
      {rec ? (
        <View style={styles.composer}>
          <TouchableOpacity onPress={() => stopRec(false)} style={styles.roundBtn}><Text style={{ fontSize: 18 }}>🗑️</Text></TouchableOpacity>
          <View style={styles.recBar}><Text style={{ color: "#C23B3B", fontWeight: "800" }}>● {Math.floor(rec.sec / 60)}:{String(rec.sec % 60).padStart(2, "0")}</Text><Text style={{ color: colors.textMuted, fontSize: 12 }}>  Enregistrement…</Text></View>
          <TouchableOpacity onPress={() => stopRec(true)} style={[styles.roundBtn, { backgroundColor: colors.rose }]}><Text style={{ color: "#fff", fontSize: 18 }}>➤</Text></TouchableOpacity>
        </View>
      ) : (
        <View style={styles.composer}>
          <TouchableOpacity onPress={pickMedia} style={styles.roundBtn} accessibilityLabel="Ajouter une photo ou une vidéo"><Text style={{ fontSize: 19 }}>📎</Text></TouchableOpacity>
          <RNTextInput value={reply} onChangeText={setReply} placeholder="Écris ton message…" placeholderTextColor="#A78" multiline style={styles.input} />
          {reply.trim() || attachment ? (
            <TouchableOpacity onPress={() => send()} disabled={sending} style={[styles.roundBtn, { backgroundColor: colors.rose }]}><Text style={{ color: "#fff", fontSize: 18 }}>{sending ? "…" : "➤"}</Text></TouchableOpacity>
          ) : (
            <TouchableOpacity onPress={startRec} disabled={sending} style={[styles.roundBtn, { backgroundColor: colors.rose }]} accessibilityLabel="Enregistrer un message vocal"><Text style={{ fontSize: 19 }}>🎤</Text></TouchableOpacity>
          )}
        </View>
      )}

      <Modal visible={!!menu} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenu(null)}>
          <View style={styles.modalCard}>
            {menu?.c ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 12 }}>
              {EMOJIS.map((e) => <TouchableOpacity key={e} onPress={() => react(menu.c!, e)} style={{ padding: 8, borderRadius: 999, backgroundColor: menu.c!.myReaction === e ? "#FFE0E6" : "#F5EEF2" }}><Text style={{ fontSize: 24 }}>{e}</Text></TouchableOpacity>)}
            </View> : null}
            <PrimaryButton title={t("forum_report")} variant="secondary" onPress={() => openReport(menu?.isPost ? post.id : menu!.c!.id, menu?.isPost ? "postId" : "commentId")} />
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={!!reportTarget} transparent animationType="fade" onRequestClose={() => setReportTarget(null)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.postTitle}>{t("forum_report")}</Text>
            <Text style={styles.muted}>Pourquoi tu signales ?</Text>
            {reasons.map((r) => (
              <TouchableOpacity key={r.code} onPress={() => setReportReason(r.code)} style={{ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 14, marginTop: 6, backgroundColor: reportReason === r.code ? "#FFE0E6" : "#F5EEF2" }}>
                <Text style={{ fontWeight: reportReason === r.code ? "800" : "500", color: colors.text }}>{r.label}</Text>
              </TouchableOpacity>))}
            <PrimaryButton title={t("forum_report_send")} onPress={submitReport} />
            <PrimaryButton title={t("cancel")} variant="secondary" onPress={() => setReportTarget(null)} />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  postTitle: { fontSize: 18, fontWeight: "700", color: colors.prune },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  reportLink: { color: colors.danger, fontSize: 12 },
  retention: { fontSize: 12, color: colors.textMuted, backgroundColor: "#FFF0E9", borderRadius: 12, padding: spacing.sm, marginBottom: spacing.sm, overflow: "hidden", lineHeight: 17 },
  who: { fontSize: 11.5, color: colors.textMuted, marginBottom: 2, marginLeft: 8 },
  bubble: { maxWidth: "82%", borderRadius: 18, paddingHorizontal: 13, paddingVertical: 9 },
  mine: { backgroundColor: colors.rose, borderBottomRightRadius: 5 }, other: { backgroundColor: "#fff", borderBottomLeftRadius: 5 },
  topic: { fontWeight: "800", fontSize: 15.5, color: colors.prune, marginBottom: 4 },
  msg: { color: colors.text, fontSize: 15, lineHeight: 21 }, time: { fontSize: 10.5, color: colors.textMuted, alignSelf: "flex-end", marginTop: 3 },
  react: { backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, fontSize: 12, overflow: "hidden" },
  media: { width: 220, height: 200, borderRadius: 14, marginTop: 4, backgroundColor: "#000" },
  mediaHidden: { width: 200, height: 110, borderRadius: 14, marginTop: 4, backgroundColor: "#E7D5FF", alignItems: "center", justifyContent: "center" },
  mediaHiddenText: { color: colors.text, fontWeight: "700", fontSize: 13, textAlign: "center", padding: 8 },
  attachRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: 6, backgroundColor: "#fff" },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 10, paddingVertical: 8, paddingBottom: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F5E8EC" },
  input: { flex: 1, maxHeight: 110, backgroundColor: "#FFF6F0", borderRadius: 22, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10, fontSize: 15, color: colors.text },
  roundBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFE9EE", alignItems: "center", justifyContent: "center" },
  recBar: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#FFF6F0", borderRadius: 22, paddingHorizontal: 16, height: 44 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: spacing.lg },
  modalCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg },
});
