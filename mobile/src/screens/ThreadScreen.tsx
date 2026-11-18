import { useRealtime } from "../realtime/realtime";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, FlatList, Image, KeyboardAvoidingView, Modal, PanResponder, Platform, StyleSheet, Text, TextInput as RNTextInput, TouchableOpacity, View, Vibration } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Audio, ResizeMode, Video } from "expo-av";
import { useFocusEffect } from "@react-navigation/native";
import { apiOrigin, apiRequest, ApiError, uploadMedia } from "../api/client";
import { useNet } from "../context/NetContext";
import { useI18n } from "../i18n";
import { colors, spacing } from "../theme/colors";
import { Card, PrimaryButton, TextInput } from "../theme/ui";
import { play } from "../games/sounds";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AV = ["#FF8FA3", "#9B7BEA", "#4FB89A", "#F4A261", "#5AA9E6", "#E76F9A", "#8AB06B"];
const avColor = (n: string) => AV[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length];
const dayLabel = (d?: string) => { if (!d) return ""; const x = new Date(d), n = new Date(); const diff = Math.round((new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime() - new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()) / 86400000); return diff === 0 ? "Aujourd'hui" : diff === 1 ? "Hier" : x.toLocaleDateString("fr-FR", { day: "numeric", month: "long" }); };

interface Comment {
  id: string;
  body: string;
  mediaUrl?: string | null;
  mediaType?: "image" | "video" | "audio" | null;
  durationSec?: number | null;
  createdAt?: string;
  mine?: boolean;
  replyTo?: { id: string; body: string; mediaType?: string | null; author: { pseudonyme: string } } | null;
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
  // Les photos s'affichent tout de suite ; seules les vidéos (plus lourdes à charger) restent
  // derrière un appui, pour ne pas consommer de données sans que la fille l'ait demandé.
  const [shown, setShown] = useState(type === "image");
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
  const loading = useRef(false);
  useEffect(() => () => { snd?.unloadAsync().catch(() => {}); }, [snd]);
  const toggle = async () => {
    if (loading.current) return;
    try {
      if (snd) {
        const st: any = await snd.getStatusAsync();
        if (st.isLoaded && st.isPlaying) { await snd.pauseAsync(); return; }
        if (st.isLoaded && st.didJustFinish) await snd.setPositionAsync(0);
        await snd.playAsync(); return;
      }
      loading.current = true;
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false, playsInSilentModeIOS: true });
      const { sound } = await Audio.Sound.createAsync({ uri: apiOrigin + url }, { shouldPlay: true, isLooping: false }, (st: any) => {
        if (!st.isLoaded) return;
        if (st.didJustFinish) {
          // Il faut explicitement mettre en pause avant de revenir au début : sinon le lecteur
          // repart aussitôt de zéro (le vocal semblait "ne plus s'arrêter", en vrai il rejouait
          // en boucle à l'infini).
          setPlaying(false); setPos(0);
          sound.pauseAsync().then(() => sound.setPositionAsync(0)).catch(() => {});
          return;
        }
        setPlaying(st.isPlaying); setPos(Math.round((st.positionMillis || 0) / 1000));
      });
      setSnd(sound);
    } catch { Alert.alert("Vocal", "Impossible de lire ce message vocal."); }
    finally { loading.current = false; }
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
  const [recSec, setRecSec] = useState<number | null>(null);
  const [cancelZone, setCancelZone] = useState(false);
  const [quoted, setQuoted] = useState<Comment | null>(null);
  const recRef = useRef<Audio.Recording | null>(null);
  const secRef = useRef(0);
  const tick = useRef<any>(null);
  const dragX = useRef(new Animated.Value(0)).current;
  const micScale = useRef(new Animated.Value(1)).current;
  const cancelRef = useRef(false);
  const holding = useRef(false);
  const fns = useRef<{ start: () => void; stop: (send: boolean) => void }>({ start: () => {}, stop: () => {} });
  const list = useRef<FlatList>(null);
  const [tip, setTip] = useState(false);
  const seen = useRef(0);
  useEffect(() => { AsyncStorage.getItem("wali.forum.tip.v1").then((v) => { if (!v) { setTip(true); AsyncStorage.setItem("wali.forum.tip.v1", "1"); } }).catch(() => {}); }, []);
  useEffect(() => { apiRequest<typeof FALLBACK_REASONS>("/forum/report-reasons", { silent: true }).then(setReasons).catch(() => {}); }, []);

  const load = useCallback(() => {
    apiRequest<Post>(`/forum/posts/${postId}`, { silent: true }).then((p) => { setPost(p); navigation.setOptions({ title: p.title }); });
  }, [postId]);

  useFocusEffect(load);
  useEffect(() => {
    const n = post ? post.comments.length : 0;
    if (post && seen.current && n > seen.current && !post.comments[n - 1]?.mine) play("receive");
    if (post) seen.current = n || 1;
  }, [post?.comments.length]);
  // Temps réel : un nouveau message, un vocal ou une réaction arrive sans rien actualiser
  useRealtime((e) => { if (e.t === "comment" && e.post === postId) load(); });
  useEffect(() => () => { clearInterval(tick.current); recRef.current?.stopAndUnloadAsync().catch(() => {}); }, []);

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
      await apiRequest(`/forum/posts/${postId}/comments`, { method: "POST", body: { body: text, ...(quoted ? { replyToId: quoted.id } : {}), ...(media ? { mediaUrl: media.url, mediaType: media.kind, ...(media.dur ? { durationSec: media.dur } : {}) } : {}) } });
      setReply(""); setAttachment(null); setQuoted(null);
      play("send");
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
      // Doigt déjà relâché pendant la préparation du micro : on arrête tout de suite.
      if (!holding.current) { recording.stopAndUnloadAsync().catch(() => {}); Audio.setAudioModeAsync({ allowsRecordingIOS: false }).catch(() => {}); return; }
      recRef.current = recording; secRef.current = 0; setRecSec(0); play("recstart"); Vibration.vibrate(18);
      clearInterval(tick.current);
      tick.current = setInterval(() => { secRef.current += 1; setRecSec(secRef.current); if (secRef.current >= MAX_REC) fns.current.stop(true); }, 1000);
    } catch { Alert.alert("Micro", "Impossible de démarrer l'enregistrement."); }
  };
  const stopRec = async (sendIt: boolean) => {
    clearInterval(tick.current);
    const r = recRef.current; recRef.current = null;
    const sec = secRef.current; setRecSec(null); setCancelZone(false);
    if (!r) return;
    try {
      await r.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = r.getURI();
      if (!sendIt || !uri) return;
      if (sec < 1) { Alert.alert("Message vocal", "Maintiens le micro appuyé pour enregistrer, puis relâche pour envoyer."); return; }
      if (!requireOnline()) return;
      setSending(true);
      try { const up = await uploadMedia(uri, "audio/mp4"); await send({ url: up.url, kind: "audio", dur: sec }); }
      finally { setSending(false); }
    } catch (e: any) { if (e instanceof ApiError && e.status !== 0) Alert.alert("Vocal non envoyé", e.message); }
  };
  fns.current = { start: startRec, stop: stopRec };

  // Geste du micro : on maintient pour enregistrer, on glisse vers la gauche pour annuler (comme dans les messageries).
  const mic = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        cancelRef.current = false; holding.current = true; dragX.setValue(0);
        Animated.spring(micScale, { toValue: 1.35, useNativeDriver: true, friction: 5 }).start();
        fns.current.start();
      },
      onPanResponderMove: (_e, g) => {
        const dx = Math.max(-150, Math.min(0, g.dx));
        dragX.setValue(dx);
        const c = dx < -95;
        if (c !== cancelRef.current) { cancelRef.current = c; setCancelZone(c); if (c) Vibration.vibrate(22); }
      },
      onPanResponderRelease: () => {
        holding.current = false;
        Animated.parallel([
          Animated.spring(micScale, { toValue: 1, useNativeDriver: true, friction: 5 }),
          Animated.timing(dragX, { toValue: 0, duration: 140, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        ]).start();
        fns.current.stop(!cancelRef.current);
      },
      onPanResponderTerminate: () => {
        holding.current = false; micScale.setValue(1); dragX.setValue(0);
        fns.current.stop(false);
      },
    })
  ).current;

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
        ListHeaderComponent={tip ? (
          <TouchableOpacity activeOpacity={0.9} onPress={() => setTip(false)} style={styles.tip}>
            <Text style={styles.tipT}>💡 Ici, on s'écrit en direct. Les vieux messages disparaissent après {post.retentionHours ?? 48} h. Appuie longuement sur un message pour réagir ou le signaler.</Text>
            <Text style={styles.tipOk}>Compris ✓</Text>
          </TouchableOpacity>) : null}
        renderItem={({ item, index }) => {
          const mine = !!item.mine;
          const prev = index > 0 ? data[index - 1] : null;
          const next = index < data.length - 1 ? data[index + 1] : null;
          const sameAsPrev = !!prev && prev.author.pseudonyme === item.author.pseudonyme && !!prev.mine === mine && Math.abs(new Date(item.createdAt || 0).getTime() - new Date(prev.createdAt || 0).getTime()) < 5 * 60000;
          const sameAsNext = !!next && next.author.pseudonyme === item.author.pseudonyme && !!next.mine === mine && Math.abs(new Date(next.createdAt || 0).getTime() - new Date(item.createdAt || 0).getTime()) < 5 * 60000;
          const newDay = !prev || dayLabel(prev.createdAt) !== dayLabel(item.createdAt);
          const counts = Object.entries((item.reactionCounts || {}) as Record<string, number>).filter(([, n]) => n > 0);
          const name = item.author.pseudonyme;
          return (
            <View>
              {newDay ? <View style={styles.dayWrap}><Text style={styles.day}>{dayLabel(item.createdAt)}</Text></View> : null}
              <View style={{ flexDirection: "row", justifyContent: mine ? "flex-end" : "flex-start", alignItems: "flex-end", marginTop: sameAsPrev ? 2 : 10 }}>
                {!mine && (sameAsNext ? <View style={{ width: 34 }} /> : <View style={[styles.avatar, { backgroundColor: avColor(name) }]}><Text style={styles.avatarT}>{name.trim().charAt(0).toUpperCase() || "?"}</Text></View>)}
                <View style={{ maxWidth: "80%", alignItems: mine ? "flex-end" : "flex-start" }}>
                  {!mine && !sameAsPrev ? <Text style={[styles.who, { color: avColor(name) }]}>{name}</Text> : null}
                  <TouchableOpacity activeOpacity={0.9} onLongPress={() => setMenu(item.first ? { isPost: true } : { c: item })}
                    style={[styles.bubble, mine ? styles.mine : styles.other, mine ? (!sameAsNext && { borderBottomRightRadius: 4 }) : (!sameAsNext && { borderBottomLeftRadius: 4 }), item.first && { borderWidth: 1.5, borderColor: "#F2B8C6" }]}>
                    {item.first ? <Text style={[styles.topic, mine && { color: "#fff" }]}>{post.title}</Text> : null}
                    {item.replyTo ? (
                      <View style={[styles.quote, mine ? { backgroundColor: "rgba(255,255,255,0.22)", borderLeftColor: "#fff" } : null]}>
                        <Text style={[styles.quoteWho, mine && { color: "#fff" }]} numberOfLines={1}>{item.replyTo.author.pseudonyme}</Text>
                        <Text style={[styles.quoteT, mine && { color: "#FFE9EE" }]} numberOfLines={2}>{item.replyTo.body || (item.replyTo.mediaType === "audio" ? "🎤 Message vocal" : item.replyTo.mediaType === "video" ? "🎬 Vidéo" : "🖼️ Photo")}</Text>
                      </View>) : null}
                    {!!item.body && <Text style={[styles.msg, mine && { color: "#fff" }]}>{item.body}</Text>}
                    {item.mediaUrl && item.mediaType === "audio" ? <VoicePlayer url={item.mediaUrl} duration={item.durationSec} mine={mine} /> : null}
                    {item.mediaUrl && (item.mediaType === "image" || item.mediaType === "video") ? <MediaView url={item.mediaUrl} type={item.mediaType} /> : null}
                    <Text style={[styles.time, mine && { color: "#FFE0E6" }]}>{hhmm(item.createdAt)}{mine ? "  ✓" : ""}</Text>
                  </TouchableOpacity>
                  {counts.length ? <View style={styles.reactRow}>{counts.map(([e, n]) => <Text key={e} style={styles.react}>{e} {n}</Text>)}</View> : null}
                </View>
              </View>
            </View>
          );
        }}
      />
      {attachment ? (
        <View style={styles.attachRow}><Text style={styles.muted}>{attachment.kind === "video" ? "🎬 Vidéo prête" : "🖼️ Photo prête"}</Text><Text style={styles.reportLink} onPress={() => setAttachment(null)}>Retirer</Text></View>
      ) : null}
      {quoted ? (
        <View style={styles.quoteBar}>
          <View style={styles.quoteBarIn}>
            <Text style={styles.quoteWho} numberOfLines={1}>↩️ {quoted.author.pseudonyme}</Text>
            <Text style={styles.quoteT} numberOfLines={1}>{quoted.body || (quoted.mediaType === "audio" ? "🎤 Message vocal" : quoted.mediaType === "video" ? "🎬 Vidéo" : "🖼️ Photo")}</Text>
          </View>
          <TouchableOpacity onPress={() => setQuoted(null)} style={styles.roundSmall}><Text style={{ fontSize: 15, color: "#8C7A86" }}>✕</Text></TouchableOpacity>
        </View>
      ) : null}
      <View style={styles.composer}>
        {recSec === null ? (
          <>
            <TouchableOpacity onPress={pickMedia} style={styles.roundBtn} accessibilityLabel="Ajouter une photo ou une vidéo"><Text style={{ fontSize: 19 }}>📎</Text></TouchableOpacity>
            <RNTextInput value={reply} onChangeText={setReply} placeholder="Écris ton message…" placeholderTextColor="#B59AA6" multiline style={styles.input} />
          </>
        ) : (
          <Animated.View style={[styles.recBar, { opacity: cancelZone ? 0.6 : 1 }]}>
            <Text style={{ color: "#C23B3B", fontFamily: "Poppins_700Bold", fontSize: 14 }}>● {Math.floor((recSec || 0) / 60)}:{String((recSec || 0) % 60).padStart(2, "0")}</Text>
            <Animated.Text numberOfLines={1} style={{ flex: 1, textAlign: "center", color: cancelZone ? "#C23B3B" : "#8C7A86", fontSize: 13, transform: [{ translateX: dragX }] }}>
              {cancelZone ? "Relâche pour annuler" : "‹ Glisse pour annuler"}
            </Animated.Text>
          </Animated.View>
        )}
        {reply.trim() || attachment ? (
          <TouchableOpacity onPress={() => send()} disabled={sending} style={[styles.roundBtn, styles.roundSend]}><Text style={{ color: "#fff", fontSize: 18 }}>{sending ? "…" : "➤"}</Text></TouchableOpacity>
        ) : (
          <Animated.View {...mic.panHandlers} style={{ transform: [{ scale: micScale }, { translateX: dragX }] }}>
            <View style={[styles.roundBtn, recSec !== null ? (cancelZone ? styles.roundCancel : styles.roundRec) : styles.roundSend]} accessibilityLabel="Maintiens pour enregistrer un message vocal, glisse à gauche pour annuler">
              <Text style={{ fontSize: 19 }}>{cancelZone ? "🗑️" : "🎤"}</Text>
            </View>
          </Animated.View>
        )}
      </View>

      <Modal visible={!!menu} transparent animationType="fade" onRequestClose={() => setMenu(null)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenu(null)}>
          <View style={styles.modalCard}>
            {menu?.c ? <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 12 }}>
              {EMOJIS.map((e) => <TouchableOpacity key={e} onPress={() => react(menu.c!, e)} style={{ padding: 8, borderRadius: 999, backgroundColor: menu.c!.myReaction === e ? "#FFE0E6" : "#F5EEF2" }}><Text style={{ fontSize: 24 }}>{e}</Text></TouchableOpacity>)}
            </View> : null}
            {menu?.c ? <PrimaryButton title="↩️  Répondre à ce message" onPress={() => { const c = menu.c!; setMenu(null); setQuoted(c); }} /> : null}
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
  container: { flex: 1, backgroundColor: "#F8ECE6" },
  tip: { backgroundColor: "#FFF3C9", borderRadius: 16, padding: 12, marginBottom: 8 }, tipT: { color: "#5B4852", fontSize: 13, lineHeight: 18 }, tipOk: { color: "#B7791F", fontWeight: "800", fontSize: 12.5, marginTop: 6, alignSelf: "flex-end" },
  dayWrap: { alignItems: "center", marginVertical: 10 }, day: { backgroundColor: "rgba(255,255,255,0.85)", color: "#7A5C6B", fontSize: 12, fontWeight: "700", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 999, overflow: "hidden" },
  avatar: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", marginRight: 4, marginBottom: 2 }, avatarT: { color: "#fff", fontWeight: "800", fontSize: 13 },
  reactRow: { flexDirection: "row", gap: 4, marginTop: -6, marginBottom: 2, marginHorizontal: 8, zIndex: 2 },
  postTitle: { fontSize: 18, fontWeight: "700", color: colors.prune },
  muted: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  reportLink: { color: colors.danger, fontSize: 12 },
  retention: { fontSize: 12, color: colors.textMuted, backgroundColor: "#FFF0E9", borderRadius: 12, padding: spacing.sm, marginBottom: spacing.sm, overflow: "hidden", lineHeight: 17 },
  who: { fontSize: 12, fontFamily: "Poppins_600SemiBold", marginBottom: 2, marginLeft: 6 },
  bubble: { borderRadius: 20, paddingHorizontal: 13, paddingVertical: 8, shadowColor: "#3B1D33", shadowOpacity: 0.07, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  mine: { backgroundColor: "#FF5470" }, other: { backgroundColor: "#fff" },
  topic: { fontFamily: "Poppins_700Bold", fontSize: 15.5, color: colors.prune, marginBottom: 4, lineHeight: 21 },
  msg: { color: colors.text, fontSize: 15.5, lineHeight: 22, letterSpacing: 0.1 }, time: { fontSize: 10.5, color: colors.textMuted, alignSelf: "flex-end", marginTop: 3 },
  react: { backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 7, paddingVertical: 2, fontSize: 12, overflow: "hidden" },
  media: { width: 220, height: 200, borderRadius: 14, marginTop: 4, backgroundColor: "#000" },
  mediaHidden: { width: 200, height: 110, borderRadius: 14, marginTop: 4, backgroundColor: "#E7D5FF", alignItems: "center", justifyContent: "center" },
  mediaHiddenText: { color: colors.text, fontWeight: "700", fontSize: 13, textAlign: "center", padding: 8 },
  attachRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.lg, paddingVertical: 6, backgroundColor: "#fff" },
  composer: { flexDirection: "row", alignItems: "flex-end", gap: 8, paddingHorizontal: 10, paddingVertical: 8, paddingBottom: 12, backgroundColor: "#fff", borderTopWidth: 1, borderTopColor: "#F5E8EC" },
  input: { flex: 1, maxHeight: 110, backgroundColor: "#FFF6F0", borderRadius: 22, paddingHorizontal: 15, paddingTop: 10, paddingBottom: 10, fontSize: 15, color: colors.text },
  roundBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#FFE9EE", alignItems: "center", justifyContent: "center" },
  recBar: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFF1F3", borderRadius: 22, paddingHorizontal: 16, height: 44 },
  roundSend: { backgroundColor: colors.rose }, roundRec: { backgroundColor: "#FF3B5C" }, roundCancel: { backgroundColor: "#8C7A86" },
  roundSmall: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  quote: { borderLeftWidth: 3, borderLeftColor: colors.rose, backgroundColor: "rgba(255,84,112,0.08)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 5 },
  quoteWho: { fontFamily: "Poppins_600SemiBold", fontSize: 12, color: colors.rose }, quoteT: { fontSize: 12.5, color: "#7A5C6B" },
  quoteBar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingTop: 8, backgroundColor: "#fff" },
  quoteBarIn: { flex: 1, borderLeftWidth: 3, borderLeftColor: colors.rose, paddingLeft: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", padding: spacing.lg },
  modalCard: { backgroundColor: colors.surface, borderRadius: 16, padding: spacing.lg },
});
