import { broadcast } from "../utils/realtime";
import { suspensionError, applyThreshold } from "../utils/moderation";
import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import express from "express";
import { requireAuth, requireModerator, AuthRequest } from "../middleware/auth";
import { saveMedia, isForumMediaUrl, deleteMedia, MAX_VIDEO_BYTES } from "../utils/media";
import { MAX_MESSAGES, RETENTION_HOURS } from "../utils/retention";
import { ar } from "../utils/asyncRoute";

const router = Router();

// GET /api/forum/categories
router.get("/categories", requireAuth, ar(async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  const categories = await prisma.forumCategory.findMany({ orderBy: [{ sort: "asc" }] });
  const last = await prisma.forumPost.groupBy({ by: ["categoryId"], where: { isHidden: false }, _max: { lastActivityAt: true }, _count: { _all: true } });
  const info = new Map<string, { at: number; n: number }>(last.map((g: any) => [g.categoryId, { at: g._max.lastActivityAt ? g._max.lastActivityAt.getTime() : 0, n: g._count._all }] as [string, { at: number; n: number }]));
  // Espaces distincts selon l'âge (section 5.2) : une catégorie restreinte à une tranche
  // d'âge n'est visible que pour cette tranche.
  const visible = categories.filter(
    (c: (typeof categories)[number]) => !c.restrictedTo || c.restrictedTo === user?.ageBracket
  );
  // Le thème (ou sous-thème) où l'on vient d'écrire remonte en premier.
  const withInfo = visible.map((c: any) => ({ ...c, lastPostAt: info.get(c.id)?.at || 0, postCount: info.get(c.id)?.n || 0 }));
  const childMax = (id: string) => Math.max(0, ...withInfo.filter((x: any) => x.parentId === id).map((x: any) => x.lastPostAt));
  const childN = (id: string) => withInfo.filter((x: any) => x.parentId === id).reduce((n: number, x: any) => n + x.postCount, 0);
  const out = withInfo.map((c: any) => ({ ...c, lastPostAt: c.parentId ? c.lastPostAt : Math.max(c.lastPostAt, childMax(c.id)), postCount: c.parentId ? c.postCount : c.postCount + childN(c.id) }));
  out.sort((a: any, b: any) => b.lastPostAt - a.lastPostAt || a.sort - b.sort);
  res.json(out);
}));

const postSchema = z.object({
  categoryId: z.string(),
  title: z.string().min(3).max(140),
  body: z.string().min(1).max(5000),
});

function maskAuthor<T extends { anonymous?: boolean; author?: any }>(x: T): T {
  return x.anonymous && x.author ? { ...x, author: { ...x.author, pseudonyme: "Anonyme" } } : x;
}

// POST /api/forum/posts — publication soumise à modération avant affichage public
router.post("/posts", requireAuth, ar(async (req: AuthRequest, res) => {
  const susp = await suspensionError(req.userId!);
  if (susp) return res.status(403).json({ error: susp });
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user?.participatesForum) {
    return res.status(403).json({
      error: "Le forum est désactivé pour ce compte. Activez-le dans les paramètres de confidentialité.",
    });
  }
  const parsed = postSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const category = await prisma.forumCategory.findUnique({ where: { id: parsed.data.categoryId } });
  if (!category) return res.status(404).json({ error: "Catégorie introuvable." });
  if (category.restrictedTo && category.restrictedTo !== user.ageBracket) {
    return res.status(403).json({ error: "Cette catégorie n'est pas accessible à votre tranche d'âge." });
  }

  const post = await prisma.forumPost.create({
    data: { ...parsed.data, authorId: req.userId!, anonymous: user.anonymousDefault },
  });
  broadcast({ t: "post", cat: post.categoryId });
  res.status(201).json(post);
}));

// GET /api/forum/categories/:categoryId/posts — seuls les posts modérés et non masqués
router.get("/categories/:categoryId/posts", requireAuth, ar(async (req: AuthRequest, res) => {
  const kids = await prisma.forumCategory.findMany({ where: { parentId: req.params.categoryId }, select: { id: true } });
  const posts = await prisma.forumPost.findMany({
    where: { categoryId: { in: [req.params.categoryId, ...kids.map((k: any) => k.id)] }, isHidden: false },
    include: { author: { select: { pseudonyme: true } }, _count: { select: { comments: true } }, comments: { where: { isHidden: false }, orderBy: { createdAt: "desc" }, take: 1, select: { body: true, mediaType: true } } },
    orderBy: { lastActivityAt: "desc" },
    take: 100,
  });
  res.json(posts.map((p: any) => {
    const last = p.comments[0];
    const { comments, ...rest } = maskAuthor(p);
    return { ...rest, lastText: last ? (last.body || (last.mediaType === "audio" ? "🎤 Message vocal" : last.mediaType === "video" ? "🎬 Vidéo" : "🖼️ Photo")) : p.body };
  }));
}));

// GET /api/forum/posts/:id
router.get("/posts/:id", requireAuth, ar(async (req: AuthRequest, res) => {
  const post = await prisma.forumPost.findUnique({
    where: { id: req.params.id },
    include: {
      author: { select: { pseudonyme: true } },
      comments: {
        where: { isHidden: false },
        include: { author: { select: { pseudonyme: true } }, reactions: { select: { emoji: true, userId: true } }, replyTo: { select: { id: true, body: true, mediaType: true, anonymous: true, author: { select: { pseudonyme: true } } } } },
        orderBy: { createdAt: "desc" },
        take: MAX_MESSAGES,
      },
    },
  });
  if (!post || post.isHidden) {
    return res.status(404).json({ error: "Publication introuvable." });
  }
  // On renvoie les messages du plus ancien au plus récent (les 50 derniers seulement).
  const me = req.userId;
  const comments = post.comments.reverse().map((c: any) => {
    const counts: Record<string, number> = {};
    for (const r of c.reactions) counts[r.emoji] = (counts[r.emoji] || 0) + 1;
    const { reactions, ...rest } = maskAuthor(c);
    const rt = c.replyTo ? { id: c.replyTo.id, body: c.replyTo.body, mediaType: c.replyTo.mediaType, author: { pseudonyme: c.replyTo.anonymous ? "Anonyme" : c.replyTo.author.pseudonyme } } : null;
    return { ...rest, replyTo: rt, mine: c.authorId === me, reactionCounts: counts, myReaction: reactions.find((r: any) => r.userId === me)?.emoji ?? null };
  });
  res.json({ ...maskAuthor(post), mine: post.authorId === me, comments, maxMessages: MAX_MESSAGES, retentionHours: RETENTION_HOURS });
}));

const commentSchema = z
  .object({
    body: z.string().max(2000).default(""),
    mediaUrl: z.string().optional(),
    mediaType: z.enum(["image", "video", "audio"]).optional(),
    durationSec: z.number().int().min(1).max(180).optional(),
    replyToId: z.string().optional(),
  })
  .refine((v) => v.body.trim().length > 0 || !!v.mediaUrl, { message: "Écris un message, ou ajoute une photo, une vidéo ou un vocal." })
  .refine((v) => !v.mediaUrl || (isForumMediaUrl(v.mediaUrl) && !!v.mediaType), { message: "Photo ou vidéo invalide." });

// Envoi d'une photo ou d'une vidéo (corps brut). Renvoie l'adresse à joindre au message.
// Pas plus de 10 envois par heure et par utilisatrice (protège le stockage).
const uploadsByUser = new Map<string, number[]>();
router.post(
  "/media",
  requireAuth,
  express.raw({ type: ["image/*", "video/*", "audio/*"], limit: MAX_VIDEO_BYTES + 1024 }), ar(async (req: AuthRequest, res) => {
    const susp = await suspensionError(req.userId!);
    if (susp) return res.status(403).json({ error: susp });
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user?.participatesForum) return res.status(403).json({ error: "Le forum est désactivé pour ce compte." });
    const now = Date.now();
    const recent = (uploadsByUser.get(req.userId!) || []).filter((t) => now - t < 3600_000);
    if (recent.length >= 40) return res.status(429).json({ error: "Trop d'envois. Réessaie dans un moment." });
    if (!Buffer.isBuffer(req.body) || !req.body.length) return res.status(400).json({ error: "Aucun fichier reçu." });
    try {
      const saved = saveMedia(req.body, String(req.headers["content-type"] || "").startsWith("audio/"));
      uploadsByUser.set(req.userId!, [...recent, now]);
      res.status(201).json(saved);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  }
));

// POST /api/forum/posts/:id/comments
router.post("/posts/:id/comments", requireAuth, ar(async (req: AuthRequest, res) => {
  const susp = await suspensionError(req.userId!);
  if (susp) return res.status(403).json({ error: susp });
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user?.participatesForum) {
    return res.status(403).json({ error: "Le forum est désactivé pour ce compte." });
  }
  const parsed = commentSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const post = await prisma.forumPost.findUnique({ where: { id: req.params.id } });
  if (!post) return res.status(404).json({ error: "Publication introuvable." });

  const comment = await prisma.forumComment.create({
    data: {
      postId: post.id,
      authorId: req.userId!,
      body: parsed.data.body,
      mediaUrl: parsed.data.mediaUrl ?? null,
      mediaType: parsed.data.mediaType ?? null,
      durationSec: parsed.data.durationSec ?? null,
      replyToId: parsed.data.replyToId ?? null,
      anonymous: user.anonymousDefault,
    },
  });
  await prisma.forumPost.update({ where: { id: post.id }, data: { lastActivityAt: new Date() } });
  broadcast({ t: "comment", post: post.id });
  res.status(201).json(comment);
}));

// --- Réactions emoji sur les messages ---
const EMOJIS = ["❤️", "👍", "😂", "😮", "😢", "🙏", "👏", "💪"];
router.put("/comments/:id/reaction", requireAuth, ar(async (req: AuthRequest, res) => {
  const susp = await suspensionError(req.userId!);
  if (susp) return res.status(403).json({ error: susp });
  const emoji = typeof req.body?.emoji === "string" ? req.body.emoji : "";
  if (!EMOJIS.includes(emoji)) return res.status(400).json({ error: "Emoji non autorisé." });
  const c = await prisma.forumComment.findFirst({ where: { id: req.params.id, isHidden: false } });
  if (!c) return res.status(404).json({ error: "Message introuvable." });
  const existing = await prisma.forumReaction.findUnique({ where: { commentId_userId: { commentId: c.id, userId: req.userId! } } });
  if (existing && existing.emoji === emoji) {
    await prisma.forumReaction.delete({ where: { id: existing.id } }); // même emoji : on retire
  } else {
    await prisma.forumReaction.upsert({
      where: { commentId_userId: { commentId: c.id, userId: req.userId! } },
      create: { commentId: c.id, userId: req.userId!, emoji },
      update: { emoji },
    });
  }
  broadcast({ t: "comment", post: c.postId });
  res.json({ ok: true });
}));

// Motifs proposés à la personne qui signale (l'appli les affiche tels quels)
const REASONS = [
  { code: "HAINE", label: "Message haineux ou insultant" },
  { code: "RACISME", label: "Racisme, mépris d'un groupe ou d'une origine" },
  { code: "HARCELEMENT", label: "Harcèlement ou moquerie" },
  { code: "VIOLENCE", label: "Menaces ou violence" },
  { code: "SEXUEL", label: "Contenu sexuel ou choquant" },
  { code: "PROFIL_SUSPECT", label: "Profil suspect (faux profil, adulte qui s'approche des filles)" },
  { code: "ARNAQUE", label: "Arnaque ou demande d'argent" },
  { code: "SPAM", label: "Publicité ou spam" },
  { code: "AUTRE", label: "Autre raison" },
] as const;
const REASON_CODES = REASONS.map((r) => r.code) as [string, ...string[]];
router.get("/report-reasons", requireAuth, (_req, res) => res.json(REASONS));

// --- Signalement (section 5.2 : "Signalement des contenus inappropriés") ---

const reportSchema = z.object({
  postId: z.string().optional(),
  commentId: z.string().optional(),
  reason: z.enum(REASON_CODES),
});

// POST /api/forum/reports
router.post("/reports", requireAuth, ar(async (req: AuthRequest, res) => {
  const parsed = reportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  if (!parsed.data.postId && !parsed.data.commentId) {
    return res.status(400).json({ error: "Précisez la publication ou le commentaire signalé." });
  }
  // Retrouver l'auteure du message signalé
  let authorId: string | null = null;
  if (parsed.data.commentId) {
    const c = await prisma.forumComment.findUnique({ where: { id: parsed.data.commentId } });
    if (!c) return res.status(404).json({ error: "Message introuvable." });
    authorId = c.authorId;
  } else {
    const p = await prisma.forumPost.findUnique({ where: { id: parsed.data.postId } });
    if (!p) return res.status(404).json({ error: "Publication introuvable." });
    authorId = p.authorId;
  }
  if (authorId === req.userId) return res.status(400).json({ error: "Tu ne peux pas signaler ton propre message." });
  // Un seul signalement par personne et par message : on ne peut pas « gonfler » le compteur seule.
  const already = await prisma.report.findFirst({
    where: { reporterId: req.userId!, ...(parsed.data.commentId ? { commentId: parsed.data.commentId } : { postId: parsed.data.postId }) },
  });
  if (already) return res.status(200).json({ ok: true, alreadyReported: true });
  await prisma.report.create({ data: { reporterId: req.userId!, reportedUserId: authorId, ...parsed.data } });
  const result = await applyThreshold(parsed.data);
  // On ne dit jamais à la personne qui signale ce qui est arrivé à l'autre.
  res.status(201).json({ ok: true, thanks: "Merci. L'équipe va regarder ce message." });
  void result;
}));

// --- Modération (réservé rôle MODERATRICE/ADMIN) ---

// GET /api/forum/moderation/queue — publications en attente de validation
router.get("/moderation/queue", requireAuth, requireModerator, ar(async (_req, res) => {
  const pending = await prisma.forumPost.findMany({
    where: { isHidden: false, reports: { some: { status: "OUVERT" } } },
    include: { author: { select: { pseudonyme: true, ageBracket: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json(pending);
}));

// GET /api/forum/moderation/reports — signalements ouverts
router.get("/moderation/reports", requireAuth, requireModerator, ar(async (_req, res) => {
  const reports = await prisma.report.findMany({
    where: { status: "OUVERT" },
    include: { post: true, comment: true, reporter: { select: { pseudonyme: true } } },
    orderBy: { createdAt: "asc" },
  });
  res.json(reports);
}));

// PATCH /api/forum/moderation/posts/:id — approuver ou masquer une publication
const moderatePostSchema = z.object({
  isModerated: z.boolean().optional(),
  isHidden: z.boolean().optional(),
});
router.patch("/moderation/posts/:id", requireAuth, requireModerator, ar(async (req, res) => {
  const parsed = moderatePostSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const updated = await prisma.forumPost.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(updated);
}));

// PATCH /api/forum/moderation/reports/:id — traiter un signalement
const resolveReportSchema = z.object({ status: z.enum(["EN_COURS", "TRAITE", "REJETE"]) });
// PATCH /api/forum/moderation/comments/:id — masquer un message (sa photo ou vidéo est supprimée du serveur)
router.patch("/moderation/comments/:id", requireAuth, requireModerator, ar(async (req, res) => {
  const comment = await prisma.forumComment.findUnique({ where: { id: req.params.id } });
  if (!comment) return res.status(404).json({ error: "Message introuvable." });
  if (z.object({ isHidden: z.literal(true) }).safeParse(req.body).success) {
    deleteMedia(comment.mediaUrl);
    const updated = await prisma.forumComment.update({
      where: { id: comment.id },
      data: { isHidden: true, mediaUrl: null, mediaType: null },
    });
    return res.json(updated);
  }
  return res.status(400).json({ error: "Seul le masquage est possible." });
}));

router.patch("/moderation/reports/:id", requireAuth, requireModerator, ar(async (req, res) => {
  const parsed = resolveReportSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const updated = await prisma.report.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status, resolvedAt: new Date() },
  });
  res.json(updated);
}));

export default router;
