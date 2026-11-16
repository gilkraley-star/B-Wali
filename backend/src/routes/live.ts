import { Router } from "express";
import { AccessToken } from "livekit-server-sdk";
import { prisma } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { suspensionError } from "../utils/moderation";

// Direct (live) dans l'appli. La vidéo passe par LiveKit (serveur libre installé sur le VPS) ;
// ce fichier ne fait que : donner les « billets d'entrée » (jetons), suivre la présence et clôturer.
const router = Router();

const LIVEKIT_URL = process.env.LIVEKIT_URL || "";
const KEY = process.env.LIVEKIT_API_KEY || "";
const SECRET = process.env.LIVEKIT_API_SECRET || "";
const TEACHER_ROLES = ["FORMATRICE", "PROFESSIONNELLE", "COACH", "ADMIN"];
const PRESENCE_RATIO = 0.8; // 80 % du direct suivi = « a suivi jusqu'au bout »
const BEAT_MAX_SEC = 45;    // un signal de présence compte au plus 45 s

async function token(room: string, identity: string, name: string, canPublish: boolean, canChat: boolean) {
  const t = new AccessToken(KEY, SECRET, { identity, name, ttl: "4h" });
  t.addGrant({ roomJoin: true, room, canPublish, canPublishData: canChat, canSubscribe: true });
  return t.toJwt();
}
const configured = () => !!(LIVEKIT_URL && KEY && SECRET);

// Directs en cours (pour afficher « 🔴 En direct » dans l'appli)
router.get("/now", requireAuth, async (_req, res) => {
  const list = await prisma.course.findMany({
    where: { liveState: "EN_COURS", status: "PUBLIE" },
    select: { slug: true, title: true, icon: true, liveStartedAt: true },
  });
  res.json(list);
});

// La formatrice démarre le direct
router.post("/:slug/start", requireAuth, async (req: AuthRequest, res) => {
  if (!TEACHER_ROLES.includes(req.userRole || "")) return res.status(403).json({ error: "Réservé aux formatrices." });
  if (!configured()) return res.status(503).json({ error: "Le direct n'est pas encore installé sur le serveur." });
  const course = await prisma.course.findUnique({ where: { slug: req.params.slug } });
  if (!course) return res.status(404).json({ error: "Formation introuvable." });
  const me = await prisma.user.findUnique({ where: { id: req.userId! } });
  await prisma.course.update({ where: { id: course.id }, data: { liveState: "EN_COURS", liveStartedAt: new Date(), liveEndedAt: null, state: "OUVERT" } });
  await prisma.enrollment.updateMany({ where: { courseId: course.id }, data: { watchedSec: 0, lastBeatAt: null, attendedToEnd: false } });
  res.json({ url: LIVEKIT_URL, token: await token(course.slug, req.userId!, me?.fullName || me?.pseudonyme || "Formatrice", true, true), title: course.title });
});

// Une fille rejoint (inscrite à la formation)
router.post("/:slug/join", requireAuth, async (req: AuthRequest, res) => {
  if (!configured()) return res.status(503).json({ error: "Le direct n'est pas encore installé sur le serveur." });
  const course = await prisma.course.findUnique({ where: { slug: req.params.slug } });
  if (!course || course.liveState !== "EN_COURS") return res.status(409).json({ error: "Le direct n'a pas commencé." });
  const enr = await prisma.enrollment.findFirst({ where: { courseId: course.id, userId: req.userId! } });
  if (!enr && !TEACHER_ROLES.includes(req.userRole || "")) return res.status(403).json({ error: "Inscris-toi d'abord à la formation." });
  const me = await prisma.user.findUnique({ where: { id: req.userId! } });
  const blocked = await suspensionError(req.userId!); // suspendue : elle regarde, mais n'écrit pas
  res.json({ url: LIVEKIT_URL, token: await token(course.slug, req.userId!, me?.pseudonyme || "fille", false, !blocked), canChat: !blocked, title: course.title });
});

// Signal de présence (toutes les 30 s pendant que la fille regarde)
router.post("/:slug/beat", requireAuth, async (req: AuthRequest, res) => {
  const course = await prisma.course.findUnique({ where: { slug: req.params.slug } });
  if (!course || course.liveState !== "EN_COURS") return res.json({ live: false });
  const enr = await prisma.enrollment.findFirst({ where: { courseId: course.id, userId: req.userId! } });
  if (enr) {
    const now = new Date();
    const gap = enr.lastBeatAt ? Math.round((now.getTime() - enr.lastBeatAt.getTime()) / 1000) : 30;
    await prisma.enrollment.update({ where: { id: enr.id }, data: { watchedSec: { increment: Math.max(0, Math.min(gap, BEAT_MAX_SEC)) }, lastBeatAt: now } });
  }
  res.json({ live: true });
});

// La formatrice termine : la présence est calculée automatiquement
router.post("/:slug/end", requireAuth, async (req: AuthRequest, res) => {
  if (!TEACHER_ROLES.includes(req.userRole || "")) return res.status(403).json({ error: "Réservé aux formatrices." });
  const course = await prisma.course.findUnique({ where: { slug: req.params.slug } });
  if (!course || !course.liveStartedAt) return res.status(404).json({ error: "Aucun direct en cours." });
  const total = Math.round((Date.now() - course.liveStartedAt.getTime()) / 1000);
  const need = Math.floor(total * PRESENCE_RATIO);
  await prisma.course.update({ where: { id: course.id }, data: { liveState: "TERMINE", liveEndedAt: new Date(), state: "TERMINEE" } });
  const done = await prisma.enrollment.updateMany({ where: { courseId: course.id, watchedSec: { gte: need } }, data: { attendedToEnd: true } });
  res.json({ durationSec: total, presentes: done.count });
});

export default router;
