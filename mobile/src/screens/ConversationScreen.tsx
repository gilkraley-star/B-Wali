import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiRequest, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { colors, spacing } from "../theme/colors";
import { useRealtime } from "../realtime/realtime";

interface Msg { id: string; body: string; mine: boolean; createdAt: string }

/**
 * Fil de discussion privé entre une fille et une professionnelle. Même écran pour les deux
 * côtés : on arrive ici soit avec { proId, proName } (côté fille, démarre ou retrouve la
 * conversation), soit avec { conversationId, withName } (côté pro, depuis sa boîte de réception).
 */
export default function ConversationScreen({ route, navigation }: any) {
  const { user } = useAuth();
  const { proId, proName, conversationId: initialId, withName, anonymous: anonParam } = route.params || {};
  const [convId, setConvId] = useState<string | null>(initialId || null);
  const [title, setTitle] = useState<string>(proName || withName || "Conversation");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [blocked, setBlocked] = useState(false);
  const listRef = useRef<FlatList>(null);

  useEffect(() => { navigation.setOptions?.({ title }); }, [title]);

  const start = useCallback(async () => {
    if (convId) return convId;
    const r = await apiRequest<{ id: string }>("/messages/start", { method: "POST", body: { proId, anonymous: !!anonParam } });
    setConvId(r.id);
    return r.id;
  }, [convId, proId, anonParam]);

  const load = useCallback(async () => {
    try {
      const id = await start();
      const r = await apiRequest<{ messages: Msg[]; blocked: boolean }>(`/messages/conversations/${id}`);
      setMsgs(r.messages);
      setBlocked(r.blocked);
    } catch (e) {
      Alert.alert("Erreur", e instanceof ApiError ? e.message : "Impossible de charger la conversation.");
    } finally {
      setLoading(false);
    }
  }, [start]);

  useEffect(() => { load(); }, [load]);
  useRealtime((e: any) => { if (e.t === "dm" && (e.conv === convId || !convId)) load(); });

  const send = async () => {
    const body = text.trim();
    if (!body || sending || !convId) return;
    setText("");
    setSending(true);
    try {
      const m = await apiRequest<Msg>(`/messages/conversations/${convId}`, { method: "POST", body: { body } });
      setMsgs((prev) => [...prev, m]);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    } catch (e) {
      Alert.alert("Erreur", e instanceof ApiError ? e.message : "Message non envoyé.");
      setText(body);
    } finally {
      setSending(false);
    }
  };

  const reportOrBlock = () => {
    Alert.alert("Options", undefined, [
      { text: "Signaler", onPress: () => promptReport() },
      { text: "Bloquer cette conversation", style: "destructive", onPress: () => doBlock() },
      { text: "Annuler", style: "cancel" },
    ]);
  };
  const promptReport = () => {
    Alert.prompt?.("Signaler", "Explique brièvement le problème.", async (reason) => {
      if (!reason?.trim() || !convId) return;
      try { await apiRequest(`/messages/conversations/${convId}/report`, { method: "POST", body: { reason: reason.trim() } }); Alert.alert("Merci", "Ton signalement a été transmis à l'équipe Wali."); } catch {}
    });
  };
  const doBlock = async () => {
    if (!convId) return;
    try { await apiRequest(`/messages/conversations/${convId}/block`, { method: "POST" }); setBlocked(true); } catch {}
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.rose} /></View>;

  return (
    <KeyboardAvoidingView style={styles.c} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <TouchableOpacity style={styles.menuBtn} onPress={reportOrBlock} accessibilityRole="button">
        <Text style={{ fontSize: 18 }}>⋮</Text>
      </TouchableOpacity>
      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: spacing.md }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={<Text style={styles.empty}>Écris ton premier message en toute confidentialité. Seule cette professionnelle le verra.</Text>}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.mine ? styles.mine : styles.theirs]}>
            <Text style={[styles.bubbleText, item.mine && { color: "#fff" }]}>{item.body}</Text>
          </View>
        )}
      />
      {blocked ? (
        <View style={styles.blockedBar}><Text style={styles.blockedT}>Cette conversation est bloquée.</Text></View>
      ) : (
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            placeholder="Écris ton message…"
            placeholderTextColor="#B59CAE"
            multiline
          />
          <TouchableOpacity style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.5 }]} onPress={send} disabled={!text.trim() || sending} accessibilityRole="button">
            <Text style={{ color: "#fff", fontSize: 16 }}>➤</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  menuBtn: { position: "absolute", top: 6, right: 10, zIndex: 5, padding: 8 },
  empty: { color: "#6E5C68", textAlign: "center", marginTop: 40, lineHeight: 20, paddingHorizontal: 20 },
  bubble: { maxWidth: "80%", borderRadius: 16, paddingVertical: 9, paddingHorizontal: 13, marginBottom: 8 },
  mine: { backgroundColor: colors.rose, alignSelf: "flex-end", borderBottomRightRadius: 4 },
  theirs: { backgroundColor: "#fff", alignSelf: "flex-start", borderBottomLeftRadius: 4 },
  bubbleText: { color: colors.text, fontSize: 14, lineHeight: 19 },
  inputBar: { flexDirection: "row", alignItems: "flex-end", padding: spacing.sm, gap: 8, borderTopWidth: 1, borderTopColor: "#F0E3EC", backgroundColor: "#fff" },
  input: { flex: 1, backgroundColor: "#F7EEF3", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10, maxHeight: 110, fontSize: 14, color: colors.text },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.rose, alignItems: "center", justifyContent: "center" },
  blockedBar: { padding: spacing.md, backgroundColor: "#F0E3EC" },
  blockedT: { textAlign: "center", color: "#6E5C68" },
});
