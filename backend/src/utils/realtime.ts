import http from "http";
import { WebSocketServer, WebSocket } from "ws";
import { verifyToken } from "./jwt";
import { prisma } from "../db";

// Temps réel : une connexion WebSocket par téléphone. Le serveur envoie de petits signaux
// (« nouveau message dans tel fil ») et le téléphone recharge aussitôt ce fil.
const clients = new Set<WebSocket>();

export function attachRealtime(server: http.Server) {
  const wss = new WebSocketServer({ noServer: true, maxPayload: 1024 });
  server.on("upgrade", async (req, socket, head) => {
    try {
      const url = new URL(req.url || "", "http://x");
      if (url.pathname !== "/ws") return socket.destroy();
      const payload = verifyToken(url.searchParams.get("token") || "");
      const u = await prisma.user.findUnique({ where: { id: payload.userId }, select: { active: true } });
      if (!u?.active) return socket.destroy();
      wss.handleUpgrade(req, socket, head, (ws) => {
        clients.add(ws);
        (ws as any).alive = true;
        ws.on("pong", () => ((ws as any).alive = true));
        ws.on("close", () => clients.delete(ws));
        ws.on("error", () => clients.delete(ws));
      });
    } catch { socket.destroy(); }
  });
  // Nettoie les connexions mortes (téléphone éteint, réseau coupé)
  setInterval(() => {
    for (const ws of clients) {
      if (!(ws as any).alive) { ws.terminate(); clients.delete(ws); continue; }
      (ws as any).alive = false;
      ws.ping();
    }
  }, 30000);
}

export function broadcast(event: Record<string, string>) {
  const msg = JSON.stringify(event);
  for (const ws of clients) if (ws.readyState === WebSocket.OPEN) ws.send(msg);
}
