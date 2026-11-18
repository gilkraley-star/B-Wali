import { startRetentionJob } from "./utils/retention";
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import authRoutes from "./routes/auth";
import cycleRoutes from "./routes/cycle";
import contentRoutes from "./routes/content";
import forumRoutes from "./routes/forum";
import adminRoutes from "./routes/admin";
import proRoutes from "./routes/pro";
import catalogRoutes from "./routes/catalog";
import storiesRoutes from "./routes/stories";
import http from "http";
import { attachRealtime } from "./utils/realtime";
import assistantRoutes from "./routes/assistant";
import liveRoutes from "./routes/live";
import messagesRoutes from "./routes/messages";
import gamesRoutes from "./routes/games";
import path from "path";
import { UPLOAD_DIR } from "./utils/uploads";

const app = express();
app.set("trust proxy", 1); // derrière Caddy : bonne adresse IP pour la limitation de débit

// CSP assouplie uniquement pour l'interface d'admin (page statique avec script intégré).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "blob:"], // blob: = aperçu d'une image choisie dans l'admin
        connectSrc: ["'self'"],
      },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(cors());
app.use(express.json({ limit: "6mb" })); // photos de profil envoyées en base64

// Limite de requêtes globale — protection de base contre les abus.
// Les données de santé étant sensibles, on reste prudent même en MVP.
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  })
);

app.get("/api/health", (_req, res) => res.json({ status: "ok", app: "Wali API" }));

app.use("/api/auth", authRoutes);
app.use("/api/cycle", cycleRoutes);
app.use("/api/content", contentRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/pro", proRoutes);
app.use("/api/catalog", catalogRoutes);
app.use("/api/stories", storiesRoutes);
app.use("/api/games", gamesRoutes);
app.use("/api/live", liveRoutes);
app.use("/api/assistant", assistantRoutes);
app.use("/api/messages", messagesRoutes);

// Photos des comptes professionnels et interface d'administration web (/admin)
app.use("/uploads", express.static(UPLOAD_DIR, { maxAge: "7d" }));
app.use("/admin", express.static(path.join(__dirname, "..", "public", "admin")));

// Page de téléchargement à partager (lien + code QR de l'appli). DOWNLOAD_URL = fichier APK ou page Play Store.
app.get("/telecharger", (_req, res) => {
  const url = process.env.DOWNLOAD_URL;
  if (url && /^https:\/\//.test(url)) return res.redirect(302, url);
  res
    .status(200)
    .type("html")
    .send('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Wali</title><body style="font-family:sans-serif;text-align:center;padding:48px 24px;background:#FFF6F0;color:#3B1D33"><h1>Wali 💗</h1><p>L\'application arrive bientôt.</p></body>');
});

// Gestionnaire d'erreurs générique — ne jamais renvoyer de détails internes au client.
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Une erreur interne est survenue." });
});

const PORT = process.env.PORT || 4000;
const server = http.createServer(app);
attachRealtime(server);
server.listen(PORT, () => {
  console.log(`Wali API démarrée sur le port ${PORT}`);
  startRetentionJob();
});
