import React, { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { Lock, checkLock, getLock } from "../lock";
import LockScreen from "./LockScreen";

// Verrouille l'appli au démarrage et quand on revient dessus après plus de 20 s.
export default function AppLock() {
  const [lock, setLock] = useState<Lock>(null);
  const [locked, setLocked] = useState(false);
  const [err, setErr] = useState("");
  const left = useRef(0);
  useEffect(() => {
    getLock().then((l) => { setLock(l); setLocked(!!l); });
    const sub = AppState.addEventListener("change", async (st) => {
      if (st.match(/inactive|background/)) left.current = Date.now();
      else if (st === "active") { const l = await getLock(); setLock(l); if (l && left.current && Date.now() - left.current > 20000) setLocked(true); }
    });
    return () => sub.remove();
  }, []);
  if (!lock || !locked) return null;
  return <LockScreen type={lock.type} error={err} onSubmit={async (c) => { if (await checkLock(lock, c)) { setErr(""); setLocked(false); } else setErr(lock.type === "pin" ? "Code incorrect." : "Schéma incorrect."); }} />;
}
