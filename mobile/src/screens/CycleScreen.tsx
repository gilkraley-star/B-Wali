import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "@react-navigation/native";
import { addLocalPeriod, endPeriodOn, estimateLocal, getCycleLen, getPeriodLen, loadLocalPeriods, LocalPeriod, removePeriod, savePeriod, setCycleLen, setPeriodLen, syncCycle } from "../storage/localCycle";
import { colors } from "../theme/colors";
import { PrimaryButton } from "../theme/ui";
import { FadeUp } from "../components/anim";
import SosChip from "../components/SosChip";
import { scheduleCycleReminders } from "../notifications";

// Mon Cycle (maquette) : 1) « Connais-tu ton cycle ? » 2) saisie rapide ou mode « apprentissage » 3) tableau de bord avec calendrier.
const DAY = 86400000;
const MONTHS = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"];
const pad = (n: number) => String(n).padStart(2, "0");
const key = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parse = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const long = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()].toLowerCase()}`;

export default function CycleScreen({ navigation }: any) {
  const [periods, setPeriods] = useState<LocalPeriod[]>([]);
  const [len, setLen] = useState(28);
  const [plen, setPlen] = useState(5);
  const [dayMenu, setDayMenu] = useState<Date | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [mode, setMode] = useState<"ask" | "known" | "learning">("ask");
  const [first, setFirst] = useState({ d: "", m: "", y: "" });
  const [lenText, setLenText] = useState("28");
  const [month, setMonth] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1); });

  const load = useCallback(async () => {
    const [local, l, pl] = await Promise.all([loadLocalPeriods(), getCycleLen(), getPeriodLen()]);
    setPeriods(local); setLen(l); setPlen(pl); setLenText(String(l)); setLoaded(true);
    const synced = await syncCycle();
    if (synced) setPeriods(synced);
    scheduleCycleReminders();
  }, []);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const est = estimateLocal(periods, len);
  const cycleLen = est.averageCycleLength || len;
  const next = est.nextEstimatedStart ? parse(est.nextEstimatedStart) : null;

  const marks = useMemo(() => {
    const period = new Set<string>(), fertile = new Set<string>(), risk = new Set<string>(), predicted = new Set<string>();
    periods.forEach((p) => { const s = parse(p.startDate); const n = p.endDate ? Math.max(1, Math.round((parse(p.endDate).getTime() - s.getTime()) / DAY) + 1) : plen; for (let i = 0; i < n; i++) period.add(key(addDays(s, i))); });
    if (next) {
      predicted.add(key(next));
      for (let c = 0; c < 3; c++) { // cycles à venir
        const nx = addDays(next, c * cycleLen); const ov = addDays(nx, -14);
        if (c > 0) predicted.add(key(nx));
        for (let i = -5; i <= 1; i++) fertile.add(key(addDays(ov, i)));
        for (let i = -2; i <= 0; i++) risk.add(key(addDays(ov, i)));
      }
      const last = periods.length ? parse(periods[0].startDate) : null; // cycle en cours : ovulation = prochaines règles - 14 j (déjà couvert)
      void last;
    }
    return { period, fertile, risk, predicted };
  }, [periods, next?.getTime(), cycleLen, plen]);

  async function saveStart(dateKey: string) {
    const list = await addLocalPeriod(dateKey); setPeriods(list); load();
  }
  const refresh = (list: LocalPeriod[]) => { setPeriods(list); setDayMenu(null); syncCycle().then((x) => x && setPeriods(x)); scheduleCycleReminders(); };
  function onDay(d: Date) { if (d.getTime() > Date.now() + DAY) return Alert.alert("Pas encore", "Tu ne peux noter que les jours passés ou aujourd'hui."); setDayMenu(d); }
  const changeLen = async (n: number) => { const v = Math.max(15, Math.min(60, n)); setLen(v); setLenText(String(v)); await setCycleLen(v); scheduleCycleReminders(); };
  const changePlen = async (n: number) => { const v = Math.max(2, Math.min(10, n)); setPlen(v); await setPeriodLen(v); };

  if (!loaded) return <View style={s.c} />;
  const hasData = periods.length > 0;

  // 1) Connais-tu ton cycle ?
  if (!hasData && mode === "ask") return (
    <Shell navigation={navigation}>
      <Text style={{ fontSize: 56, textAlign: "center", marginTop: 70 }}>📅</Text>
      <FadeUp><Text style={s.h1c}>Connais-tu ton cycle ?</Text>
        <Text style={s.pc}>C'est le nombre de jours entre le début de deux règles.</Text>
        <Text style={s.priv}>🔒 Ce que tu notes ici reste dans ton espace privé. Personne d'autre ne le voit.</Text></FadeUp>
      <View style={{ marginTop: 28 }}>
        <PrimaryButton title="Oui, je connais mon cycle" onPress={() => setMode("known")} />
        <PrimaryButton title="Non, je ne sais pas encore" variant="secondary" onPress={() => setMode("learning")} />
      </View>
    </Shell>);

  // 2a) Deux questions
  if (!hasData && mode === "known") return (
    <Shell navigation={navigation}>
      <FadeUp style={{ marginTop: 60 }}><Text style={s.h1}>Deux questions, c'est tout</Text>
        <Text style={s.p}>Avec ça, on calcule tes prochaines règles et ta période féconde.</Text>
        <Text style={s.lab}>Premier jour de tes dernières règles</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          {([["d", "Jour", 2], ["m", "Mois", 2], ["y", "Année", 4]] as const).map(([k, ph, max]) => (
            <TextInput key={k} style={[s.in, { flex: k === "y" ? 1.6 : 1, width: 0, minWidth: 0, textAlign: "center" }]} value={(first as any)[k]} placeholder={ph} keyboardType="number-pad" maxLength={max} onChangeText={(v) => setFirst({ ...first, [k]: v.replace(/\D/g, "") })} />))}
        </View>
        <Text style={s.lab}>Durée habituelle de ton cycle (en jours)</Text>
        <TextInput style={s.in} value={lenText} onChangeText={(v) => setLenText(v.replace(/\D/g, "").slice(0, 2))} keyboardType="number-pad" />
        <Text style={s.small}>Pas sûre ? 28 jours est une bonne moyenne pour commencer. L'application l'ajustera toute seule au fil de tes cycles.</Text>
      </FadeUp>
      <PrimaryButton title="Valider" onPress={async () => {
        const d = +first.d, m = +first.m, y = +first.y; const dt = new Date(y, m - 1, d);
        if (!d || !m || first.y.length !== 4 || dt.getMonth() !== m - 1 || dt > new Date() || dt < addDays(new Date(), -120)) return Alert.alert("Date", "Écris la date de ton dernier premier jour de règles (il y a moins de 4 mois).");
        const n = parseInt(lenText, 10); if (!(n >= 15 && n <= 60)) return Alert.alert("Durée du cycle", "Écris un nombre de jours entre 15 et 60 (souvent 28).");
        await setCycleLen(n); await saveStart(key(dt));
      }} />
      <TouchableOpacity onPress={() => setMode("ask")}><Text style={s.back}>Retour</Text></TouchableOpacity>
    </Shell>);

  // 2b) Pas de souci
  if (!hasData && mode === "learning") return (
    <Shell navigation={navigation}>
      <Text style={{ fontSize: 56, textAlign: "center", marginTop: 70 }}>🌱</Text>
      <FadeUp><Text style={s.h1c}>Pas de souci</Text>
        <Text style={s.pc}>Beaucoup de filles ne connaissent pas leur cycle, et c'est normal. Attends tes prochaines règles : le jour exact où elles arrivent, dis-le-nous ici. Ensemble, on apprendra ton cycle petit à petit.</Text></FadeUp>
      <View style={{ marginTop: 22 }}><PrimaryButton title="Mes règles ont commencé aujourd'hui" onPress={() => saveStart(key(new Date()))} />
        <Text style={s.small2}>Si elles ne sont pas encore là, reviens sur cet écran le jour où elles arrivent.</Text>
        <TouchableOpacity onPress={() => setMode("ask")}><Text style={s.back}>Retour</Text></TouchableOpacity></View>
    </Shell>);

  // 3) Tableau de bord
  const today = new Date(); const todayK = key(today);
  const first1 = new Date(month.getFullYear(), month.getMonth(), 1);
  const offset = (first1.getDay() + 6) % 7; const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells: (Date | null)[] = [...Array(offset).fill(null), ...Array.from({ length: count }, (_, i) => new Date(month.getFullYear(), month.getMonth(), i + 1))];
  while (cells.length % 7) cells.push(null);
  const rows: (Date | null)[][] = []; for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  const daysTo = next ? Math.round((next.getTime() - new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()) / DAY) : null;
  const ov = next ? addDays(next, -14) : null; const fS = ov ? addDays(ov, -5) : null; const fE = ov ? addDays(ov, 1) : null;
  const lastP = periods[0] ? parse(periods[0].startDate) : null;
  const todayD = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const cycleDay = lastP ? Math.round((todayD.getTime() - lastP.getTime()) / DAY) + 1 : 0;
  const inPeriod = !!periods[0] && !periods[0].endDate && cycleDay >= 1 && cycleDay <= 12;
  const ovDay = cycleLen - 14;
  const phase = !lastP || cycleDay < 1 ? { label: "Aujourd'hui", title: "Dis-nous quand elles ont commencé", text: "Touche le bouton quand tes règles arrivent : Wali apprend ton cycle." }
    : inPeriod || cycleDay <= plen ? { label: `Jour ${cycleDay} de ton cycle`, title: "Tes règles 🩸", text: "Bois de l'eau, repose-toi si tu as mal au ventre. Une bouillotte tiède aide. Touche « finies » quand elles s'arrêtent." }
    : cycleDay > cycleLen + 3 ? { label: `Jour ${cycleDay} de ton cycle`, title: "Tes règles sont en retard", text: "Un retard arrive (stress, fatigue). Si tu as eu un rapport sans protection, fais un test ou parle à une sage-femme." }
    : cycleDay >= ovDay - 5 && cycleDay <= ovDay + 1 ? { label: `Jour ${cycleDay} de ton cycle`, title: "Jours fertiles 💗", text: "Tu peux tomber enceinte ces jours-ci. Protège-toi si tu ne veux pas de bébé." }
    : cycleDay < ovDay - 5 ? { label: `Jour ${cycleDay} de ton cycle`, title: "Après tes règles 🌱", text: "Beaucoup de filles ont plus d'énergie à ce moment." }
    : { label: `Jour ${cycleDay} de ton cycle`, title: "Avant tes prochaines règles 🌙", text: "Fatigue, ventre gonflé ou humeur changeante sont possibles. C'est normal." };
  const refresh2 = (pr: Promise<LocalPeriod[]>) => pr.then(refresh);
  const inFertile = fS && fE && today >= fS && today <= addDays(fE, 1);

  return (
    <Shell navigation={navigation} scroll>
      <FadeUp><Text style={[s.h1, { marginTop: 8 }]}>Mon Cycle</Text></FadeUp>
      <FadeUp delay={80}>
        <View style={s.cal}>
          <View style={s.calHead}>
            <TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} hitSlop={12}><Text style={s.arrow}>‹</Text></TouchableOpacity>
            <Text style={s.month}>{MONTHS[month.getMonth()]} {month.getFullYear()}</Text>
            <TouchableOpacity onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} hitSlop={12}><Text style={s.arrow}>›</Text></TouchableOpacity>
          </View>
          <View style={s.wk}>{["L", "M", "M", "J", "V", "S", "D"].map((w, i) => <Text key={i} style={s.wkT}>{w}</Text>)}</View>
          {rows.map((r, ri) => (
            <View key={ri} style={s.wk}>{r.map((d, ci) => {
              if (!d) return <View key={ci} style={s.cell} />;
              const k = key(d); const isP = marks.period.has(k), isR = marks.risk.has(k) && !isP, isF = marks.fertile.has(k) && !isP && !isR, isPred = marks.predicted.has(k) && !isP;
              const bg = isP ? "#FF5470" : isR ? "#FF9A62" : isF ? "#FFE3D4" : "transparent";
              const fg = isP || isR ? "#fff" : "#3B1D33";
              return (
                <TouchableOpacity key={ci} style={[s.cell, { backgroundColor: bg }, k === todayK && s.today, isPred && s.pred]} onPress={() => onDay(d)} activeOpacity={0.7}>
                  {isP || isF || isR ? <Text style={{ fontSize: 9 }}>{isP ? "🩸" : isR ? "⚠️" : "💗"}</Text> : null}
                  <Text style={[s.num, { color: fg, fontFamily: isP || isR || k === todayK ? "Inter_700Bold" : "Inter_400Regular" }]}>{d.getDate()}</Text>
                </TouchableOpacity>);
            })}</View>))}
          <View style={s.legend}>
            <Text style={s.lg}>🩸 Règles</Text><Text style={s.lg}>💗 Jours fertiles</Text><Text style={s.lg}>⚠️ Risque maximum</Text><Text style={s.lg}>✨ Aujourd'hui</Text><Text style={s.lg}>- - - Règles prévues</Text>
          </View>
        </View>
      </FadeUp>

      <FadeUp delay={120}>
        <View style={s.card}>
          <Text style={s.cardLab}>{phase.label}</Text>
          <Text style={s.big}>{phase.title}</Text>
          <Text style={s.small}>{phase.text}</Text>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
            <TouchableOpacity style={[s.cta, { flex: 1 }]} onPress={() => (inPeriod ? refresh2(endPeriodOn(todayK)) : refresh2(savePeriod(todayK)))} activeOpacity={0.85}>
              <Text style={s.ctaT}>{inPeriod ? "🏁 Mes règles sont finies" : "🩸 Mes règles ont commencé"}</Text></TouchableOpacity>
            <TouchableOpacity style={s.cta2} onPress={() => setDayMenu(new Date())} activeOpacity={0.85}><Text style={s.cta2T}>Autre jour</Text></TouchableOpacity>
          </View>
        </View>
      </FadeUp>

      <FadeUp delay={160}>
        <View style={s.card}>
          <View style={s.rowB}><Text style={s.cardLab}>Prochaines règles estimées</Text>{daysTo !== null ? <View style={s.pill}><Text style={s.pillT}>{daysTo <= 0 ? "bientôt" : `dans ${daysTo} j`}</Text></View> : null}</View>
          <Text style={s.big}>{next ? `${next.getDate()} ${MONTHS[next.getMonth()].toLowerCase()} ${next.getFullYear()}` : "—"}</Text>
          <Text style={s.small}>Calculé à partir de tes propres données (cycle de {cycleLen} jours). Indication approximative : ne remplace pas un avis médical et ne doit jamais servir de méthode de contraception.</Text>
        </View>
      </FadeUp>

      {inFertile && fS && fE ? (
        <FadeUp delay={220}>
          <LinearGradient colors={["#FFD9E0", "#FFC2CE"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.warn}>
            <Text style={s.warnT}>⚠️  Fais attention cette semaine 💗</Text>
            <Text style={s.warnP}>Tu es dans tes jours les plus féconds, du <Text style={{ fontFamily: "Inter_700Bold" }}>{long(fS)}</Text> au <Text style={{ fontFamily: "Inter_700Bold" }}>{long(fE)}</Text>. C'est la période où une grossesse arrive le plus facilement : si tu n'en veux pas, évite tout rapport non protégé ces jours-ci.</Text>
            <Text style={s.small}>Estimation basée sur ton cycle — ce n'est pas une méthode fiable de contraception.</Text>
          </LinearGradient>
        </FadeUp>) : null}

      <View style={s.card}>
        <Text style={s.cardLab}>Mes réglages</Text>
        {([["Durée de mon cycle", len, changeLen, "jours"], ["Durée de mes règles", plen, changePlen, "jours"]] as const).map(([lab, val, fn, u]) => (
          <View key={lab} style={[s.rowB, { marginTop: 12 }]}>
            <Text style={s.setL}>{lab}</Text>
            <View style={s.step}><TouchableOpacity style={s.stepB} onPress={() => fn(val - 1)}><Text style={s.stepT}>−</Text></TouchableOpacity><Text style={s.stepV}>{val} {u}</Text><TouchableOpacity style={s.stepB} onPress={() => fn(val + 1)}><Text style={s.stepT}>+</Text></TouchableOpacity></View>
          </View>))}
        {est.averageCycleLength && periods.length > 1 ? <Text style={s.small}>D'après tes dates, ton cycle dure en moyenne {est.averageCycleLength} jours : la prochaine date utilise ce chiffre.</Text> : null}
      </View>

      <View style={s.card}>
        <Text style={s.cardLab}>Mes dernières règles</Text>
        {periods.slice(0, 6).map((p) => { const st = parse(p.startDate); const nb = p.endDate ? Math.round((parse(p.endDate).getTime() - st.getTime()) / DAY) + 1 : null; return (
          <View key={p.id} style={[s.rowB, { marginTop: 10 }]}>
            <Text style={s.setL}>{long(st)}{p.endDate ? ` → ${long(parse(p.endDate))}` : " → en cours"}{nb ? ` · ${nb} j` : ""}</Text>
            <TouchableOpacity hitSlop={10} onPress={() => Alert.alert("Retirer ces règles ?", "Elles seront effacées de ton calendrier.", [{ text: "Garder", style: "cancel" }, { text: "Retirer", style: "destructive", onPress: () => refresh2(removePeriod(p.id)) }])}><Text style={{ color: "#C23B3B", fontSize: 16 }}>✕</Text></TouchableOpacity>
          </View>); })}
      </View>

      <Modal visible={!!dayMenu} transparent animationType="fade" onRequestClose={() => setDayMenu(null)}>
        <TouchableOpacity style={s.back2} activeOpacity={1} onPress={() => setDayMenu(null)}>
          <View style={s.sheet}>
            <Text style={s.sheetT}>{dayMenu ? `${dayMenu.getDate()} ${MONTHS[dayMenu.getMonth()].toLowerCase()} ${dayMenu.getFullYear()}` : ""}</Text>
            <TouchableOpacity style={s.opt} onPress={() => dayMenu && refresh2(savePeriod(key(dayMenu)))}><Text style={s.optT}>🩸 Mes règles ont commencé ce jour</Text></TouchableOpacity>
            <TouchableOpacity style={s.opt} onPress={() => dayMenu && refresh2(endPeriodOn(key(dayMenu)))}><Text style={s.optT}>🏁 Mes règles se sont terminées ce jour</Text></TouchableOpacity>
            <TouchableOpacity onPress={() => setDayMenu(null)}><Text style={s.back}>Fermer</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
        <TouchableOpacity style={s.act} onPress={() => navigation.navigate("Symptoms")}><Text style={s.actT}>🤒 Ajouter un symptôme</Text></TouchableOpacity>
        <TouchableOpacity style={s.act} onPress={() => navigation.navigate("Reminders")}><Text style={s.actT}>⏰ Ajouter un rappel</Text></TouchableOpacity>
      </View>
      <Text style={s.small2}>Touche un jour du calendrier pour noter le début ou la fin de tes règles.</Text>
    </Shell>
  );
}

function Shell({ children, navigation, scroll }: { children: React.ReactNode; navigation: any; scroll?: boolean }) {
  return (
    <View style={s.c}>
      <View style={[s.blob, { top: -70, right: -60, width: 220, height: 220, borderRadius: 110, backgroundColor: "#FFD6DD", opacity: 0.7 }]} />
      <View style={[s.blob, { top: 300, left: -90, width: 170, height: 170, borderRadius: 85, backgroundColor: "#FFE9A8", opacity: 0.5 }]} />
      <View style={[s.blob, { bottom: 80, right: -70, width: 150, height: 150, borderRadius: 75, backgroundColor: "#E7D5FF", opacity: 0.5 }]} />
      <SosChip navigation={navigation} />
      {scroll ? <ScrollView contentContainerStyle={{ padding: 20, paddingTop: 24, paddingBottom: 20 }} showsVerticalScrollIndicator={false}>{children}</ScrollView> : <View style={{ flex: 1, padding: 20 }}>{children}</View>}
    </View>
  );
}

const s = StyleSheet.create({
  cta: { backgroundColor: "#FF5470", borderRadius: 999, paddingVertical: 13, alignItems: "center" }, ctaT: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },
  cta2: { borderWidth: 1.5, borderColor: "#F3C9CF", borderRadius: 999, paddingVertical: 13, paddingHorizontal: 16, alignItems: "center" }, cta2T: { color: "#FF5470", fontFamily: "Inter_700Bold", fontSize: 13 },
  setL: { color: "#3B1D33", fontFamily: "Inter_500Medium", fontSize: 13, flexShrink: 1 },
  step: { flexDirection: "row", alignItems: "center", gap: 8 }, stepB: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#FFE9EE", alignItems: "center", justifyContent: "center" }, stepT: { color: "#FF5470", fontSize: 20, lineHeight: 22, fontFamily: "Inter_700Bold" }, stepV: { minWidth: 70, textAlign: "center", fontFamily: "Inter_700Bold", color: "#3B1D33", fontSize: 13 },
  back2: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }, sheet: { backgroundColor: "#FFF6F0", borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 22 }, sheetT: { fontFamily: "Poppins_700Bold", fontSize: 17, color: "#3B1D33", textAlign: "center", marginBottom: 14 },
  opt: { backgroundColor: "#fff", borderRadius: 999, paddingVertical: 15, alignItems: "center", marginBottom: 10 }, optT: { fontFamily: "Inter_700Bold", color: "#3B1D33", fontSize: 14 },
  c: { flex: 1, backgroundColor: "#FFF6F0", overflow: "hidden" }, blob: { position: "absolute" },
  h1: { fontFamily: "Poppins_800ExtraBold", fontSize: 22, color: "#3B1D33" }, h1c: { fontFamily: "Poppins_800ExtraBold", fontSize: 21, color: "#3B1D33", textAlign: "center", marginTop: 14 },
  p: { color: "#8C7A86", lineHeight: 21, marginTop: 6, fontFamily: "Inter_400Regular" }, pc: { color: "#3B1D33", lineHeight: 22, textAlign: "center", marginTop: 12, fontFamily: "Inter_400Regular" },
  priv: { color: "#6E5C68", fontSize: 12, textAlign: "center", marginTop: 14, lineHeight: 17 },
  lab: { fontFamily: "Inter_600SemiBold", color: "#3B1D33", fontSize: 13, marginTop: 18, marginBottom: 6 },
  in: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#F3DEE1", borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  small: { fontSize: 11.5, color: "#8C7A86", lineHeight: 16, marginTop: 8, fontFamily: "Inter_400Regular" }, small2: { fontSize: 12, color: "#8C7A86", textAlign: "center", lineHeight: 17, marginTop: 10 },
  back: { textAlign: "center", color: "#8C7A86", marginTop: 10, fontFamily: "Inter_500Medium" },
  cal: { backgroundColor: "#fff", borderRadius: 24, padding: 14, marginTop: 12, shadowColor: "#3B1D33", shadowOpacity: 0.07, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  calHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }, month: { fontFamily: "Inter_700Bold", color: "#3B1D33", fontSize: 14 }, arrow: { fontSize: 24, color: "#FF5470", paddingHorizontal: 8 },
  wk: { flexDirection: "row", justifyContent: "space-between" }, wkT: { width: "14.28%", textAlign: "center", color: "#8C7A86", fontSize: 11, marginVertical: 4, fontFamily: "Inter_500Medium" },
  cell: { width: "13%", height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginVertical: 2 }, num: { fontSize: 12 },
  today: { borderWidth: 2, borderColor: "#3B1D33" }, pred: { borderWidth: 1.5, borderColor: "#FF5470", borderStyle: "dashed" },
  legend: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 10 }, lg: { fontSize: 10.5, color: "#6E5C68" },
  card: { backgroundColor: "#fff", borderRadius: 22, padding: 16, marginTop: 12, shadowColor: "#3B1D33", shadowOpacity: 0.07, shadowRadius: 10, elevation: 2 },
  rowB: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, cardLab: { color: "#8C7A86", fontSize: 12.5, fontFamily: "Inter_500Medium" },
  pill: { backgroundColor: "#FF5470", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 }, pillT: { color: "#fff", fontSize: 11, fontFamily: "Inter_700Bold" },
  big: { fontFamily: "Poppins_800ExtraBold", fontSize: 20, color: "#3B1D33", marginTop: 6 },
  warn: { borderRadius: 22, padding: 16, marginTop: 12 }, warnT: { fontFamily: "Inter_700Bold", color: "#3B1D33", fontSize: 14, marginBottom: 6 }, warnP: { color: "#3B1D33", fontSize: 12.5, lineHeight: 18 },
  act: { flex: 1, backgroundColor: "#fff", borderRadius: 999, paddingVertical: 12, alignItems: "center", borderWidth: 1.5, borderColor: "#F3C9CF" }, actT: { color: "#FF5470", fontFamily: "Inter_700Bold", fontSize: 12 },
});
