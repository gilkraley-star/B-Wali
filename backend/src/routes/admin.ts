import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, requireRole, AuthRequest } from "../middleware/auth";
import { savePhotoFromDataUrl, deletePhoto } from "../utils/uploads";
import { parseSources, sourcesSchema } from "../utils/sources";
import { articleInput, courseInput, incomeInput, slugify } from "../utils/content";
import { renderCertificate, frDate } from "../utils/certificate";
import { saveCourseVideo, deleteCourseVideo } from "../utils/courseVideo";

const router = Router();
router.use(requireAuth, requireRole("ADMIN"));

const PRO_ROLES = ["PROFESSIONNELLE", "COACH", "FORMATRICE", "MODERATRICE", "PARTENAIRE"];

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
  if (type === "stories") return prisma.story;
  return null;
}

function titleOf(type: string, x: any): string {
  return type === "articles" ? x.titleFr : x.title;
}

// ---------------------------------------------------------------------------
// Tableau de bord
// ---------------------------------------------------------------------------
router.get("/stats", async (_req, res) => {
  const [users, pros, pendingA, pendingC, pendingI, publishedA, publishedC, publishedI, reports, enrollments, pendingS] = await Promise.all([
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
    prisma.story.count({ where: { status: "A_VALIDER" } }),
  ]);
  res.json({
    users,
    professionals: pros,
    pending: { articles: pendingA, courses: pendingC, income: pendingI, stories: pendingS, total: pendingA + pendingC + pendingI + pendingS },
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
  profession: z.string().min(2).max(120).optional(), // ex. "Sage-femme", "Psychologue", "Coach", "Formatrice"
  role: z.enum(["PROFESSIONNELLE", "COACH", "FORMATRICE", "MODERATRICE", "PARTENAIRE"]),
  bio: z.string().max(600).optional(),
  certified: z.boolean().optional(),
  photo: z.string().optional(),
}).superRefine((v, ctx) => {
  if (v.role !== "PARTENAIRE") {
    if (!v.profession || v.profession.length < 2) ctx.addIssue({ code: "custom", message: "Écris la profession." });
    if (!v.photo || v.photo.length < 50) ctx.addIssue({ code: "custom", message: "Une photo est obligatoire pour un compte professionnel." });
  }
});

// POST /api/admin/users — crée le compte, renvoie le mot de passe provisoire UNE SEULE FOIS
router.post("/users", async (req: AuthRequest, res) => {
  const p = createUserSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
  const exists = await prisma.user.findUnique({ where: { email: p.data.email } });
  if (exists) return res.status(409).json({ error: "Un compte existe déjà avec cet e-mail." });

  let photoUrl: string | null = null;
  try {
    if (p.data.photo) photoUrl = savePhotoFromDataUrl(p.data.photo);
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
      profession: p.data.profession || "Organisation partenaire",
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
  role: z.enum(["PROFESSIONNELLE", "COACH", "FORMATRICE", "MODERATRICE", "PARTENAIRE"]).optional(),
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
  const [articles, courses, income, stories] = await Promise.all([
    prisma.article.findMany({ where: { status }, include: { author: true, category: true }, orderBy: { updatedAt: "desc" } }),
    prisma.course.findMany({ where: { status }, include: { author: true }, orderBy: { updatedAt: "desc" } }),
    prisma.incomeActivity.findMany({ where: { status }, include: { author: true }, orderBy: { updatedAt: "desc" } }),
    prisma.story.findMany({ where: { status }, include: { chapters: { orderBy: { position: "asc" } } }, orderBy: { createdAt: "asc" } }),
  ]);
  const author = (a: any) => (a ? { fullName: a.fullName, profession: a.profession, photoUrl: a.photoUrl } : null);
  res.json([
    ...articles.map((a) => ({ type: "articles", id: a.id, title: a.titleFr, category: a.category.titleFr, body: a.bodyFr, status: a.status, reviewNote: a.reviewNote, sources: parseSources(a.sourcesJson), author: author(a.author) })),
    ...courses.map((c) => ({ type: "courses", id: c.id, title: c.title, category: "Formation", body: `${c.summary}\n\n${c.outlineMd}`, status: c.status, reviewNote: c.reviewNote, sources: parseSources(c.sourcesJson), author: author(c.author), partner: c.partner })),
    ...income.map((i) => ({ type: "income", id: i.id, title: i.title, category: `Revenu · dès ${i.capitalMinFcfa} FCFA`, body: `${i.summary}\n\nIl te faut :\n${i.needsMd}\n\nComment démarrer :\n${i.stepsMd}\n\nPrécautions :\n${i.risksMd}`, status: i.status, reviewNote: i.reviewNote, sources: parseSources(i.sourcesJson), author: author(i.author) })),
    ...stories.map((st: any) => ({ type: "stories", id: st.id, title: st.title, category: `Histoire · ${st.category}`, body: `${st.summary}\n\n` + st.chapters.map((c: any) => `${c.title}\n${c.body}`).join("\n\n"), status: st.status, reviewNote: st.reviewNote, sources: [{ org: st.origin === "ORIGINALE" ? "Wali" : st.origin, title: st.credit, url: st.sourceUrl || "https://wali.naxaci.com" }], author: null })),
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
  if (decision === "approve" && type !== "stories" && type !== "courses" && parseSources(item.sourcesJson).length === 0) {
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
// Gestion complète des contenus : lister, modifier, masquer / republier, supprimer, ajouter
// ---------------------------------------------------------------------------
router.get("/contents", async (_req, res) => {
  const [articles, courses, income, stories] = await Promise.all([
    prisma.article.findMany({ include: { category: true }, orderBy: { updatedAt: "desc" } }),
    prisma.course.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.incomeActivity.findMany({ orderBy: { updatedAt: "desc" } }),
    prisma.story.findMany({ orderBy: { createdAt: "desc" } }),
  ]);
  res.json([
    ...articles.map((a: any) => ({ type: "articles", id: a.id, title: a.titleFr, category: a.category.titleFr, status: a.status, text: a.bodyFr })),
    ...courses.map((c: any) => ({ type: "courses", id: c.id, title: c.title, category: "Formation", status: c.status, text: c.summary })),
    ...income.map((i: any) => ({ type: "income", id: i.id, title: i.title, category: "Gagner de l'argent", status: i.status, text: i.summary })),
    ...stories.map((st: any) => ({ type: "stories", id: st.id, title: st.title, category: "Histoire · " + st.category, status: st.status, text: st.summary })),
  ]);
});

router.get("/article-categories", async (_req, res) => {
  res.json(await prisma.articleCategory.findMany({ select: { slug: true, titleFr: true }, orderBy: { titleFr: "asc" } }));
});

const editSchema = z.object({
  status: z.enum(["PUBLIE", "MASQUE"]).optional(),
  title: z.string().min(2).max(200).optional(),
  text: z.string().min(5).max(20000).optional(),
});
router.patch("/contents/:type/:id", async (req: AuthRequest, res) => {
  const { type, id } = req.params;
  const model = modelFor(type);
  if (!model) return res.status(400).json({ error: "Type inconnu." });
  const p = editSchema.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Valeurs invalides." });
  const item = await model.findUnique({ where: { id } });
  if (!item) return res.status(404).json({ error: "Contenu introuvable." });
  const data: any = {};
  if (p.data.status) {
    if (p.data.status === "PUBLIE" && (type === "articles" || type === "income") && parseSources(item.sourcesJson).length === 0) return res.status(400).json({ error: "Impossible de publier : aucune source n'est associée." });
    data.status = p.data.status;
  }
  if (p.data.title) { if (type === "articles") data.titleFr = p.data.title; else data.title = p.data.title; }
  if (p.data.text) { if (type === "articles") data.bodyFr = p.data.text; else data.summary = p.data.text; }
  await model.update({ where: { id }, data });
  await audit(req.userId, "EDIT_CONTENT", `${type}:${titleOf(type, item)}`);
  res.json({ ok: true });
});

router.delete("/contents/:type/:id", async (req: AuthRequest, res) => {
  const { type, id } = req.params;
  const model = modelFor(type);
  if (!model) return res.status(400).json({ error: "Type inconnu." });
  const item = await model.findUnique({ where: { id } });
  if (!item) return res.status(404).json({ error: "Contenu introuvable." });
  try {
    if (type === "articles") await prisma.savedArticle.deleteMany({ where: { articleId: id } });
    await model.delete({ where: { id } });
  } catch {
    return res.status(409).json({ error: "Ce contenu est encore utilisé ailleurs : masque-le plutôt que de le supprimer." });
  }
  await audit(req.userId, "DELETE_CONTENT", `${type}:${titleOf(type, item)}`);
  res.json({ ok: true });
});

const storyInput = z.object({
  title: z.string().min(3).max(200), summary: z.string().min(10).max(600),
  category: z.enum(["CONTE", "HEROINE", "EDUCATION", "AMOUR", "ICI"]), credit: z.string().min(2).max(120),
  chapters: z.array(z.object({ title: z.string().min(1).max(200), body: z.string().min(10).max(30000) })).min(1).max(40),
  publish: z.boolean().optional(),
});
router.post("/stories", async (req: AuthRequest, res) => {
  const p = storyInput.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
  const d = p.data;
  const st = await prisma.story.create({ data: { slug: slugify(d.title) + "-" + crypto.randomBytes(2).toString("hex"), title: d.title, summary: d.summary, category: d.category, ageMin: d.category === "AMOUR" ? 18 : 10, origin: "ORIGINALE", credit: d.credit, readMin: Math.max(2, Math.round(d.chapters.reduce((n, c) => n + c.body.length, 0) / 1000)), status: d.publish ? "PUBLIE" : "A_VALIDER", chapters: { create: d.chapters.map((c, i) => ({ position: i + 1, title: c.title, body: c.body })) } } });
  await audit(req.userId, "CREATE_CONTENT", `stories:${st.title}`);
  res.status(201).json({ id: st.id });
});

// Messages d'Entre Nous : voir, masquer, supprimer
router.get("/forum-posts", async (_req, res) => {
  const posts = await prisma.forumPost.findMany({ orderBy: { createdAt: "desc" }, take: 150, include: { category: true, author: { select: { pseudonyme: true } }, _count: { select: { comments: true } } } });
  res.json(posts.map((x: any) => ({ id: x.id, title: x.title, body: x.body, theme: x.category.titleFr, author: x.anonymous ? "Anonyme" : x.author.pseudonyme, comments: x._count.comments, hidden: x.isHidden, at: x.createdAt })));
});
router.patch("/forum-posts/:id", async (req: AuthRequest, res) => {
  const p = z.object({ hidden: z.boolean() }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Valeur invalide." });
  await prisma.forumPost.update({ where: { id: req.params.id }, data: { isHidden: p.data.hidden } });
  await audit(req.userId, p.data.hidden ? "HIDE_POST" : "SHOW_POST", req.params.id);
  res.json({ ok: true });
});
router.delete("/forum-posts/:id", async (req: AuthRequest, res) => {
  const id = req.params.id;
  const cs = await prisma.forumComment.findMany({ where: { postId: id }, select: { id: true } });
  await prisma.report.deleteMany({ where: { OR: [{ postId: id }, { commentId: { in: cs.map((c: any) => c.id) } }] } });
  await prisma.forumPost.delete({ where: { id } }).catch(() => {});
  await audit(req.userId, "DELETE_POST", id);
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Formations : programmer / reporter une session (le motif reste interne)
// ---------------------------------------------------------------------------
router.get("/courses", async (_req, res) => {
  const courses = await prisma.course.findMany({ include: { _count: { select: { enrollments: true } } }, orderBy: { createdAt: "asc" } });
  res.json(courses.map((c) => ({ id: c.id, slug: c.slug, title: c.title, status: c.status, state: c.state, certTemplateId: c.certTemplateId, startsAt: c.startsAt, postponedTo: c.postponedTo, enrollments: c._count.enrollments, format: c.format, certified: c.certified, hasTest: c.hasTest, qcm: JSON.parse(c.qcmJson || "[]"), videos: JSON.parse(c.videosJson || "[]").map((v: any) => ({ id: v.id, title: v.title })) })));
});

// ---------------------------------------------------------------------------
// Centres de santé (liste affichée dans l'appli, avec position pour l'itinéraire)
// ---------------------------------------------------------------------------
router.get("/health-centers", async (_req, res) => {
  res.json(await prisma.healthCenter.findMany({ orderBy: [{ country: "asc" }, { sort: "asc" }, { createdAt: "asc" }] }));
});
const hcBody = z.object({
  country: z.string().length(2).optional(), name: z.string().trim().min(2).max(120), kind: z.string().trim().max(160).optional(),
  city: z.string().trim().max(80).optional(), district: z.string().trim().max(80).optional().nullable(), phone: z.string().trim().max(30).optional().nullable(),
  lat: z.number().min(-90).max(90).nullable().optional(), lng: z.number().min(-180).max(180).nullable().optional(), active: z.boolean().optional(),
});
router.post("/health-centers", async (req: AuthRequest, res) => {
  const p = hcBody.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Nom du centre obligatoire ; position (latitude, longitude) valide si tu la donnes." });
  const max = await prisma.healthCenter.aggregate({ _max: { sort: true } });
  const c = await prisma.healthCenter.create({ data: { ...p.data, country: p.data.country || "CF", sort: (max._max.sort ?? 0) + 1 } as any });
  await audit(req.userId, "CREATE_HEALTH_CENTER", c.name);
  res.status(201).json(c);
});
router.patch("/health-centers/:id", async (req: AuthRequest, res) => {
  const p = hcBody.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Données invalides." });
  const c = await prisma.healthCenter.update({ where: { id: req.params.id }, data: p.data as any });
  await audit(req.userId, "UPDATE_HEALTH_CENTER", c.name);
  res.json(c);
});
router.delete("/health-centers/:id", async (req: AuthRequest, res) => {
  const c = await prisma.healthCenter.delete({ where: { id: req.params.id } }).catch(() => null);
  if (c) await audit(req.userId, "DELETE_HEALTH_CENTER", c.name);
  res.status(204).send();
});

// ---------------------------------------------------------------------------
// Entre Nous : thèmes et sous-thèmes du forum gérés par l'équipe
// ---------------------------------------------------------------------------
router.get("/forum-categories", async (_req, res) => {
  const cats = await prisma.forumCategory.findMany({ orderBy: [{ sort: "asc" }], include: { _count: { select: { posts: true } } } });
  res.json(cats.map((c) => ({ id: c.id, titleFr: c.titleFr, icon: c.icon, parentId: c.parentId, sort: c.sort, posts: c._count.posts })));
});
const catBody = z.object({ titleFr: z.string().trim().min(2).max(60), icon: z.string().max(8).optional(), parentId: z.string().nullable().optional() });
router.post("/forum-categories", async (req: AuthRequest, res) => {
  const p = catBody.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Écris un nom de thème (2 lettres au moins)." });
  if (p.data.parentId) { const par = await prisma.forumCategory.findUnique({ where: { id: p.data.parentId } }); if (!par || par.parentId) return res.status(400).json({ error: "Un sous-thème se range dans un thème général." }); }
  let slug = "c-" + slugify(p.data.titleFr), n = 1;
  while (await prisma.forumCategory.findUnique({ where: { slug } })) slug = "c-" + slugify(p.data.titleFr) + "-" + ++n;
  const max = await prisma.forumCategory.aggregate({ _max: { sort: true }, where: { parentId: p.data.parentId ?? null } });
  const c = await prisma.forumCategory.create({ data: { slug, titleFr: p.data.titleFr, icon: p.data.parentId ? null : p.data.icon || "💬", parentId: p.data.parentId ?? null, sort: (max._max.sort ?? 0) + 1 } });
  await audit(req.userId, "CREATE_FORUM_CATEGORY", c.titleFr);
  res.status(201).json(c);
});
router.patch("/forum-categories/:id", async (req: AuthRequest, res) => {
  const p = catBody.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Nom invalide." });
  const c = await prisma.forumCategory.update({ where: { id: req.params.id }, data: { titleFr: p.data.titleFr, icon: p.data.icon } });
  await audit(req.userId, "RENAME_FORUM_CATEGORY", c.titleFr);
  res.json(c);
});
router.delete("/forum-categories/:id", async (req: AuthRequest, res) => {
  const c = await prisma.forumCategory.findUnique({ where: { id: req.params.id }, include: { _count: { select: { posts: true } } } });
  if (!c) return res.status(404).json({ error: "Introuvable." });
  const kids = await prisma.forumCategory.findMany({ where: { parentId: c.id }, include: { _count: { select: { posts: true } } } });
  const posts = c._count.posts + kids.reduce((a, k) => a + k._count.posts, 0);
  if (posts > 0) return res.status(409).json({ error: `Ce thème contient ${posts} message(s). Renomme-le plutôt, ou masque les messages d'abord.` });
  await prisma.forumCategory.deleteMany({ where: { parentId: c.id } });
  await prisma.forumCategory.delete({ where: { id: c.id } });
  await audit(req.userId, "DELETE_FORUM_CATEGORY", c.titleFr);
  res.status(204).send();
});

router.post("/courses", async (req: AuthRequest, res) => {
  const p = z.object({
    title: z.string().trim().min(4).max(140), summary: z.string().trim().min(10).max(600), outlineMd: z.string().trim().min(10).max(8000),
    icon: z.string().max(8).optional(), partner: z.string().max(80).optional(), hours: z.number().min(0.5).max(200),
    format: z.enum(["DIRECT", "REPLAY", "VIDEOS"]), certified: z.boolean().optional(), hasTest: z.boolean().optional(), startsAt: z.string().datetime().optional(), location: z.string().max(140).optional(), seats: z.number().int().min(1).max(5000).optional(),
    trainerId: z.string().optional(), trainerName: z.string().max(80).optional(), trainerTitle: z.string().max(80).optional(),
  }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message || "Informations incomplètes." });
  const d = p.data;
  let trainerName = d.trainerName, trainerTitle = d.trainerTitle;
  if (d.trainerId) {
    const t = await prisma.user.findUnique({ where: { id: d.trainerId } });
    if (!t || t.role === "UTILISATRICE") return res.status(400).json({ error: "Formatrice introuvable." });
    trainerName = t.fullName || t.pseudonyme; trainerTitle = t.profession || trainerTitle;
  }
  if (!trainerName) return res.status(400).json({ error: "Choisis la formatrice ou écris son nom." });
  let slug = slugify(d.title), n = 1;
  while (await prisma.course.findUnique({ where: { slug } })) slug = slugify(d.title) + "-" + ++n;
  const c = await prisma.course.create({ data: {
    slug, title: d.title, summary: d.summary, outlineMd: d.outlineMd, icon: d.icon || "🎓", partner: d.partner, durationMin: Math.round(d.hours * 60),
    format: d.format, certified: d.certified ?? true, hasTest: d.certified === false ? false : d.hasTest ?? true, certTemplateId: (await prisma.certTemplate.findFirst({ orderBy: { createdAt: "asc" } }))?.id ?? null,
    startsAt: d.startsAt ? new Date(d.startsAt) : null, location: d.location, seats: d.seats,
    trainerId: d.trainerId, trainerName, trainerTitle, status: "PUBLIE", authorId: d.trainerId ?? null,
  } });
  await audit(req.userId, "CREATE_COURSE", c.title);
  res.status(201).json({ id: c.id, slug: c.slug });
});

// Contenu d'une formation : options (attestation, test), questions du test, vidéos.
const qcmSchema = z.array(z.object({ q: z.string().trim().min(3).max(300), options: z.array(z.string().trim().min(1).max(160)).min(2).max(5), correct: z.number().int().min(0).max(4) }).refine((x) => x.correct < x.options.length, { message: "Bonne réponse invalide." })).max(60);
router.patch("/courses/:id/content", async (req: AuthRequest, res) => {
  const p = z.object({ certified: z.boolean().optional(), hasTest: z.boolean().optional(), qcm: qcmSchema.optional() }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message || "Test invalide : chaque question a une bonne réponse parmi ses choix." });
  const data: any = {};
  if (p.data.certified !== undefined) { data.certified = p.data.certified; if (!p.data.certified) data.hasTest = false; }
  if (p.data.hasTest !== undefined && p.data.certified !== false) data.hasTest = p.data.hasTest;
  if (p.data.qcm) data.qcmJson = JSON.stringify(p.data.qcm);
  const c = await prisma.course.update({ where: { id: req.params.id }, data });
  await audit(req.userId, "UPDATE_COURSE_CONTENT", c.title);
  res.json({ ok: true });
});
// Envoi d'une vidéo : le fichier est envoyé tel quel (corps brut), le titre est dans l'adresse.
router.post("/courses/:id/videos", async (req: AuthRequest, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) { req.resume(); return res.status(404).json({ error: "Formation introuvable." }); }
  const title = String(req.query.title || "").trim().slice(0, 120) || "Leçon " + (JSON.parse(course.videosJson || "[]").length + 1);
  try {
    const url = await saveCourseVideo(req);
    const fresh = await prisma.course.findUnique({ where: { id: course.id } });
    const list = JSON.parse(fresh!.videosJson || "[]");
    list.push({ id: require("crypto").randomUUID(), title, url });
    await prisma.course.update({ where: { id: course.id }, data: { videosJson: JSON.stringify(list), format: "VIDEOS" } });
    await audit(req.userId, "ADD_COURSE_VIDEO", course.title + " — " + title);
    res.status(201).json({ videos: list });
  } catch (e: any) { res.status(400).json({ error: e.message || "Envoi impossible." }); }
});
router.delete("/courses/:id/videos/:vid", async (req: AuthRequest, res) => {
  const course = await prisma.course.findUnique({ where: { id: req.params.id } });
  if (!course) return res.status(404).json({ error: "Formation introuvable." });
  const list = JSON.parse(course.videosJson || "[]");
  const v = list.find((x: any) => x.id === req.params.vid);
  deleteCourseVideo(v?.url);
  await prisma.course.update({ where: { id: course.id }, data: { videosJson: JSON.stringify(list.filter((x: any) => x.id !== req.params.vid)) } });
  res.json({ ok: true });
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
// Attestations : modèles (fond, champs, signatures, cachet) préparés ici, remplis automatiquement pour chaque apprenante
// ---------------------------------------------------------------------------
const imgData = z.string().max(5_000_000);
const fieldSchema = z.object({ x: z.number().min(0).max(1), y: z.number().min(0).max(1), size: z.number().min(6).max(80) });
const signerSchema = z.object({ name: z.string().min(2).max(80), title: z.string().max(80), sigUrl: z.string().optional(), sig: imgData.optional() });
const tplBody = z.object({
  name: z.string().min(2).max(80).optional(),
  bg: imgData.optional(),
  stamp: imgData.optional(),
  stampX: z.number().min(0).max(1).optional(), stampY: z.number().min(0).max(1).optional(), stampSize: z.number().min(0.05).max(0.5).optional(),
  fields: z.record(fieldSchema).optional(),
  signers: z.array(signerSchema).max(4).optional(),
});

router.get("/cert-templates", async (_req, res) => {
  res.json(await prisma.certTemplate.findMany({ orderBy: { createdAt: "asc" } }));
});

async function saveTpl(id: string | null, b: z.infer<typeof tplBody>) {
  const old = id ? await prisma.certTemplate.findUnique({ where: { id } }) : null;
  const data: any = {};
  if (b.name) data.name = b.name;
  if (b.bg) { deletePhoto(old?.bgUrl); data.bgUrl = savePhotoFromDataUrl(b.bg); }
  if (b.stamp) { deletePhoto(old?.stampUrl); data.stampUrl = savePhotoFromDataUrl(b.stamp); }
  for (const k of ["stampX", "stampY", "stampSize"] as const) if (b[k] !== undefined) data[k] = b[k];
  if (b.fields) data.fieldsJson = JSON.stringify(b.fields);
  if (b.signers) {
    data.signersJson = JSON.stringify(b.signers.map((sg) => ({ name: sg.name, title: sg.title, sigUrl: sg.sig ? savePhotoFromDataUrl(sg.sig) : sg.sigUrl || null })));
  }
  return old ? prisma.certTemplate.update({ where: { id: old.id }, data }) : prisma.certTemplate.create({ data: { name: data.name || "Attestation", bgUrl: data.bgUrl, ...data } });
}

router.post("/cert-templates", async (req: AuthRequest, res) => {
  const p = tplBody.safeParse(req.body);
  if (!p.success || !p.data.bg) return res.status(400).json({ error: "Donne un nom et l'image de fond de l'attestation." });
  try { const t = await saveTpl(null, p.data); await audit(req.userId, "CREATE_CERT_TEMPLATE", t.name); res.status(201).json(t); }
  catch (e: any) { res.status(400).json({ error: e.message || "Image invalide." }); }
});
router.patch("/cert-templates/:id", async (req: AuthRequest, res) => {
  const p = tplBody.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Données invalides." });
  try { const t = await saveTpl(req.params.id, p.data); await audit(req.userId, "UPDATE_CERT_TEMPLATE", t.name); res.json(t); }
  catch (e: any) { res.status(400).json({ error: e.message || "Image invalide." }); }
});
router.delete("/cert-templates/:id", async (req: AuthRequest, res) => {
  await prisma.course.updateMany({ where: { certTemplateId: req.params.id }, data: { certTemplateId: null } });
  await prisma.certTemplate.delete({ where: { id: req.params.id } }).catch(() => undefined);
  res.json({ ok: true });
});
// Aperçu avec une apprenante fictive (renvoyé en base64 : le navigateur l'ouvre)
router.post("/cert-templates/:id/preview", async (req, res) => {
  const t = await prisma.certTemplate.findUnique({ where: { id: req.params.id } });
  if (!t) return res.status(404).json({ error: "Modèle introuvable." });
  const pdf = await renderCertificate(t, { fullName: "Marie Exemple Ngaïssona", birthDate: "2008-03-14", birthPlace: "Bangui", courseTitle: "Titre de la formation", dateText: "Fait à Bangui, le " + frDate(new Date().toISOString().slice(0, 10)), number: "BW-APERCU-0001" });
  res.json({ pdf: Buffer.from(pdf).toString("base64") });
});
router.patch("/courses/:id/template", async (req: AuthRequest, res) => {
  const p = z.object({ certTemplateId: z.string().nullable() }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Données invalides." });
  await prisma.course.update({ where: { id: req.params.id }, data: { certTemplateId: p.data.certTemplateId } });
  res.json({ ok: true });
});

// ---------------------------------------------------------------------------
// Annonces (publicités) de l'accueil
// ---------------------------------------------------------------------------
const annBody = z.object({
  emoji: z.string().max(8).optional(), title: z.string().min(2).max(60), body: z.string().max(140).optional(),
  color: z.enum(["rose", "violet", "bleu", "vert", "jaune"]).optional(), target: z.string().max(30).nullable().optional(),
  imageUrl: z.string().regex(/^\/uploads\/[\w.-]+$/).nullable().optional(), buttonLabel: z.string().max(30).nullable().optional(), linkUrl: z.string().url().max(300).nullable().optional(),
  active: z.boolean().optional(), endsAt: z.string().datetime().nullable().optional(), country: z.string().length(2).nullable().optional(),
});
router.get("/announcements", async (_req, res) => { res.json(await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } })); });
router.post("/announcements/image", async (req: AuthRequest, res) => {
  const p = z.object({ dataUrl: z.string().max(5_000_000) }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Image manquante." });
  try { res.status(201).json({ url: savePhotoFromDataUrl(p.data.dataUrl) }); } catch (e: any) { res.status(400).json({ error: e.message }); }
});
router.post("/announcements", async (req: AuthRequest, res) => {
  const p = annBody.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Titre (2 à 60 lettres) obligatoire." });
  const a = await prisma.announcement.create({ data: { ...p.data, endsAt: p.data.endsAt ? new Date(p.data.endsAt) : null } });
  await audit(req.userId, "CREATE_ANNOUNCEMENT", a.title); res.status(201).json(a);
});
router.patch("/announcements/:id", async (req: AuthRequest, res) => {
  const p = annBody.partial().safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Données invalides." });
  const a = await prisma.announcement.update({ where: { id: req.params.id }, data: { ...p.data, endsAt: p.data.endsAt ? new Date(p.data.endsAt) : p.data.endsAt === null ? null : undefined } });
  res.json(a);
});
router.delete("/announcements/:id", async (req, res) => { const old = await prisma.announcement.findUnique({ where: { id: req.params.id } }); if (old?.imageUrl) deletePhoto(old.imageUrl); await prisma.announcement.delete({ where: { id: req.params.id } }).catch(() => undefined); res.json({ ok: true }); });

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
