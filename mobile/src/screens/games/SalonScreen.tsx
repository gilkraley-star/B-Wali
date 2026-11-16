import React, { useEffect, useState } from "react";
import { play as snd } from "../../games/sounds";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, spacing } from "../../theme/colors";

const SERV: Record<string, { name: string; e: string; v: string; p: number; c: number }> = {
  tresses: { name: "Tresses", e: "💇🏾‍♀️", v: "Tresser", p: 4000, c: 1500 },
  simple: { name: "Coiffure simple", e: "✨", v: "Coiffer", p: 1500, c: 300 },
  ourlet: { name: "Ourlet de pagne", e: "🧵", v: "Coudre", p: 1000, c: 200 },
  robe: { name: "Robe en pagne", e: "👗", v: "Coudre", p: 8000, c: 4000 },
};
const CLIENTS = [
  { n: "Mariama", e: "👩🏾", s: "tresses", b: 5000 }, { n: "Sandrine", e: "👧🏾", s: "simple", b: 1500 }, { n: "Tante Rose", e: "👵🏾", s: "ourlet", b: 1100 }, { n: "Grâce", e: "👩🏿", s: "robe", b: 8500 },
  { n: "Fatou", e: "👩🏽", s: "tresses", b: 4500 }, { n: "Léa", e: "👧🏽", s: "simple", b: 2200 }, { n: "Clarisse", e: "👩🏾", s: "robe", b: 12000 }, { n: "Nadège", e: "👩🏿", s: "ourlet", b: 1200 },
];
const SHOP = [
  { id: "plante", e: "🌿", n: "Une plante verte", x: "Ça rend le salon agréable", p: 1500 }, { id: "radio", e: "📻", n: "Une radio", x: "De la musique pour les clientes", p: 2000 },
  { id: "miroir", e: "🪞", n: "Un grand miroir", x: "Elles aiment se voir", p: 3000 }, { id: "fauteuil", e: "🛋️", n: "Un fauteuil confortable", x: "Elles attendent bien assises", p: 4000 },
  { id: "enseigne", e: "💡", n: "Une enseigne lumineuse", x: "On te voit de loin", p: 5000 },
];
const GIFTS = ["Un pagne en cadeau 🎀", "Un panier de mangues 🥭", "Des bijoux faits main 💍", "Un gentil mot : « Merci, tu travailles bien ! » 💌"];
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
const KEY = "bewali.salon";

export default function SalonScreen({ navigation }: any) {
  const [day, setDay] = useState(1); const [i, setI] = useState(0); const [cash, setCash] = useState(5000); const [dp, setDp] = useState(0); const [owned, setOwned] = useState<string[]>([]);
  const [phase, setPhase] = useState<"scene" | "work" | "pick" | "result" | "summary" | "shop">("scene");
  const [taps, setTaps] = useState(0);
  const [res, setRes] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => { navigation.setOptions({ title: "Mon salon 💇🏾‍♀️" }); AsyncStorage.getItem(KEY).then((v) => { if (v) { const d = JSON.parse(v); setDay(d.day); setCash(d.cash); setOwned(d.owned); } setLoaded(true); }); }, []);
  useEffect(() => { if (loaded) AsyncStorage.setItem(KEY, JSON.stringify({ day, cash, owned })); }, [day, cash, owned, loaded]);

  const rep = owned.length;
  const cl = CLIENTS[((day - 1) * 4 + i) % CLIENTS.length];
  const sv = SERV[cl.s];
  const budget = Math.round((cl.b * (1 + 0.1 * rep)) / 100) * 100;
  const opts = [
    { k: 0, label: "Petit prix", sub: "Elle sera très contente", e: "🙂", bg: "#DDF5E8", price: Math.round((sv.p * 0.7) / 100) * 100 },
    { k: 1, label: "Bon prix", sub: "Le prix normal", e: "👍", bg: "#FFF1CC", price: sv.p },
    { k: 2, label: "Gros prix", sub: "Tu veux gagner beaucoup", e: "🤑", bg: "#FFE0E6", price: Math.round((sv.p * 1.4) / 100) * 100 },
  ];
  function choose(o: (typeof opts)[0]) {
    const profit = o.price - sv.c;
    if (o.price > budget) { setRes({ e: "😕", t: cl.n + " est partie", x: "Trop cher pour elle : elle avait environ " + fmt(budget) + " F. Demande un prix qu'elle peut payer.", money: false }); }
    else {
      setRes({ e: o.k === 0 ? "😊" : o.k === 1 ? "👏" : "🤩", t: o.k === 0 ? cl.n + " est ravie !" : o.k === 1 ? "Bon prix !" : "Quel flair !",
        x: o.k === 0 ? "Petit prix : elle est contente, mais tu aurais pu demander un peu plus." : o.k === 1 ? cl.n + " paie sans discuter." : cl.n + " accepte. Tu as bien jugé ce qu'elle pouvait payer.",
        money: true, price: o.price, cost: sv.c, profit, gift: o.k < 2 ? GIFTS[(day + i + o.k) % GIFTS.length] : "" });
      setCash(cash + profit); setDp(dp + profit); snd("coin");
    }
    setPhase("result");
  }
  function tap() { const t = taps + 1; setTaps(t); if (t >= 5) setTimeout(() => setPhase("pick"), 350); }

  return (
    <ScrollView style={s.c} contentContainerStyle={{ padding: spacing.lg }}>
      <View style={s.top}><Text style={s.topT}>Jour {day}</Text><Text style={s.topT}>💰 {fmt(cash)} F</Text><Text style={s.topT}>⭐ Réputation {rep}</Text></View>
      <View style={s.sign}><Text style={s.signT}>{owned.includes("enseigne") ? "💡 SALON WALI 💡" : "Salon Wali"}</Text><Text style={{ fontSize: 22 }}>{owned.map((id) => SHOP.find((x) => x.id === id)!.e).join(" ")}</Text></View>
      {phase === "scene" && (<View style={s.card}><Text style={{ fontSize: 54 }}>{cl.e}</Text><Text style={s.big}>{cl.n} arrive</Text><Text style={s.mut}>Elle veut : {sv.e} {sv.name}. Cliente {i + 1} sur 4.</Text>
        <TouchableOpacity style={s.cta} onPress={() => { setTaps(0); setPhase("work"); }}><Text style={s.ctaT}>Accueillir</Text></TouchableOpacity></View>)}
      {phase === "work" && (<View style={s.card}><Text style={s.big}>{sv.v} {sv.e}</Text><Text style={s.mut}>Touche vite {5 - Math.min(taps, 5)} fois !</Text>
        <View style={s.bar}><View style={[s.barF, { width: `${Math.min(100, taps * 20)}%` }]} /></View>
        <TouchableOpacity style={s.tapBtn} onPress={tap}><Text style={{ fontSize: 40 }}>{sv.e}</Text></TouchableOpacity></View>)}
      {phase === "pick" && (<View><Text style={s.big}>Quel prix demandes-tu ?</Text><Text style={s.mut}>Ce que ça te coûte : {fmt(sv.c)} F (matériel). Fais attention : elle n'a pas un budget sans limite.</Text>
        {opts.map((o) => (<TouchableOpacity key={o.k} style={[s.opt, { backgroundColor: o.bg }]} onPress={() => choose(o)}><Text style={{ fontSize: 28 }}>{o.e}</Text><View style={{ flex: 1 }}><Text style={s.optT}>{o.label}</Text><Text style={s.mut}>{o.sub}</Text></View><Text style={s.optT}>{fmt(o.price)} F</Text></TouchableOpacity>))}</View>)}
      {phase === "result" && res && (<View style={s.card}><Text style={{ fontSize: 54 }}>{res.e}</Text><Text style={s.big}>{res.t}</Text><Text style={s.mut}>{res.x}</Text>
        {res.money && (<View style={{ alignSelf: "stretch", marginTop: 10 }}><Text style={s.line}>Tu reçois : {fmt(res.price)} F</Text><Text style={s.line}>Ça t'a coûté : − {fmt(res.cost)} F</Text><Text style={[s.line, { fontWeight: "800", color: res.profit >= 0 ? "#1E8A55" : "#E5252A" }]}>Ton gain : {fmt(res.profit)} F</Text>{res.gift ? <Text style={s.gift}>🎁 {res.gift}</Text> : null}</View>)}
        <TouchableOpacity style={s.cta} onPress={() => { if (i >= 3) setPhase("summary"); else { setI(i + 1); setPhase("scene"); } }}><Text style={s.ctaT}>{i >= 3 ? "Voir ma journée" : "Cliente suivante →"}</Text></TouchableOpacity></View>)}
      {phase === "summary" && (<View style={s.card}><Text style={{ fontSize: 54 }}>🌙</Text><Text style={s.big}>Fin du jour {day}</Text><Text style={s.mut}>Gain du jour : {fmt(dp)} F · En caisse : {fmt(cash)} F</Text>
        <Text style={s.mut}>Le gain, c'est ce que tu reçois, moins ce que tu dépenses.</Text>
        <TouchableOpacity style={s.cta} onPress={() => setPhase("shop")}><Text style={s.ctaT}>🛍️ Améliorer mon salon</Text></TouchableOpacity>
        <TouchableOpacity style={[s.cta, { backgroundColor: "#2FB872" }]} onPress={() => { setDay(day + 1); setI(0); setDp(0); setPhase("scene"); }}><Text style={s.ctaT}>Jour suivant ▶</Text></TouchableOpacity></View>)}
      {phase === "shop" && (<View><Text style={s.big}>Ta boutique</Text><Text style={s.mut}>Un beau salon attire des clientes qui paient un peu plus.</Text>
        {SHOP.map((it) => { const has = owned.includes(it.id); const can = !has && cash >= it.p; return (
          <View key={it.id} style={[s.opt, { backgroundColor: "#fff", opacity: has || can ? 1 : 0.5 }]}><Text style={{ fontSize: 26 }}>{it.e}</Text><View style={{ flex: 1 }}><Text style={s.optT}>{it.n}</Text><Text style={s.mut}>{it.x}</Text></View>
            <TouchableOpacity disabled={!can} onPress={() => { setOwned([...owned, it.id]); setCash(cash - it.p); }} style={[s.buy, { backgroundColor: has ? "#DDF5E8" : can ? "#FFD84D" : "#EEE6EC" }]}><Text style={{ fontWeight: "800", color: has ? "#1E8A55" : colors.text }}>{has ? "Acheté ✓" : fmt(it.p) + " F"}</Text></TouchableOpacity></View>); })}
        <TouchableOpacity style={s.cta} onPress={() => setPhase("summary")}><Text style={s.ctaT}>‹ Retour</Text></TouchableOpacity></View>)}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  top: { flexDirection: "row", justifyContent: "space-between", backgroundColor: "#fff", borderRadius: 18, padding: 12, marginBottom: 10 }, topT: { fontWeight: "800", color: colors.text, fontSize: 13 },
  sign: { alignItems: "center", backgroundColor: "#FFE0E6", borderRadius: 20, padding: 10, marginBottom: 12 }, signT: { fontWeight: "800", color: colors.prune, fontSize: 16 },
  card: { backgroundColor: "#fff", borderRadius: 28, padding: 20, alignItems: "center" }, big: { fontSize: 20, fontWeight: "800", color: colors.text, marginTop: 6, textAlign: "center" },
  mut: { color: colors.textMuted, textAlign: "center", marginTop: 4, lineHeight: 19 },
  cta: { backgroundColor: colors.rose, borderRadius: 999, padding: 15, alignItems: "center", marginTop: 14, alignSelf: "stretch" }, ctaT: { color: "#fff", fontWeight: "800", fontSize: 15 },
  bar: { height: 10, backgroundColor: "#F1E6EE", borderRadius: 5, alignSelf: "stretch", marginTop: 12, overflow: "hidden" }, barF: { height: 10, backgroundColor: colors.rose },
  tapBtn: { width: 110, height: 110, borderRadius: 55, backgroundColor: "#FFE9A8", alignItems: "center", justifyContent: "center", marginTop: 16 },
  opt: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 22, padding: 14, marginTop: 10 }, optT: { fontWeight: "800", color: colors.text },
  line: { color: colors.text, marginTop: 3 }, gift: { marginTop: 8, color: "#7A5410", fontWeight: "700" },
  buy: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
});
