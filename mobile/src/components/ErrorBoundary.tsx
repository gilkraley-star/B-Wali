import React from "react";
import { ScrollView, Text, TouchableOpacity } from "react-native";

// Si l'appli plante au démarrage, on affiche l'erreur au lieu de se fermer : on peut la photographier et l'envoyer à l'équipe.
export default class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: string | null }> {
  state = { error: null as string | null };
  static getDerivedStateFromError(e: any) { return { error: String(e?.stack || e?.message || e).slice(0, 1800) }; }
  render() {
    if (!this.state.error) return this.props.children;
    return (
      <ScrollView style={{ flex: 1, backgroundColor: "#FFF6F0" }} contentContainerStyle={{ padding: 24, paddingTop: 70 }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#3B1D33" }}>Oups, Wali a rencontré un problème</Text>
        <Text style={{ marginTop: 8, color: "#6E5C68" }}>Fais une capture de cet écran et envoie-la à l'équipe.</Text>
        <Text selectable style={{ marginTop: 16, fontSize: 11, color: "#C23B3B" }}>{this.state.error}</Text>
        <TouchableOpacity onPress={() => this.setState({ error: null })} style={{ marginTop: 20, backgroundColor: "#FF5470", padding: 14, borderRadius: 999 }}><Text style={{ color: "#fff", textAlign: "center", fontWeight: "700" }}>Réessayer</Text></TouchableOpacity>
      </ScrollView>
    );
  }
}
