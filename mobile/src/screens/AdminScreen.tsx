import React, { useCallback, useEffect, useState } from "react";
import { Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { apiRequest, apiOrigin, ApiError } from "../api/client";
import { colors, spacing } from "../theme/colors";
import { Card, ErrorText, FieldLabel, PrimaryButton, ScreenTitle, TextInput } from "../theme/ui";
import { CertifiedBadge, Source } from "../components/Sources";

type Tab = "queue" | "users";

interface QueueItem {
  type: string;
  id: string;
  title: string;
  category: string;
  body: string;
  sources: Source[];
  author: { fullName: string; profession: string } | null;
}
interface UserRow {
  id: string;
  email: string;
  fullName: string | null;
  profession: string | null;
  photoUrl: string | null;
  role: string;
  certified: boolean;
  active: boolean;
}

const ROLES: [string, string][] = [
  ["PROFESSIONNELLE", "Professionnelle de santé"],
  ["COACH", "Coach"],
  ["FORMATRICE", "Formatrice"],
  ["MODERATRICE", "Modératrice"],
];

/** Administration dans l'application (la version complète est le site web /admin). */
export default function AdminScreen() {
  const [tab, setTab] = useState<Tab>("queue");
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [msg, setMsg] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("PROFESSIONNELLE");
  const [profession, setProfession] = useState("");
  const [certified, setCertified] = useState(false);
  const [photo, setPhoto] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pwd, setPwd] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [q, u] = await Promise.all([apiRequest<QueueItem[]>("/admin/queue?status=A_VALIDER"), apiRequest<UserRow[]>("/admin/users")]);
      setQueue(q);
      setUsers(u);
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Erreur.");
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const review = async (it: QueueItem, decision: "approve" | "reject", note?: string) => {
    try {
      await apiRequest(`/admin/review/${it.type}/${it.id}`, { method: "POST", body: { decision, note } });
      load();
    } catch (e) {
      Alert.alert("Impossible", e instanceof ApiError ? e.message : "Erreur.");
    }
  };

  const reject = (it: QueueItem) =>
    Alert.prompt?.("Motif du refus", "Obligatoire : la professionnelle le verra.", (note) => note && review(it, "reject", note)) ??
    Alert.alert("Refus", "Utilise le site web /admin pour refuser avec un motif.");

  const pick = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, aspect: [1, 1], quality: 0.5, base64: true });
    if (!res.canceled && res.assets[0].base64) setPhoto(`data:image/jpeg;base64,${res.assets[0].base64}`);
  };

  const create = async () => {
    setError(null);
    if (!photo) return setError("La photo est obligatoire.");
    try {
      const r = await apiRequest<{ temporaryPassword: string }>("/admin/users", {
        method: "POST",
        body: { fullName: name.trim(), email: email.trim(), role, profession: profession.trim(), certified, photo },
      });
      setPwd(r.temporaryPassword);
      setName("");
      setEmail("");
      setProfession("");
      setPhoto(null);
      load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Erreur.");
    }
  };

  return (
    <ScrollView style={styles.c} contentContainerStyle={{ padding: spacing.lg }}>
      <ScreenTitle>Administration</ScreenTitle>
      <View style={styles.tabs}>
        {([["queue", `À valider (${queue.length})`], ["users", "Comptes pro"]] as [Tab, string][]).map(([id, label]) => (
          <Text key={id} onPress={() => setTab(id)} style={[styles.tab, tab === id && styles.tabOn]}>
            {label}
          </Text>
        ))}
      </View>
      {msg && <ErrorText>{msg}</ErrorText>}

      {tab === "queue" &&
        (queue.length === 0 ? (
          <Text style={styles.p}>Rien à valider. 🎉</Text>
        ) : (
          queue.map((it) => (
            <Card key={it.type + it.id}>
              <Text style={styles.h}>{it.title}</Text>
              <Text style={styles.p}>
                {it.category} · {it.author ? `proposé par ${it.author.fullName}` : "contenu de départ"}
              </Text>
              <Text style={styles.body} numberOfLines={8}>
                {it.body}
              </Text>
              {it.sources.length === 0 ? (
                <Text style={{ color: colors.danger, marginTop: 6 }}>Aucune source : publication impossible.</Text>
              ) : (
                it.sources.map((s, i) => (
                  <TouchableOpacity key={i} onPress={() => Linking.openURL(s.url)}>
                    <Text style={styles.src}>
                      {s.org} — {s.title}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
              <View style={{ flexDirection: "row", gap: spacing.sm }}>
                <View style={{ flex: 1 }}>
                  <PrimaryButton title="Publier" onPress={() => review(it, "approve")} />
                </View>
                <View style={{ flex: 1 }}>
                  <PrimaryButton title="Refuser" variant="secondary" onPress={() => reject(it)} />
                </View>
              </View>
            </Card>
          ))
        ))}

      {tab === "users" && (
        <View>
          <Card>
            <Text style={styles.h}>Créer un compte professionnel</Text>
            <FieldLabel>Nom complet</FieldLabel>
            <TextInput value={name} onChangeText={setName} />
            <FieldLabel>E-mail</FieldLabel>
            <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
            <FieldLabel>Rôle</FieldLabel>
            <View style={styles.row}>
              {ROLES.map(([id, label]) => (
                <Text key={id} onPress={() => setRole(id)} style={[styles.chip, role === id && styles.chipOn]}>
                  {label}
                </Text>
              ))}
            </View>
            <FieldLabel>Profession affichée</FieldLabel>
            <TextInput value={profession} onChangeText={setProfession} placeholder="Sage-femme, Psychologue, Coach…" />
            <TouchableOpacity onPress={() => setCertified(!certified)} style={{ marginTop: spacing.sm }}>
              <Text style={{ color: "#15609E", fontWeight: "600" }}>{certified ? "☑" : "☐"} Badge bleu « certifiée » (diplôme vérifié)</Text>
            </TouchableOpacity>
            <PrimaryButton title={photo ? "Changer la photo" : "Choisir la photo (obligatoire)"} variant="secondary" onPress={pick} />
            {photo && <Image source={{ uri: photo }} style={styles.preview} />}
            <ErrorText>{error}</ErrorText>
            <PrimaryButton title="Créer le compte" onPress={create} />
            {pwd && (
              <View style={styles.pwd}>
                <Text style={{ fontWeight: "700" }}>Mot de passe provisoire (affiché une seule fois) :</Text>
                <Text selectable style={{ fontSize: 20, fontWeight: "800", marginVertical: 4 }}>
                  {pwd}
                </Text>
                <Text style={{ fontSize: 12 }}>Transmets-le en privé. Il devra être changé à la première connexion.</Text>
              </View>
            )}
          </Card>
          {users.map((u) => (
            <Card key={u.id} style={{ flexDirection: "row", gap: spacing.md, alignItems: "center" }}>
              {u.photoUrl ? <Image source={{ uri: apiOrigin + u.photoUrl }} style={styles.avatar} /> : <View style={[styles.avatar, { backgroundColor: colors.roseLight }]} />}
              <View style={{ flex: 1 }}>
                <Text style={styles.h}>{u.fullName || u.email}</Text>
                <Text style={styles.p}>
                  {u.profession} · {u.role}
                  {u.active ? "" : " · désactivé"}
                </Text>
                {u.certified && <CertifiedBadge />}
              </View>
            </Card>
          ))}
        </View>
      )}
      <Text style={[styles.p, { marginTop: spacing.lg }]}>Pour les stats, les formations et le journal : ouvre le site d'administration (/admin) sur ton ordinateur ou téléphone.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  tabs: { flexDirection: "row", gap: 6, marginBottom: spacing.md },
  tab: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, color: colors.prune, fontWeight: "600", backgroundColor: "#fff", overflow: "hidden" },
  tabOn: { backgroundColor: colors.prune, color: "#fff", borderColor: colors.prune },
  h: { fontSize: 15, fontWeight: "700", color: colors.prune },
  p: { color: "#6E5C68", fontSize: 12, marginTop: 2 },
  body: { color: colors.text, marginTop: 6, lineHeight: 19, fontSize: 13 },
  src: { color: "#15609E", fontSize: 12, marginTop: 4, textDecorationLine: "underline" },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  chip: { borderWidth: 1.5, borderColor: colors.border, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6, color: colors.prune, backgroundColor: "#fff", overflow: "hidden", fontSize: 12 },
  chipOn: { backgroundColor: colors.prune, color: "#fff", borderColor: colors.prune },
  preview: { width: 96, height: 96, borderRadius: 48, alignSelf: "center", marginVertical: spacing.sm },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  pwd: { backgroundColor: "#E6F4EC", borderRadius: 12, padding: spacing.md, marginTop: spacing.sm },
});
