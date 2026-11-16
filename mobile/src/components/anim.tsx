import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleProp, ViewStyle } from "react-native";

// Petites animations réutilisables (celles de la maquette) : apparition en glissant, flottement, pulsation, balancement.
export function FadeUp({ delay = 0, style, children }: { delay?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 550, delay, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start(); }, []);
  return <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }] }]}>{children}</Animated.View>;
}
function loop(v: Animated.Value, ms: number, delay = 0) {
  Animated.loop(Animated.sequence([Animated.timing(v, { toValue: 1, duration: ms / 2, delay, easing: Easing.inOut(Easing.sin), useNativeDriver: true }), Animated.timing(v, { toValue: 0, duration: ms / 2, easing: Easing.inOut(Easing.sin), useNativeDriver: true })])).start();
}
export function Float({ style, delay = 0 }: { style?: StyleProp<ViewStyle>; delay?: number }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => loop(v, 6000, delay), []);
  return <Animated.View pointerEvents="none" style={[style, { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -7] }) }] }]} />;
}
export function Pulse({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => loop(v, 2000), []);
  return <Animated.View style={[style, { transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] }) }] }]}>{children}</Animated.View>;
}
export function Wiggle({ style, children }: { style?: StyleProp<ViewStyle>; children: React.ReactNode }) {
  const v = useRef(new Animated.Value(0)).current;
  useEffect(() => loop(v, 2600), []);
  return <Animated.View style={[style, { transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ["-8deg", "8deg"] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] }) }] }]}>{children}</Animated.View>;
}
