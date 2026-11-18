import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";

// Le direct (LiveKit) ne se charge qu'à l'ouverture de l'écran : s'il y a un souci avec le module vidéo du téléphone,
// le reste de l'appli continue de marcher et on affiche un message au lieu de fermer l'appli.
// On laisse un court instant entre l'enregistrement des globales WebRTC et l'ouverture de l'écran :
// sur certains téléphones, utiliser la caméra tout de suite après registerGlobals() faisait planter
// l'appli nativement (donc sans qu'aucun message ne puisse s'afficher).
export default function LiveLazy(props: any) {
  const [Comp, setComp] = useState<React.ComponentType<any> | null>(null);
  const [err, setErr] = useState<string | null>(null);
  useEffect(() => {
    let off = false;
    try {
      const lk = require("@livekit/react-native");
      lk.registerGlobals();
      const mod = require("./LiveScreen");
      setTimeout(() => { if (!off) setComp(() => mod.default); }, 400);
    } catch (e: any) { setErr(String(e?.message || e)); }
    return () => { off = true; };
  }, []);
  if (err) return <View style={{ flex: 1, padding: 24, justifyContent: "center", backgroundColor: "#FFF6F0" }}><Text style={{ fontSize: 16, fontWeight: "700", color: "#3B1D33" }}>Le direct n'est pas disponible sur ce téléphone pour le moment.</Text><Text style={{ marginTop: 10, color: "#8C7A86" }}>{err}</Text></View>;
  if (!Comp) return <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#FFF6F0" }}><ActivityIndicator color="#FF5470" /></View>;
  return <Comp {...props} />;
}
