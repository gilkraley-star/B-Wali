import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, Text, View, useWindowDimensions } from "react-native";

// Animation d'ouverture (logo qui apparaît, pétales de couleur qui flottent, cœurs qui montent) et animation de bienvenue après l'inscription.
const EMO = ["💗", "🌸", "✨", "💖", "🌺"];

function Hearts({ count, w, h }: { count: number; w: number; h: number }) {
  const items = useMemo(() => Array.from({ length: count }, (_, i) => ({
    x: Math.random() * (w - 30), delay: Math.random() * 1100, dur: 1800 + Math.random() * 1400, size: 16 + Math.random() * 16, e: EMO[i % EMO.length], v: new Animated.Value(0),
  })), []);
  useEffect(() => { items.forEach((p) => Animated.timing(p.v, { toValue: 1, duration: p.dur, delay: p.delay, easing: Easing.out(Easing.quad), useNativeDriver: true }).start()); }, []);
  return <>{items.map((p, i) => (
    <Animated.Text key={i} style={{ position: "absolute", left: p.x, bottom: 40, fontSize: p.size, opacity: p.v.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 1, 0] }),
      transform: [{ translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, -h * 0.75] }) }, { translateX: p.v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, 14, -10] }) }] }}>{p.e}</Animated.Text>))}</>;
}

function Blob({ style, delay }: { style: any; delay: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 1200, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start(); }, []);
  return <Animated.View style={[style, { position: "absolute", opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0, 0.65] }), transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) }] }]} />;
}

// Ouverture de l'appli : onDone est appelé quand l'animation a fini de s'effacer.
export function AppIntro({ long, onDone }: { long: boolean; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const logo = useRef(new Animated.Value(0)).current, text = useRef(new Animated.Value(0)).current, out = useRef(new Animated.Value(1)).current, beat = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.sequence([
      Animated.spring(logo, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
      Animated.timing(text, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(long ? 1500 : 500),
      Animated.timing(out, { toValue: 0, duration: 450, useNativeDriver: true }),
    ]).start(() => onDone());
    Animated.loop(Animated.sequence([Animated.timing(beat, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(beat, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true })])).start();
  }, []);
  const size = Math.min(width * 0.62, 260);
  return (
    <Animated.View pointerEvents="auto" style={[s.full, { opacity: out }]}>
      <Blob delay={0} style={{ top: -80, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: "#FFD6DD" }} />
      <Blob delay={150} style={{ top: height * 0.45, left: -90, width: 190, height: 190, borderRadius: 95, backgroundColor: "#FFE9A8" }} />
      <Blob delay={300} style={{ bottom: -50, right: -50, width: 200, height: 200, borderRadius: 100, backgroundColor: "#E7D5FF" }} />
      {long ? <Hearts count={14} w={width} h={height} /> : null}
      <Animated.View style={{ alignItems: "center", opacity: logo, transform: [{ scale: logo.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }) }, { scale: beat.interpolate({ inputRange: [0, 1], outputRange: [1, 1.04] }) }] }}>
        <Image source={require("../../assets/logo.png")} style={{ width: size, height: size }} resizeMode="contain" />
      </Animated.View>
      <Animated.Text style={[s.tag, { opacity: text, transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>« Mon corps, ma santé, ma communauté »</Animated.Text>
    </Animated.View>
  );
}

// Bienvenue après la toute première inscription.
export function WelcomeBurst({ name, onDone }: { name?: string; onDone: () => void }) {
  const { width, height } = useWindowDimensions();
  const v = useRef(new Animated.Value(0)).current, out = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.sequence([Animated.spring(v, { toValue: 1, friction: 5, tension: 70, useNativeDriver: true }), Animated.delay(2200), Animated.timing(out, { toValue: 0, duration: 450, useNativeDriver: true })]).start(() => onDone());
  }, []);
  return (
    <Animated.View style={[s.full, { opacity: out, backgroundColor: "rgba(255,246,240,0.96)" }]}>
      <Hearts count={22} w={width} h={height} />
      <Animated.View style={{ alignItems: "center", transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) }], opacity: v }}>
        <Text style={{ fontSize: 64 }}>🎉</Text>
        <Text style={s.h}>Bienvenue{name ? `, ${name}` : ""} !</Text>
        <Text style={s.p}>Ton espace est prêt. Il est à toi, et il est privé.</Text>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  full: { ...StyleSheet.absoluteFillObject, backgroundColor: "#FCF6F6", alignItems: "center", justifyContent: "center", zIndex: 999, elevation: 999, overflow: "hidden" },
  tag: { marginTop: 8, color: "#6E5C68", fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "center", paddingHorizontal: 30 },
  h: { fontFamily: "Poppins_800ExtraBold", fontSize: 26, color: "#3B1D33", marginTop: 12, textAlign: "center" },
  p: { fontFamily: "Inter_400Regular", color: "#6E5C68", marginTop: 8, textAlign: "center", paddingHorizontal: 40, lineHeight: 21 },
});
