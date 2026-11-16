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
  const bg =
    variant === "primary" ? colors.rose : variant === "danger" ? colors.danger : colors.surface;
  const textColor = variant === "secondary" ? colors.rose : "#fff";
  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: bg, borderColor: colors.rose, borderWidth: variant === "secondary" ? 1.5 : 0 },
        (disabled || loading) && { opacity: 0.6 },
      ]}
      onPress={onPress}
      disabled={disabled || loading}
    >
      {loading ? <ActivityIndicator color={textColor} /> : <Text style={[styles.buttonText, { color: textColor }]}>{title}</Text>}
    </TouchableOpacity>
  );
}

export function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

export function TextInput(props: TextInputProps) {
  return <RNTextInput placeholderTextColor={colors.textMuted} style={styles.input} {...props} />;
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
  button: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.sm,
  },
  buttonText: { fontSize: 16, fontWeight: "600" },
  label: { fontSize: 14, color: colors.textMuted, marginBottom: spacing.xs, marginTop: spacing.sm },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginVertical: spacing.xs,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  screenTitle: { fontSize: 24, fontWeight: "700", color: colors.prune, marginBottom: spacing.md },
  errorText: { color: colors.danger, marginTop: spacing.xs, fontSize: 14 },
});
