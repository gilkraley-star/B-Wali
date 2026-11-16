import React, { useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Saisie d'un code (clavier à chiffres) ou d'un schéma (on glisse le doigt de point en point).
export function PinPad({ onDone, length = 4 }: { onDone: (pin: string) => void; length?: number }) {
  const [v, setV] = useState("");
  const press = (d: string) => { const n = (v + d).slice(0, length); setV(n); if (n.length === length) { setTimeout(() => { onDone(n); setV(""); }, 120); } };
  return (
    <View style={{ alignItems: "center" }}>
      <View style={{ flexDirection: "row", gap: 14, marginBottom: 26 }}>{Array.from({ length }).map((_, i) => <View key={i} style={[s.dot, i < v.length && s.dotOn]} />)}</View>
      {[["1", "2", "3"], ["4", "5", "6"], ["7", "8", "9"], ["", "0", "⌫"]].map((row, i) => (
        <View key={i} style={{ flexDirection: "row", gap: 18, marginBottom: 14 }}>
          {row.map((d, j) => d === "" ? <View key={j} style={s.key} /> : (
            <TouchableOpacity key={j} style={s.key} activeOpacity={0.6} onPress={() => (d === "⌫" ? setV(v.slice(0, -1)) : press(d))}><Text style={s.keyT}>{d}</Text></TouchableOpacity>))}
        </View>))}
    </View>
  );
}

const SZ = 270, CELL = SZ / 3;
export function PatternPad({ onDone }: { onDone: (code: string) => void }) {
  const [path, setPath] = useState<number[]>([]);
  const [pt, setPt] = useState<{ x: number; y: number } | null>(null);
  const ref = useRef<number[]>([]);
  const cx = (i: number) => (i % 3) * CELL + CELL / 2, cy = (i: number) => Math.floor(i / 3) * CELL + CELL / 2;
  const hit = (x: number, y: number) => { for (let i = 0; i < 9; i++) if (Math.hypot(x - cx(i), y - cy(i)) < 34 && !ref.current.includes(i)) { ref.current = [...ref.current, i]; setPath(ref.current); } };
  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true, onMoveShouldSetPanResponder: () => true,
    onPanResponderGrant: (e) => { ref.current = []; setPath([]); const { locationX: x, locationY: y } = e.nativeEvent; setPt({ x, y }); hit(x, y); },
    onPanResponderMove: (e) => { const { locationX: x, locationY: y } = e.nativeEvent; setPt({ x, y }); hit(x, y); },
    onPanResponderRelease: () => { const code = ref.current.join(""); setPt(null); setTimeout(() => { ref.current = []; setPath([]); }, 250); if (code.length) onDone(code); },
  })).current;
  const seg = (a: number, b: number, k: string) => { const x1 = cx(a), y1 = cy(a), x2 = b < 0 ? pt!.x : cx(b), y2 = b < 0 ? pt!.y : cy(b); const len = Math.hypot(x2 - x1, y2 - y1), ang = Math.atan2(y2 - y1, x2 - x1); return <View key={k} pointerEvents="none" style={{ position: "absolute", left: (x1 + x2) / 2 - len / 2, top: (y1 + y2) / 2 - 2, width: len, height: 4, borderRadius: 2, backgroundColor: "#FF5470", transform: [{ rotate: ang + "rad" }] }} />; };
  return (
    <View style={{ width: SZ, height: SZ }} {...pan.panHandlers}>
      {path.slice(1).map((p, i) => seg(path[i], p, "s" + i))}
      {pt && path.length > 0 ? seg(path[path.length - 1], -1, "live") : null}
      {Array.from({ length: 9 }).map((_, i) => <View key={i} pointerEvents="none" style={[s.pd, { left: cx(i) - 17, top: cy(i) - 17 }, path.includes(i) && s.pdOn]} />)}
    </View>
  );
}

export default function LockScreen({ type, onSubmit, error }: { type: "pin" | "pattern"; onSubmit: (secret: string) => void; error?: string }) {
  return (
    <LinearGradient colors={["#FFF6F0", "#FFD6DD"]} style={s.full}>
      <Text style={{ fontSize: 44 }}>🔒</Text>
      <Text style={s.t}>Wali</Text>
      <Text style={s.sub}>{type === "pin" ? "Écris ton code" : "Dessine ton schéma"}</Text>
      <Text style={s.err}>{error || " "}</Text>
      {type === "pin" ? <PinPad onDone={onSubmit} /> : <PatternPad onDone={(c) => (c.length >= 4 ? onSubmit(c) : onSubmit("x"))} />}
    </LinearGradient>
  );
}
const s = StyleSheet.create({
  full: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center", zIndex: 999 },
  t: { fontFamily: "Poppins_800ExtraBold", fontSize: 28, color: "#3B1D33", marginTop: 4 }, sub: { color: "#6E5C68", marginTop: 6, fontSize: 15 }, err: { color: "#C23B3B", marginVertical: 12, fontSize: 13, minHeight: 18 },
  dot: { width: 16, height: 16, borderRadius: 8, borderWidth: 2, borderColor: "#FF5470" }, dotOn: { backgroundColor: "#FF5470" },
  key: { width: 70, height: 70, borderRadius: 35, backgroundColor: "rgba(255,255,255,0.8)", alignItems: "center", justifyContent: "center" }, keyT: { fontSize: 26, color: "#3B1D33", fontFamily: "Inter_600SemiBold" },
  pd: { position: "absolute", width: 34, height: 34, borderRadius: 17, borderWidth: 3, borderColor: "#E5B8C4", backgroundColor: "#fff" }, pdOn: { borderColor: "#FF5470", backgroundColor: "#FFD6DD" },
});
