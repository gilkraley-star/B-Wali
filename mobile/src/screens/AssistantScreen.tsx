import React, { useRef, useState } from "react";
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { ApiError, apiRequest } from "../api/client";
import { colors } from "../theme/colors";

interface Msg { role: "user" | "assistant"; content: string }
const HELLO: Msg = { role: "assistant", content: "Bonjour 👋 Je suis ta conseillère Wali. Je peux t'aider à comprendre ton corps et t'orienter vers les bonnes personnes. Comment puis-je t'aider ?" };
const IDEAS = ["Mes règles sont en retard", "J'ai mal au ventre pendant les règles", "Je me sens triste", "C'est quoi le consentement ?"];

export default function AssistantScreen({ navigation }: any) {
  const [msgs, setMsgs] = useState<Msg[]>([HELLO]);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const list = useRef<FlatList>(null);

  async function send(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    const next = [...msgs, { role: "user", content: question } as Msg];
    setMsgs(next); setText(""); setBusy(true);
    try {
      const r = await apiRequest<{ reply: string }>("/assistant/ask", { method: "POST", body: { messages: next.slice(1).slice(-8) } });
      setMsgs([...next, { role: "assistant", content: r.reply }]);
    } catch (e) {
      const m = e instanceof ApiError && e.status === 0 ? "Il faut une connexion internet pour me parler." : e instanceof ApiError ? e.message : "Réessaie plus tard.";
      setMsgs([...next, { role: "assistant", content: m }]);
    }
    setBusy(false);
    setTimeout(() => list.current?.scrollToEnd({ animated: true }), 100);
  }

  return (
    <KeyboardAvoidingView style={s.c} behavior={Platform.OS === "ios" ? "padding" : undefined} keyboardVerticalOffset={90}>
      <Text style={s.warn}>Je suis une intelligence artificielle, pas un professionnel de santé. En cas d'urgence ou de doute, parle à une sage-femme, un médecin ou une adulte de confiance.</Text>
      <FlatList ref={list} data={msgs} keyExtractor={(_, i) => String(i)} contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[s.bub, item.role === "user" ? s.me : s.bot]}>
            <Text style={item.role === "user" ? s.meT : s.botT}>{item.content}</Text>
          </View>)}
        ListFooterComponent={
          <View>
            {busy && <ActivityIndicator color={colors.rose} style={{ margin: 8 }} />}
            {msgs.length === 1 && IDEAS.map((i) => (<TouchableOpacity key={i} style={s.idea} onPress={() => send(i)}><Text style={s.ideaT}>{i}</Text></TouchableOpacity>))}
            {msgs.length > 1 && (
              <TouchableOpacity style={s.pro} onPress={() => navigation.navigate("Professionnelles")}><Text style={s.proT}>👩‍⚕️ Écrire à une de nos professionnelles</Text></TouchableOpacity>)}
          </View>} />
      <View style={s.row}>
        <TextInput style={s.input} value={text} onChangeText={setText} placeholder="Écris ta question…" maxLength={500} multiline />
        <TouchableOpacity style={s.send} onPress={() => send(text)} disabled={busy}><Text style={{ color: "#fff", fontSize: 18 }}>➤</Text></TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  warn: { fontSize: 11, color: "#7A5410", backgroundColor: "#FDF1DC", padding: 10 },
  bub: { maxWidth: "85%", borderRadius: 18, padding: 12, marginBottom: 8 },
  bot: { alignSelf: "flex-start", backgroundColor: "#fff" }, me: { alignSelf: "flex-end", backgroundColor: colors.rose },
  botT: { color: colors.text, lineHeight: 20 }, meT: { color: "#fff", lineHeight: 20 },
  idea: { alignSelf: "flex-start", borderWidth: 1, borderColor: colors.rose, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginTop: 6 }, ideaT: { color: colors.rose, fontWeight: "600" },
  pro: { alignSelf: "flex-start", backgroundColor: "#FFE9A8", borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginTop: 8 }, proT: { fontWeight: "700", color: colors.prune },
  row: { flexDirection: "row", alignItems: "flex-end", padding: 10, backgroundColor: "#fff" },
  input: { flex: 1, maxHeight: 100, backgroundColor: "#F6EFF3", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 8 },
  send: { backgroundColor: colors.rose, width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", marginLeft: 8 },
});
