import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthRequest, PRO_ROLES } from "../middleware/auth";
import { ar } from "../utils/asyncRoute";
import { broadcast } from "../utils/realtime";
import { suspensionError } from "../utils/moderation";

const router = Router();

// Messagerie privée entre une fille et une professionnelle vérifiée.
// Personne d'autre (pas même l'admin) n'a de route pour lire le contenu des messages.

function conversationView(c: any, viewerIsPro: boolean) {
  const last = c.messages?.[0];
  return {
    id: c.id,
    anonymous: c.anonymous,
    blocked: c.blocked,
    lastMessageAt: c.lastMessageAt,
    unread: viewerIsPro
      ? (!c.proReadAt || c.lastMessageAt > c.proReadAt) && last && last.senderId !== c.proId
      : (!c.userReadAt || c.lastMessageAt > c.userReadAt) && last && last.senderId !== c.userId,
    lastText: last?.body || "",
    with: viewerIsPro
      ? { displayName: c.anonymous ? "Utilisatrice anonyme" : c.user.pseudonyme }
      : { id: c.pro.id, fullName: c.pro.fullName, profession: c.pro.profession, photoUrl: c.pro.photoUrl, certified: c.pro.certified },
  };
}

// POST /api/messages/start — la fille ouvre (ou retrouve) sa conversation avec une pro
router.post(
  "/start",
  requireAuth,
  ar(async (req: AuthRequest, res) => {
    const body = z.object({ proId: z.string(), anonymous: z.boolean().optional() }).parse(req.body);
    const sus = await suspensionError(req.userId!);
    if (sus) return res.status(403).json({ error: sus });
    const pro = await prisma.user.findUnique({ where: { id: body.proId } });
    if (!pro || !PRO_ROLES.includes(pro.role) || !pro.active) {
      return res.status(404).json({ error: "Cette professionnelle n'est pas disponible." });
    }
    const existing = await prisma.conversation.findUnique({ where: { userId_proId: { userId: req.userId!, proId: body.proId } } });
    const convo =
      existing ||
      (await prisma.conversation.create({ data: { userId: req.userId!, proId: body.proId, anonymous: !!body.anonymous } }));
    res.json({ id: convo.id });
  })
);

// GET /api/messages/conversations — mes conversations côté fille
router.get(
  "/conversations",
  requireAuth,
  ar(async (req: AuthRequest, res) => {
    const list = await prisma.conversation.findMany({
      where: { userId: req.userId },
      include: { pro: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { lastMessageAt: "desc" },
    });
    res.json(list.map((c: any) => conversationView(c, false)));
  })
);

// GET /api/messages/pro/conversations — mes conversations côté professionnelle
router.get(
  "/pro/conversations",
  requireAuth,
  ar(async (req: AuthRequest, res) => {
    if (!PRO_ROLES.includes(req.userRole || "")) return res.status(403).json({ error: "Réservé aux comptes professionnels." });
    const list = await prisma.conversation.findMany({
      where: { proId: req.userId },
      include: { user: true, messages: { orderBy: { createdAt: "desc" }, take: 1 } },
      orderBy: { lastMessageAt: "desc" },
    });
    res.json(list.map((c: any) => conversationView(c, true)));
  })
);

async function loadMine(convId: string, userId: string) {
  const c = await prisma.conversation.findUnique({ where: { id: convId } });
  if (!c || (c.userId !== userId && c.proId !== userId)) return null;
  return c;
}

// GET /api/messages/conversations/:id — fil de la conversation (marque comme lu)
router.get(
  "/conversations/:id",
  requireAuth,
  ar(async (req: AuthRequest, res) => {
    const c = await loadMine(req.params.id, req.userId!);
    if (!c) return res.status(404).json({ error: "Conversation introuvable." });
    const isPro = c.proId === req.userId;
    const messages = await prisma.directMessage.findMany({ where: { conversationId: c.id }, orderBy: { createdAt: "asc" } });
    await prisma.conversation.update({
      where: { id: c.id },
      data: isPro ? { proReadAt: new Date() } : { userReadAt: new Date() },
    });
    res.json({
      id: c.id,
      anonymous: c.anonymous,
      blocked: c.blocked,
      messages: messages.map((m: any) => ({ id: m.id, body: m.body, mine: m.senderId === req.userId, createdAt: m.createdAt })),
    });
  })
);

// POST /api/messages/conversations/:id — envoyer un message
router.post(
  "/conversations/:id",
  requireAuth,
  ar(async (req: AuthRequest, res) => {
    const body = z.object({ body: z.string().min(1).max(2000) }).parse(req.body);
    const c = await loadMine(req.params.id, req.userId!);
    if (!c) return res.status(404).json({ error: "Conversation introuvable." });
    if (c.blocked) return res.status(403).json({ error: "Cette conversation est bloquée." });
    const sus = await suspensionError(req.userId!);
    if (sus) return res.status(403).json({ error: sus });
    const msg = await prisma.directMessage.create({ data: { conversationId: c.id, senderId: req.userId!, body: body.body } });
    await prisma.conversation.update({ where: { id: c.id }, data: { lastMessageAt: new Date() } });
    broadcast({ t: "dm", conv: c.id });
    res.status(201).json({ id: msg.id, body: msg.body, mine: true, createdAt: msg.createdAt });
  })
);

// POST /api/messages/conversations/:id/block
router.post(
  "/conversations/:id/block",
  requireAuth,
  ar(async (req: AuthRequest, res) => {
    const c = await loadMine(req.params.id, req.userId!);
    if (!c) return res.status(404).json({ error: "Conversation introuvable." });
    await prisma.conversation.update({ where: { id: c.id }, data: { blocked: true, blockedBy: c.proId === req.userId ? "PRO" : "USER" } });
    res.json({ ok: true });
  })
);

// POST /api/messages/conversations/:id/report
router.post(
  "/conversations/:id/report",
  requireAuth,
  ar(async (req: AuthRequest, res) => {
    const body = z.object({ reason: z.string().min(1).max(500) }).parse(req.body);
    const c = await loadMine(req.params.id, req.userId!);
    if (!c) return res.status(404).json({ error: "Conversation introuvable." });
    await prisma.dmReport.create({ data: { conversationId: c.id, reporterId: req.userId!, reason: body.reason } });
    res.status(201).json({ ok: true });
  })
);

export default router;
