import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { apiOrigin, getToken } from "../api/client";

// Connexion temps réel au serveur : un signal arrive dès qu'un message est publié.
export type RtEvent = { t: "post"; cat: string } | { t: "comment"; post: string } | { t: "dm"; conv: string };
type Handler = (e: RtEvent) => void;

const handlers = new Set<Handler>();
let ws: WebSocket | null = null;
let retry = 0;
let timer: any = null;
let wanted = 0;

async function open() {
  if (ws && (ws.readyState === 0 || ws.readyState === 1)) return;
  const token = await getToken();
  if (!token || !wanted) return;
  const url = apiOrigin.replace(/^http/, "ws") + "/ws?token=" + encodeURIComponent(token);
  try {
    const s = new WebSocket(url);
    ws = s;
    s.onopen = () => { retry = 0; };
    s.onmessage = (m) => { try { const e = JSON.parse(String(m.data)); handlers.forEach((h) => h(e)); } catch { /* ignore */ } };
    s.onclose = () => { if (ws === s) ws = null; schedule(); };
    s.onerror = () => { try { s.close(); } catch { /* ignore */ } };
  } catch { schedule(); }
}
function schedule() {
  if (!wanted || timer) return;
  retry = Math.min(retry + 1, 6);
  timer = setTimeout(() => { timer = null; open(); }, 1000 * 2 ** retry / 2);
}
AppState.addEventListener("change", (s) => { if (s === "active") { retry = 0; open(); } });

/** À appeler dans un écran : `useRealtime((e) => { if (e.t === "comment" && e.post === id) load(); })` */
export function useRealtime(handler: Handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const h: Handler = (e) => ref.current(e);
    handlers.add(h); wanted++; open();
    return () => { handlers.delete(h); wanted--; if (!wanted && ws) { try { ws.close(); } catch { /* ignore */ } ws = null; } };
  }, []);
}
