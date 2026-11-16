import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";
import { savePhotoFromDataUrl, deletePhoto } from "../utils/uploads";
import { parseSources, sourcesSchema } from "../utils/sources";
import { articleInput, courseInput, incomeInput, slugify } from "../utils/content";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

const PRO_ROLES = ["PROFESSIONNELLE", "COACH", "FORMATRICE", "MODERATRICE"];

async function audit(actorId: string | undefined, action: string, target: string) {
  await prisma.auditLog.create({ data: { actorId: actorId || "?", action, target } });
}

function tempPassword(): string {
  // 12 caractères lisibles, sans ambiguïtés (pas de 0/O, 1/l/I)
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.randomBytes(12);
  for (let i = 0; i < 12; i++) out += alphabet[bytes[i] % alphabet.length];
  return out;
}

function modelFor(type: string): any {
  if (type === "articles") return prisma.article;
  if (type === "courses") return prisma.course;
  if (type === "income") return prisma.incomeActivity;
  return null;
}

function titleOf(type: string, x: any): string {
  return type === "articles" ? x.titleFr : x.title;
}

// ---------------------------------------------------------------------------
// Tableau de bord
// ---------------------------------------------------------------------------
router.get("/stats", async (_req, res) => {
  const [users, pros, pendingA, pendingC, pendingI, publishedA, publishedC, publishedI, reports, enrollments] = await Promise.all([
    prisma.user.count({ where: { role: "UTILISATRICE" } }),
    prisma.user.count({ where: { role: { in: PRO_ROLES } } }),
    prisma.article.count({ where: { status: "A_VALIDER" } }),
    prisma.course.count({ where: { status: "A_VALIDER" } }),
    prisma.incomeActivity.count({ where: { status: "A_VALIDER" } }),
    prisma.article.count({ where: { status: "PUBLIE" } }),
    prisma.course.count({ where: { status: "PUBLIE" } }),
    prisma.incomeActivity.count({ where: { status: "PUBLIE" } }),
    prisma.report.count({ where: { status: "OUVERT" } }),
    prisma.enrollment.count(),
  ]);
  res.json({
    users,
    professionals: pros,
    pending: { articles: pendingA, courses: pendingC, income: pendingI, total: pendingA + pendingC + pendingI },
    published: { articles: publishedA, courses: publishedC, income: publishedI },
    openReports: reports,
    enrollments,
  });
});

// ---------------------------------------------------------------------------
// Comptes professionnels : création par l'admin, avec photo
// ---------------------------------------------------------------------------
router.get("/users", async (req, res) => {
  const role = req.query.role as string | undefined;
  const users = await prisma.user.findMany({
    where: role ? { role } : { role: { not: "UTILISATRICE" } },
    select: {
      id: true, email: true, fullName: true, profession: true, bio: true, photoUrl: true,
      role: true, certified: true, active: true, available: true, createdAt: true, mustChangePassword: true,
    },
    orderBy: { createdAt: "desc" },
  });
  res.json(users);
});

const createUserSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(3).max(120),
  profession: z.string().min(2).max(120), // ex. "Sage-femme", "Psychologue", "Coach", "Formatrice"
  role: z.enum(["PROFESSIONNELLE", "COACH", "FORMATRICE", "MODERATRICE"]),
  bio: z.string().max(600).optional(),
  certified: z.boolean().optional(),
  photo: z.string().min(50, "Une photo est obligatoire pour un compte professionnel."),
});

// POST /api/admin/users — crée le compte, renvoie le mot de passe provisoire UNE SEULE FOIS
router.post("/users", async (req: AuthRequest, res) => {
  const p = createUserSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
  const exists = await prisma.user.findUnique({ where: { email: p.data.email } });
  if (exists) return res.status(409).json({ error: "Un compte existe déjà avec cet e-mail." });

  let photoUrl: string;
  try {
    photoUrl = savePhotoFromDataUrl(p.data.photo);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }

  const pwd = tempPassword();
  const pseudonyme = slugify(p.data.fullName).slice(0, 28);
  const user = await prisma.user.create({
    data: {
      email: p.data.email,
      passwordHash: await bcrypt.hash(pwd, 10),
      pseudonyme,
      ageBracket: "FEMME_ADULTE",
      role: p.data.role,
      fullName: p.data.fullName,
      profession: p.data.profession,
      bio: p.data.bio,
      photoUrl,
      certified: !!p.data.certified,
      mustChangePassword: true,
      participatesForum: true,
    },
  });
  await audit(req.userId, "CREATE_USER", `${user.email} (${user.role})`);
  res.status(201).json({
    id: user.id,
    email: user.email,
    temporaryPassword: pwd,
    note: "Transmets ce mot de passe provisoire en privé. Il ne sera plus affiché. Il devra être changé à la première connexion.",
  });
});

const patchUserSchema = z.object({
  fullName: z.string().min(3).max(120).optional(),
  profession: z.string().min(2).max(120).optional(),
  bio: z.string().max(600).optional(),
  role: z.enum(["PROFESSIONNELLE", "COACH", "FORMATRICE", "MODERATRICE"]).optional(),
  certified: z.boolean().optional(),
  active: z.boolean().optional(),
  photo: z.string().optional(),
});

router.patch("/users/:id", async (req: AuthRequest, res) => {
  const p = patchUserSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target) return res.status(404).json({ error: "Compte introuvable." });
  if (target.role === "ADMIN" || target.role === "UTILISATRICE") {
    return res.status(403).json({ error: "Seuls les comptes professionnels se gèrent ici." });
  }
  const { photo, ...rest } = p.data;
  let photoUrl: string | undefined;
  if (photo) {
    try {
      photoUrl = savePhotoFromDataUrl(photo);
    } catch (e: any) {
      return res.status(400).json({ error: e.message });
    }
  }
  const updated = await prisma.user.update({ where: { id: target.id }, data: { ...rest, ...(photoUrl ? { photoUrl } : {}) } });
  if (photoUrl) deletePhoto(target.photoUrl);
  await audit(req.userId, "UPDATE_USER", `${updated.email} ${JSON.stringify(Object.keys(p.data))}`);
  res.json({ id: updated.id, active: updated.active, certified: updated.certified });
});

router.post("/users/:id/reset-password", async (req: AuthRequest, res) => {
  const target = await prisma.user.findUnique({ where: { id: req.params.id } });
  if (!target || target.role === "ADMIN" || target.role === "UTILISATRICE") return res.status(404).json({ error: "Compte introuvable." });
  const pwd = tempPassword();
  await prisma.user.update({ where: { id: target.id }, data: { passwordHash: await bcrypt.hash(pwd, 10), mustChangePassword: true } });
  await audit(req.userId, "RESET_PASSWORD", target.email ?? target.pseudonyme);
  res.json({ temporaryPassword: pwd });
});

// ---------------------------------------------------------------------------
// File de validation des contenus (articles, formations, activités de revenus)
// ---------------------------------------------------------------------------
router.get("/queue", async (req, res) => {
  const status = (req.query.status as string) || "A_VALIDER";
  const [articles, courses, income] = await Promise.all([
    prisma.article.findMany({ where: { status }, include: { author: true, category: true }, orderBy: { updatedAt: "desc" } }),
    prisma.course.findMany({ where: { status }, include: { author: true }, orderBy: { updatedAt: "desc" } }),
    prisma.incomeActivity.findMany({ where: { status }, include: { author: true }, orderBy: { updatedAt: "desc" } }),
  ]);
  const author = (a: any) => (a ? { fullName: a.fullName, profession: a.profession, photoUrl: a.photoUrl } : null);
  res.json([
    ...articles.map((a) => ({ type: "articles", id: a.id, title: a.titleFr, category: a.category.titleFr, body: a.bodyFr, status: a.status, reviewNote: a.reviewNote, sources: parseSources(a.sourcesJson), author: author(a.author) })),
    ...courses.map((c) => ({ type: "courses", id: c.id, title: c.title, category: "Formation", body: `${c.summary}\n\n${c.outlineMd}`, status: c.status, reviewNote: c.reviewNote, sources: parseSources(c.sourcesJson), author: author(c.author), partner: c.partner })),
    ...income.map((i) => ({ type: "income", id: i.id, title: i.title, category: `Revenu · dès ${i.capitalMinFcfa} FCFA`, body: `${i.summary}\n\nIl te faut :\n${i.needsMd}\n\nComment démarrer :\n${i.stepsMd}\n\nPrécautions :\n${i.risksMd}`, status: i.status, reviewNote: i.reviewNote, sources: parseSources(i.sourcesJson), author: author(i.author) })),
  ]);
});

const reviewSchema = z.object({
  decision: z.enum(["approve", "reject", "unpublish"]),
  note: z.string().max(1000).optional(),
});

async function applyReview(actorId: string | undefined, type: string, id: string, decision: "approve" | "reject" | "unpublish", note?: string) {
  const model = modelFor(type);
  if (!model) throw new Error("Type inconnu.");
  const item = await model.findUnique({ where: { id } });
  if (!item) throw new Error("Contenu introuvable.");
  if (decision === "approve" && parseSources(item.sourcesJson).length === 0) {
    // Règle de sécurité : aucun contenu n'est publié sans au moins une source citée.
    throw new Error("Impossible de publier : aucune source n'est associée (ajoute-en une d'abord).");
  }
  const status = decision === "approve" ? "PUBLIE" : decision === "reject" ? "REJETE" : "A_VALIDER";
  const data: any = { status, reviewNote: note ?? null };
  if (type === "articles" && decision === "approve") data.publishedAt = new Date();
  await model.update({ where: { id }, data });
  await audit(actorId, decision.toUpperCase(), `${type}:${titleOf(type, item)}`);
}

router.post("/review/:type/:id", async (req: AuthRequest, res) => {
  const p = reviewSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Décision invalide." });
  if (p.data.decision === "reject" && !p.data.note) return res.status(400).json({ error: "Un motif est obligatoire pour refuser un contenu." });
  try {
    await applyReview(req.userId, req.params.type, req.params.id, p.data.decision, p.data.note);
    res.json({ ok: true });
  } catch (e: any) {
    res.status(400).json({ error: e.message });
  }
});

// POST /api/admin/review-bulk — { items: [{type,id}], decision: "approve" }
router.post("/review-bulk", async (req: AuthRequest, res) => {
  const p = z.object({ items: z.array(z.object({ type: z.string(), id: z.string() })).max(200), decision: z.literal("approve") }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Requête invalide." });
  const results: { id: string; ok: boolean; error?: string }[] = [];
  for (const it of p.data.items) {
    try {
      await applyReview(req.userId, it.type, it.id, "approve");
      results.push({ id: it.id, ok: true });
    } catch (e: any) {
      results.push({ id: it.id, ok: false, error: e.message });
    }
  }
  res.json({ results });
});

// ---------------------------------------------------------------------------
// L'admin peut aussi créer/modifier directement un contenu (publié après relecture)
// ---------------------------------------------------------------------------
router.post("/content/:type", async (req: AuthRequest, res) => {
  const type = req.params.type;
  const status = req.body?.publish ? "PUBLIE" : "A_VALIDER";
  if (type === "articles") {
    const p = articleInput.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
    const cat = await prisma.articleCategory.findUnique({ where: { slug: p.data.categorySlug } });
    if (!cat) return res.status(400).json({ error: "Rubrique inconnue." });
    const a = await prisma.article.create({ data: { slug: slugify(p.data.titleFr), categoryId: cat.id, titleFr: p.data.titleFr, titleSg: p.data.titleSg, bodyFr: p.data.bodyFr, bodySg: p.data.bodySg, sourcesJson: JSON.stringify(p.data.sources), status, authorId: req.userId } });
    await audit(req.userId, "CREATE_CONTENT", `articles:${a.titleFr}`);
    return res.status(201).json({ id: a.id, status });
  }
  if (type === "courses") {
    const p = courseInput.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
    const c = await prisma.course.create({ data: { slug: slugify(p.data.title), title: p.data.title, summary: p.data.summary, icon: p.data.icon || "🎓", partner: p.data.partner, durationMin: p.data.durationMin, format: p.data.format || "DIRECT", startsAt: p.data.startsAt ? new Date(p.data.startsAt) : null, outlineMd: p.data.outlineMd, qcmJson: JSON.stringify(p.data.qcm || []), sourcesJson: JSON.stringify(p.data.sources), status, authorId: req.userId } });
    await audit(req.userId, "CREATE_CONTENT", `courses:${c.title}`);
    return res.status(201).json({ id: c.id, status });
  }
  if (type === "income") {
    const p = incomeInput.safeParse(req.body);
    if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
    const i = await prisma.incomeActivity.create({ data: { slug: slugify(p.data.title), title: p.data.title, icon: p.data.icon || "💼", capitalMinFcfa: p.data.capitalMinFcfa, summary: p.data.summary, needsMd: p.data.needsMd, stepsMd: p.data.stepsMd, risksMd: p.data.risksMd, courseSlug: p.data.courseSlug, sourcesJson: JSON.stringify(p.data.sources), status, authorId: req.userId } });
    await audit(req.userId, "CREATE_CONTENT", `income:${i.title}`);
    return res.status(201).json({ id: i.id, status });
  }
  res.status(400).json({ error: "Type inconnu." });
});

// Mettre à jour les sources d'un contenu (ex. quand un partenaire fournit ses références)
router.put("/content/:type/:id/sources", async (req: AuthRequest, res) => {
  const model = modelFor(req.params.type);
  if (!model) return res.status(400).json({ error: "Type inconnu." });
  const p = z.object({ sources: sourcesSchema }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
  await model.update({ where: { id: req.params.id }, data: { sourcesJson: JSON.stringify(p.data.sources) } });
  await audit(req.userId, "UPDATE_SOURCES", `${req.params.type}:${req.params.id}`);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Formations : programmer / reporter une session (le motif reste interne)
// ---------------------------------------------------------------------------
router.get("/courses", async (_req, res) => {
  const courses = await prisma.course.findMany({ include: { _count: { select: { enrollments: true } } }, orderBy: { createdAt: "asc" } });
  res.json(courses.map((c) => ({ id: c.id, slug: c.slug, title: c.title, status: c.status, state: c.state, startsAt: c.startsAt, postponedTo: c.postponedTo, enrollments: c._count.enrollments })));
});

router.patch("/courses/:id/schedule", async (req: AuthRequest, res) => {
  const p = z.object({ startsAt: z.string().datetime().optional(), postponedTo: z.string().datetime().optional(), state: z.enum(["OUVERT", "REPORTEE", "TERMINEE"]).optional(), internalReason: z.string().max(500).optional() }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Données invalides." });
  const data: any = {};
  if (p.data.startsAt) data.startsAt = new Date(p.data.startsAt);
  if (p.data.postponedTo) data.postponedTo = new Date(p.data.postponedTo);
  if (p.data.state) data.state = p.data.state;
  const c = await prisma.course.update({ where: { id: req.params.id }, data });
  // Le motif est journalisé pour l'équipe uniquement ; les filles voient seulement « reportée : formatrice indisponible ».
  await audit(req.userId, "SCHEDULE_COURSE", `${c.title} ${p.data.state || ""} ${p.data.internalReason ? "(motif interne)" : ""}`);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Signalements du forum + journal
// ---------------------------------------------------------------------------
router.get("/reports", async (_req, res) => {
  const reports = await prisma.report.findMany({
    where: { status: "OUVERT" },
    include: { post: true, comment: true, reporter: { select: { pseudonyme: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  // Regroupés par message : combien de personnes l'ont signalé, et qui.
  const byTarget = new Map<string, any>();
  for (const r of reports) {
    const key = r.commentId ? "c:" + r.commentId : "p:" + r.postId;
    const g = byTarget.get(key) ?? {
      targetType: r.commentId ? "comment" : "post", targetId: r.commentId ?? r.postId,
      excerpt: (r.post?.body || r.comment?.body || "").slice(0, 200), isHidden: !!(r.comment?.isHidden || r.post?.isHidden),
      reportedUserId: r.reportedUserId, count: 0, reporters: [] as string[], reasons: {} as Record<string, number>, lastAt: r.createdAt,
    };
    g.count++; g.reporters.push(r.reporter.pseudonyme); g.reasons[r.reason] = (g.reasons[r.reason] || 0) + 1;
    byTarget.set(key, g);
  }
  res.json([...byTarget.values()].sort((a, b) => b.count - a.count));
});

// Personnes signalées : nombre de signalements reçus, nombre de suspensions, état actuel.
router.get("/reported-users", async (_req, res) => {
  const grouped = await prisma.report.groupBy({ by: ["reportedUserId"], where: { reportedUserId: { not: null } }, _count: { _all: true } });
  const users = await prisma.user.findMany({ where: { id: { in: grouped.map((g: any) => g.reportedUserId as string) } } });
  const now = Date.now();
  res.json(
    users
      .map((u: any) => ({
        id: u.id, pseudonyme: u.pseudonyme, ageBracket: u.ageBracket,
        reportsReceived: grouped.find((g: any) => g.reportedUserId === u.id)?._count._all ?? 0,
        suspensionCount: u.suspensionCount,
        suspendedUntil: u.suspendedUntil && u.suspendedUntil.getTime() > now ? u.suspendedUntil : null,
      }))
      .sort((a: any, b: any) => b.reportsReceived - a.reportsReceived),
  );
});

// Lever une suspension (ex. : signalements en groupe pour nuire) — action humaine, inscrite au journal.
router.post("/users/:id/lift-suspension", async (req: AuthRequest, res) => {
  const u = await prisma.user.update({ where: { id: req.params.id }, data: { suspendedUntil: null } });
  await prisma.auditLog.create({ data: { actorId: req.userId!, action: "SUSPENSION_LEVEE", target: u.pseudonyme } });
  res.json({ ok: true });
});

router.get("/audit", async (_req, res) => {
  res.json(await prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 100 }));
});

export default router;
