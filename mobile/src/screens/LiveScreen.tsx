import React, { useEffect, useRef, useState } from "react";
import { Alert, Dimensions, PermissionsAndroid, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as ScreenOrientation from "expo-screen-orientation";
import { AudioSession, LiveKitRoom, VideoTrack, isTrackReference, useChat, useTracks } from "@livekit/react-native";
import { Track } from "livekit-client";
import { ApiError, apiRequest } from "../api/client";
import { colors } from "../theme/colors";

// Direct dans l'appli. La formatrice (host) filme en paysage ; les filles regardent et écrivent des commentaires.
interface Ticket { url: string; token: string; canChat?: boolean; title: string }

export default function LiveScreen({ route, navigation }: any) {
  const { slug, host } = route.params as { slug: string; host: boolean };
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [landscape, setLandscape] = useState(Dimensions.get("window").width > Dimensions.get("window").height);
  const [started, setStarted] = useState(false);

  // Orientation : la formatrice est invitée à tourner son téléphone ; tout revient en portrait à la sortie.
  useEffect(() => {
    if (host) ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE).catch(() => {});
    else ScreenOrientation.unlockAsync().catch(() => {});
    const sub = Dimensions.addEventListener("change", ({ window }) => setLandscape(window.width > window.height));
    return () => { sub.remove(); ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {}); AudioSession.stopAudioSession().catch(() => {}); };
  }, [host]);

  async function askPermissions(): Promise<boolean> {
    if (Platform.OS !== "android" || !host) return true;
    const r = await PermissionsAndroid.requestMultiple([PermissionsAndroid.PERMISSIONS.CAMERA, PermissionsAndroid.PERMISSIONS.RECORD_AUDIO]);
    return Object.values(r).every((v) => v === "granted");
  }

  async function go() {
    try {
      if (!(await askPermissions())) { setError("Autorise la caméra et le micro pour faire le direct."); return; }
      const t = await apiRequest<Ticket>(`/live/${slug}/${host ? "start" : "join"}`, { method: "POST" });
      await AudioSession.startAudioSession();
      setTicket(t); setStarted(true);
    } catch (e) { setError(e instanceof ApiError ? e.message : "Impossible de lancer le direct."); }
  }
  useEffect(() => { if (!host) go(); }, []);

  async function finish() {
    if (!host) { navigation.goBack(); return; }
    Alert.alert("Terminer le direct ?", "Les filles présentes jusqu'au bout recevront l'accès au test.", [
      { text: "Continuer", style: "cancel" },
      { text: "Terminer", style: "destructive", onPress: async () => {
        try { const r = await apiRequest<{ presentes: number }>(`/live/${slug}/end`, { method: "POST" }); Alert.alert("Direct terminé", `${r.presentes} fille(s) ont suivi le direct jusqu'au bout.`); } catch { /* ignore */ }
        navigation.goBack();
      } },
    ]);
  }

  if (error) return (<View style={s.center}><Text style={s.msg}>{error}</Text><TouchableOpacity style={s.btn} onPress={() => navigation.goBack()}><Text style={s.btnT}>Retour</Text></TouchableOpacity></View>);
  if (host && !started) {
    return (
      <View style={s.center}>
        <Text style={s.big}>🎥 Faire le direct</Text>
        {!landscape ? <Text style={s.msg}>↻ Tourne ton téléphone sur le côté (en paysage) pour filmer.</Text>
          : <Text style={s.msg}>Parfait, ton téléphone est en paysage. Les filles inscrites pourront te rejoindre dès que tu commences.</Text>}
        <TouchableOpacity style={[s.btn, !landscape && { opacity: 0.4 }]} disabled={!landscape} onPress={go}><Text style={s.btnT}>🔴 Commencer le direct</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}><Text style={[s.msg, { marginTop: 16 }]}>Annuler</Text></TouchableOpacity>
      </View>
    );
  }
  if (!ticket) return (<View style={s.center}><Text style={s.msg}>Connexion au direct…</Text></View>);

  return (
    <LiveKitRoom serverUrl={ticket.url} token={ticket.token} connect audio={host} video={host} options={{ adaptiveStream: true, dynacast: true }}
      onDisconnected={() => { if (!host) { Alert.alert("Le direct est terminé", "Merci d'avoir suivi !"); navigation.goBack(); } }}>
      <LiveBody slug={slug} host={host} title={ticket.title} canChat={host ? true : !!ticket.canChat} onFinish={finish} />
    </LiveKitRoom>
  );
}

function LiveBody({ slug, host, title, canChat, onFinish }: { slug: string; host: boolean; title: string; canChat: boolean; onFinish: () => void }) {
  const tracks = useTracks([Track.Source.Camera]);
  const video = tracks.find((t) => isTrackReference(t) && (host ? t.participant.isLocal : !t.participant.isLocal));
  const { chatMessages, send } = useChat();
  const [text, setText] = useState("");
  const beat = useRef<any>(null);

  // Présence : un signal toutes les 30 s pendant que la fille regarde
  useEffect(() => {
    if (host) return;
    beat.current = setInterval(() => { apiRequest(`/live/${slug}/beat`, { method: "POST", silent: true }).catch(() => {}); }, 30000);
    return () => clearInterval(beat.current);
  }, [host, slug]);

  const shown = chatMessages.slice(-7);
  return (
    <View style={s.screen}>
      {video && isTrackReference(video) ? <VideoTrack trackRef={video} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} objectFit="contain" mirror={false} />
        : <View style={s.center}><Text style={s.msg}>{host ? "Ta caméra démarre…" : "En attente de l'image de la formatrice…"}</Text></View>}
      <View style={s.top}>
        <Text style={s.live}>🔴 EN DIRECT</Text><Text style={s.title} numberOfLines={1}>{title}</Text>
        <TouchableOpacity style={s.end} onPress={onFinish}><Text style={s.endT}>{host ? "Terminer" : "Quitter"}</Text></TouchableOpacity>
      </View>
      <View style={s.chat} pointerEvents="box-none">
        {shown.map((m, i) => (<Text key={m.timestamp + "-" + i} style={s.line}><Text style={s.who}>{m.from?.name || "fille"} </Text>{m.message}</Text>))}
        {canChat ? (
          <View style={s.inputRow}>
            <TextInput style={s.input} value={text} onChangeText={setText} placeholder="Écris un commentaire…" placeholderTextColor="#ddd" maxLength={200} />
            <TouchableOpacity onPress={() => { if (text.trim()) { send(text.trim()); setText(""); } }}><Text style={s.sendT}>➤</Text></TouchableOpacity>
          </View>) : <Text style={s.mute}>Les commentaires sont fermés pour ton compte.</Text>}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#000" },
  center: { flex: 1, backgroundColor: "#2A1230", alignItems: "center", justifyContent: "center", padding: 24 },
  big: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 12 },
  msg: { color: "#F3E4FF", textAlign: "center", fontSize: 15, lineHeight: 22, marginVertical: 8 },
  btn: { backgroundColor: colors.rose, borderRadius: 999, paddingHorizontal: 28, paddingVertical: 14, marginTop: 14 }, btnT: { color: "#fff", fontWeight: "800", fontSize: 16 },
  top: { position: "absolute", top: 12, left: 12, right: 12, flexDirection: "row", alignItems: "center", gap: 10 },
  live: { backgroundColor: "#E5252A", color: "#fff", fontWeight: "800", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: "hidden" },
  title: { flex: 1, color: "#fff", fontWeight: "700" },
  end: { backgroundColor: "rgba(255,255,255,0.25)", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6 }, endT: { color: "#fff", fontWeight: "800" },
  chat: { position: "absolute", left: 12, bottom: 12, width: "46%", maxHeight: "70%", justifyContent: "flex-end" },
  line: { color: "#fff", backgroundColor: "rgba(0,0,0,0.45)", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, marginTop: 4, alignSelf: "flex-start" }, who: { fontWeight: "800", color: "#FFC0CB" },
  inputRow: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(0,0,0,0.55)", borderRadius: 999, marginTop: 8, paddingHorizontal: 12 },
  input: { flex: 1, color: "#fff", paddingVertical: 8 }, sendT: { color: "#fff", fontSize: 20, paddingLeft: 8 }, mute: { color: "#ddd", marginTop: 8, fontSize: 12 },
});
