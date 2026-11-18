import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Image, Linking, NativeScrollEvent, NativeSyntheticEvent, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { apiRequest } from "../api/client";
import { apiOrigin } from "../api/client";
import { frToKey, loadCarnets, todayFr, typeOf } from "../storage/carnets";

// Bandeau qui défile sur l'accueil : « Tes prochaines règles » reste toujours prioritaire (première carte,
// affichée plus longtemps, et le défilement y revient toujours), puis rappels du carnet, formations et annonces.
interface Slide { key: string; emoji: string; title: string; big?: string; sub?: string; button?: string; target?: string; colors: [string, string]; priority?: boolean; image?: string; link?: string }
const PALETTE: Record<string, [string, string]> = {
  rose: ["#FF5470", "#FF8A5B"], violet: ["#7B4AE2", "#B07CFF"], bleu: ["#2F80ED", "#56CCF2"], vert: ["#27AE60", "#6FCF97"], jaune: ["#F2994A", "#F2C94C"],
};
const W = Dimensions.get("window").width - 40;
const GAP = 12;

const MONTHS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const longDate = (iso: string) => { const d = new Date(iso); return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`; };
const daysUntil = (fr: string) => { const k = frToKey(fr); if (k === "0") return null; const d = new Date(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8)); const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((d.getTime() - t.getTime()) / 86400000); };
const when = (n: number) => (n === 0 ? "aujourd'hui" : n === 1 ? "demain" : `dans ${n} jours`);

export default function HomeCarousel({ nextPeriod, navigation }: { nextPeriod: string | null | undefined; navigation: any }) {
  const [extra, setExtra] = useState<Slide[]>([]);
  const x = useRef(new Animated.Value(0)).current;
  const scroller = useRef<any>(null);
  const idx = useRef(0);
  const touching = useRef(false);
  const [page, setPage] = useState(0);

  const period: Slide = {
    key: "period", emoji: "🌸", priority: true, colors: PALETTE.rose, target: "Cycle", button: "Voir mon cycle →",
    title: "Tes prochaines règles",
    big: nextPeriod ? longDate(nextPeriod) : "Pas encore de date",
    sub: nextPeriod ? undefined : "Note tes règles pour voir ta date.",
  };
  const slides = [period, ...extra];

  const build = useCallback(async () => {
    const out: Slide[] = [];
    try { // rappels du carnet (stockés sur le téléphone)
      const carnets = await loadCarnets();
      const today = todayFr();
      for (const c of carnets) {
        const t = typeOf(c.type);
        for (const e of c.entries) {
          const cand: { d: string; label: string }[] = [];
          if (e.values.next) cand.push({ d: e.values.next, label: c.type === "vaccin" ? `Rendez-vous vaccin${e.values.bebe ? " de " + e.values.bebe : ""}` : "Prochaine visite prénatale" });
          if (c.type === "sante" && e.values.quoi === "Rendez-vous") cand.push({ d: e.date, label: `Rendez-vous${e.values.valeur ? " : " + e.values.valeur : ""}` });
          for (const k of cand) { const n = daysUntil(k.d); if (n !== null && n >= 0 && n <= 14) out.push({ key: `c${e.id}${k.label}`, emoji: t.emoji, title: "Rappel de ton carnet", big: k.label, sub: `${when(n)} (${k.d})`, button: "Ouvrir Mon Carnet →", target: "MonCarnet", colors: PALETTE.vert }); }
        }
      }
      void today;
    } catch { /* ignore */ }
    try { // formations
      const courses = await apiRequest<any[]>("/catalog/courses", { silent: true });
      const live = courses.find((c) => c.liveState === "EN_COURS");
      if (live) out.push({ key: "live", emoji: "🔴", title: "En direct maintenant", big: live.title, sub: "Rejoins le direct !", button: "Rejoindre →", target: "Formations", colors: ["#E5252A", "#FF6B6B"] });
      else {
        const next = courses.filter((c) => c.startsAt && new Date(c.startsAt) > new Date() && c.state !== "REPORTEE").sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0];
        if (next) out.push({ key: "course", emoji: next.icon || "🎓", title: "Prochaine formation", big: next.title, sub: longDate(next.startsAt), button: "Voir la formation →", target: "Formations", colors: PALETTE.violet });
      }
    } catch { /* ignore */ }
    try { // annonces
      const anns = await apiRequest<any[]>("/catalog/announcements", { silent: true });
      anns.forEach((a) => out.push({ key: "a" + a.id, emoji: a.emoji, title: a.title, big: undefined, sub: a.body, button: a.buttonLabel || (a.target || a.linkUrl ? "Découvrir →" : undefined), target: a.target || undefined, link: a.linkUrl || undefined, image: a.imageUrl ? apiOrigin + a.imageUrl : undefined, colors: PALETTE[a.color] || PALETTE.violet }));
    } catch { /* ignore */ }
    setExtra(out);
  }, []);

  useFocusEffect(useCallback(() => { build(); idx.current = 0; scroller.current?.scrollTo({ x: 0, animated: false }); }, [build]));

  // Défilement automatique : 3 secondes par carte, en boucle. Le minuteur tourne tout seul : il ne dépend pas
  // des événements de fin de défilement, que certains téléphones n'envoient pas après un défilement programmé.
  const n = slides.length;
  useEffect(() => {
    if (n < 2) return;
    const id = setInterval(() => {
      if (touching.current) return;
      const next = (idx.current + 1) % n;
      idx.current = next; setPage(next);
      scroller.current?.scrollTo({ x: next * (W + GAP), animated: true });
    }, 3000);
    return () => clearInterval(id);
  }, [n]);

  // Après un geste de la fille : on reprend sa position, puis le défilement repart au bout de 3 secondes.
  const resume = useRef<any>(null);
  const onEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.max(0, Math.min(n - 1, Math.round(e.nativeEvent.contentOffset.x / (W + GAP))));
    idx.current = i; setPage(i);
    clearTimeout(resume.current);
    resume.current = setTimeout(() => { touching.current = false; }, 3000);
  };
  useEffect(() => () => clearTimeout(resume.current), []);

  return (
    <View>
      <Animated.ScrollView ref={scroller} style={{ flexGrow: 0, height: 150 }} horizontal showsHorizontalScrollIndicator={false} snapToInterval={W + GAP} decelerationRate="fast" scrollEventThrottle={16}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x } } }], { useNativeDriver: true })}
        onScrollBeginDrag={() => { touching.current = true; clearTimeout(resume.current); }} onScrollEndDrag={onEnd} onMomentumScrollEnd={onEnd}
        contentContainerStyle={{ paddingVertical: 0 }}>
        {slides.map((s, i) => {
          const r = [(i - 1) * (W + GAP), i * (W + GAP), (i + 1) * (W + GAP)];
          const scale = x.interpolate({ inputRange: r, outputRange: [0.94, 1, 0.94], extrapolate: "clamp" });
          const opacity = x.interpolate({ inputRange: r, outputRange: [0.7, 1, 0.7], extrapolate: "clamp" });
          const shift = x.interpolate({ inputRange: r, outputRange: [18, 0, -18], extrapolate: "clamp" });
          return (
            <Animated.View key={s.key} style={{ width: W, marginRight: i === slides.length - 1 ? 0 : GAP, transform: [{ scale }], opacity }}>
              <LinearGradient colors={s.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={st.card}>
                {s.image ? <Image source={{ uri: s.image }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : <><View style={st.blob1} /><View style={st.blob2} /></>}
                {s.image ? (s.button && (s.target || s.link) ? <TouchableOpacity style={[st.btn, { position: "absolute", left: 16, bottom: 14, marginTop: 0 }]} onPress={() => (s.link ? Linking.openURL(s.link).catch(() => {}) : navigation.navigate(s.target))}><Text style={[st.btnT, { color: s.colors[0] }]}>{s.button}</Text></TouchableOpacity> : null) : <Animated.View style={{ transform: [{ translateX: shift }] }}>
                  <Text style={st.label}>{s.emoji} {s.title}</Text>
                  {s.big ? <Text style={[st.big, !s.priority && { fontSize: 21, lineHeight: 26 }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{s.big}</Text> : null}
                  {s.sub ? <Text style={st.sub} numberOfLines={1}>{s.sub}</Text> : null}
                  {s.button && (s.target || s.link) ? <TouchableOpacity style={st.btn} onPress={() => (s.link ? Linking.openURL(s.link).catch(() => {}) : navigation.navigate(s.target))}><Text style={[st.btnT, { color: s.colors[0] }]}>{s.button}</Text></TouchableOpacity> : null}
                </Animated.View>}
              </LinearGradient>
            </Animated.View>);
        })}
      </Animated.ScrollView>
      {slides.length > 1 && (
        <View style={st.dots} pointerEvents="none">
          {slides.map((s, i) => {
            const r = [(i - 1) * (W + GAP), i * (W + GAP), (i + 1) * (W + GAP)];
            return <Animated.View key={s.key} style={[st.dot, { width: 14, transform: [{ scaleX: x.interpolate({ inputRange: r, outputRange: [0.36, 1, 0.36], extrapolate: "clamp" }) }], opacity: x.interpolate({ inputRange: r, outputRange: [0.5, 1, 0.5], extrapolate: "clamp" }) }]} />;
          })}
        </View>)}
    </View>
  );
}

const st = StyleSheet.create({
  card: { borderRadius: 28, paddingVertical: 14, paddingHorizontal: 20, height: 150, overflow: "hidden", justifyContent: "center" },
  blob1: { position: "absolute", right: -30, top: -30, width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.18)" },
  blob2: { position: "absolute", right: 30, bottom: -40, width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,255,255,0.14)" },
  label: { color: "#fff", fontFamily: "Inter_600SemiBold", fontSize: 13, opacity: 0.92, marginBottom: 4 },
  big: { color: "#fff", fontFamily: "Poppins_800ExtraBold", fontSize: 27, lineHeight: 30 },
  sub: { color: "#fff", fontSize: 13, marginTop: 6, opacity: 0.95, lineHeight: 18, fontFamily: "Inter_400Regular" },
  btn: { alignSelf: "flex-start", backgroundColor: "#fff", borderRadius: 999, paddingHorizontal: 15, paddingVertical: 8, marginTop: 10 }, btnT: { fontFamily: "Inter_700Bold", fontSize: 12.5 },
  dots: { position: "absolute", left: 0, right: 0, bottom: 9, flexDirection: "row", justifyContent: "center", gap: 5 }, dot: { height: 5, borderRadius: 3, backgroundColor: "#fff" },
});
