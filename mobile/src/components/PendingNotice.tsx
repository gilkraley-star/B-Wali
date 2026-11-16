import React, { useState } from "react";
import { Modal, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";
import { colors, radius, spacing } from "../theme/colors";
import { PrimaryButton, TextInput } from "../theme/ui";

/** Bandeau « ton compte sera créé dès que tu auras internet » + fenêtre si le pseudonyme ou le numéro est déjà pris. */
export default function PendingNotice() {
  const { user, pendingProblem, fixPending } = useAuth();
  const [pseudo, setPseudo] = useState("");
  const [phone, setPhone] = useState("");
  if (!user?.pending) return null;
  const phoneTaken = !!pendingProblem && /numéro|e-mail/i.test(pendingProblem);
  return (
    <>
      <View style={{ backgroundColor: "#FFF1CC", borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.md }}>
        <Text style={{ fontWeight: "800", color: colors.text }}>📴 Ton compte n'est pas encore créé</Text>
        <Text style={{ color: colors.textMuted, marginTop: 4, lineHeight: 19 }}>
          Pas de souci : il sera créé tout seul dès que tu auras internet. En attendant, tu peux suivre ton cycle et jouer. Le forum s'ouvrira ensuite.
        </Text>
      </View>
      <Modal visible={!!pendingProblem} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", padding: spacing.lg }}>
          <View style={{ backgroundColor: "#fff", borderRadius: radius.lg, padding: spacing.lg }}>
            <Text style={{ fontWeight: "800", fontSize: 17, color: colors.text }}>Une petite correction</Text>
            <Text style={{ color: colors.textMuted, marginVertical: spacing.sm }}>{pendingProblem}</Text>
            {phoneTaken ? (
              <TextInput value={phone} onChangeText={setPhone} placeholder="Ton numéro (ex. 70 12 34 56)" keyboardType="phone-pad" />
            ) : (
              <TextInput value={pseudo} onChangeText={setPseudo} placeholder="Nouveau pseudonyme" autoCapitalize="none" />
            )}
            <PrimaryButton title="Envoyer" onPress={() => fixPending(phoneTaken ? { phone } : { pseudonyme: pseudo })} />
          </View>
        </View>
      </Modal>
    </>
  );
}
