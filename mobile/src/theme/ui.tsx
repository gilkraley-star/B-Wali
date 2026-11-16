import React from "react";
import {
  ActivityIndicator,
  Text,
  TextInput as RNTextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  StyleSheet,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors, radius, spacing } from "./colors";

// Petite bibliothèque de composants partagés pour garder une identité visuelle cohérente
// (section 6 du dossier projet : navigation claire, couleurs harmonieuses, icônes explicites).

export function PrimaryButton({
  title,
  onPress,
  loading,
  disabled,
  variant = "primary",
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
}) {
  const isPrimary = variant === "primary";
  const textColor = variant === "secondary" ? colors.rose : "#fff";
  const content = loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>;
  const off = disabled || loading;
  if (isPrimary && disabled && !loading) {
    return (
      <View style={[styles.button, { backgroundColor: "#CDB7C4", marginVertical: spacing.sm }]}><Text style={[styles.buttonText, { color: "#fff" }]}>{title}</Text></View>
    );
  }
  if (isPrimary) {
    return (
      <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={off} style={[styles.shadowBtn, off && { opacity: 0.6 }]}>
        <LinearGradient colors={["#FF5470", "#FF8A5B"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.button}>{content}</LinearGradient>
      </TouchableOpacity>
    );
  }
  return (
    <TouchableOpacity activeOpacity={0.85} onPress={onPress} disabled={off}
      style={[styles.button, styles.secondary, variant === "danger" && { backgroundColor: colors.danger, borderWidth: 0 }, off && { opacity: 0.6 }]}>
      {content}
    </TouchableOpacity>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function TextInput(props: TextInputProps) {
  return <RNTextInput placeholderTextColor={colors.textMuted} {...props} style={[styles.input, props.style]} />;
}

export function Card({ children, style }: { children: React.ReactNode; style?: any }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function ScreenTitle({ children }: { children: React.ReactNode }) {
  return <Text style={styles.screenTitle}>{children}</Text>;
}

export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return <Text style={styles.errorText}>{children}</Text>;
}

const styles = StyleSheet.create({
  button: { paddingVertical: 16, paddingHorizontal: spacing.lg, borderRadius: radius.pill, alignItems: "center", justifyContent: "center" },
  shadowBtn: { marginVertical: spacing.sm, borderRadius: radius.pill, shadowColor: "#E85D75", shadowOpacity: 0.35, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  secondary: { marginVertical: spacing.sm, backgroundColor: "#fff", borderWidth: 1.5, borderColor: "#F3C9CF", shadowColor: "#3B1D33", shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  buttonText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  label: { fontSize: 13, color: "#8C7A86", marginBottom: 6, marginTop: spacing.md, fontFamily: "Inter_500Medium" },
  input: { borderWidth: 1, borderColor: "#F3DEE1", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: "#2E1A28", backgroundColor: "#fff", fontFamily: "Inter_400Regular" },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: spacing.md,
    marginVertical: 6,
    shadowColor: "#3B1D33",
    shadowOpacity: 0.07,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  screenTitle: { fontSize: 22, fontFamily: "Poppins_800ExtraBold", color: colors.prune, marginBottom: spacing.md },
  errorText: { color: colors.danger, marginTop: spacing.xs, fontSize: 14 },
});
