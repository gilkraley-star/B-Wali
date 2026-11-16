import React, { useState } from "react";
import { Linking, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import Constants from "expo-constants";
import * as Clipboard from "expo-clipboard";
import QRCode from "react-native-qrcode-svg";
import { colors, radius, spacing } from "../theme/colors";
import { PrimaryButton, ScreenTitle } from "../theme/ui";

const shareUrl: string = (Constants.expoConfig?.extra as any)?.shareUrl ?? "https://bewali.example/telecharger";

const MESSAGE =
  "Salut ! Je t'invite sur Wali, l'application gratuite pour les filles et les femmes : santé, infos simples, formations et idées pour gagner de l'argent. Télécharge-la ici : " +
  shareUrl;

// Partager l'appli avec une amie : lien (WhatsApp, SMS…) ou code QR à montrer en face.
// Aucune donnée personnelle n'est dans le lien : c'est juste l'adresse de téléchargement.
export default function ShareScreen() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await Clipboard.setStringAsync(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const share = async () => {
    try {
      await Share.share({ message: MESSAGE });
    } catch {
      /* l'utilisatrice a fermé la fenêtre */
    }
  };

  // Ouvre WhatsApp directement avec le message prêt (si WhatsApp n'est pas installé, la page web s'ouvre).
  const whatsapp = async () => {
    try {
      await Linking.openURL("https://wa.me/?text=" + encodeURIComponent(MESSAGE));
    } catch {
      await share();
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <ScreenTitle>Inviter une amie 💌</ScreenTitle>
      <Text style={styles.lead}>Plus on est de filles, plus on s'entraide. Envoie Wali à une amie.</Text>

      <View style={styles.qrCard}>
        <QRCode value={shareUrl} size={190} color={colors.text} backgroundColor="#fff" />
        <Text style={styles.qrHint}>Montre ce code à ton amie. Elle ouvre l'appareil photo de son téléphone et le scanne.</Text>
      </View>

      <PrimaryButton title="Partager sur WhatsApp" onPress={whatsapp} />
      <PrimaryButton title="Autres applications (SMS, Facebook…)" variant="secondary" onPress={share} />
      <PrimaryButton title={copied ? "✓ Lien copié" : "Copier le lien"} variant="secondary" onPress={copy} />

      <Text style={styles.note}>
        Ce lien ne contient aucune de tes informations. Ton compte, ton cycle et tes messages restent privés.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl },
  lead: { color: colors.text, fontSize: 15, lineHeight: 22, marginBottom: spacing.md },
  qrCard: {
    backgroundColor: "#fff",
    borderRadius: radius.lg ?? radius.md,
    padding: spacing.lg,
    alignItems: "center",
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  qrHint: { color: colors.textMuted, fontSize: 13, textAlign: "center", lineHeight: 19 },
  note: { color: colors.textMuted, fontSize: 12, textAlign: "center", marginTop: spacing.md, lineHeight: 18 },
});
