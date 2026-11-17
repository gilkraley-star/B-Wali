import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, requireRole, AuthRequest, PRO_ROLES } from "../middleware/auth";
import { articleInput, courseInput, incomeInput, slugify, ContentType } from "../utils/content";
import { parseSources } from "../utils/sources";

// Espace des professionnelles (sages-femmes, médecins, psychologues, coachs, formatrices) :
// elles proposent des contenus ; RIEN n'est visible des filles avant la validation par un compte ADMIN.

const router = Router();
router.use(requireAuth, requireRole(...PRO_ROLES));

const EDITABLE = ["BROUILLON", "A_VALIDER", "REJETE"];

// GET /api/pro/mine — toutes mes propositions et leur statut
router.get("/mine", async (req: AuthRequest, res) => {
  const where = { authorId: req.userId };
  const [articles, courses, income] = await Promise.all([
    prisma.article.findMany({ where, orderBy: { updatedAt: "desc" } }),
    prisma.course.findMany({ where, orderBy: { updatedAt: "desc" } }),
    prisma.incomeActivity.findMany({ where, orderBy: { updatedAt: "desc" } }),
  ]);
  res.json({
    articles: articles.map((a) => ({ id: a.id, title: a.titleFr, status: a.status, reviewNote: a.reviewNote, sources: parseSources(a.sourcesJson) })),
    courses: courses.map((c) => ({ id: c.id, title: c.title, status: c.status, reviewNote: c.reviewNote, sources: parseSources(c.sourcesJson) })),
    income: income.map((i) => ({ id: i.id, title: i.title, status: i.status, reviewNote: i.reviewNote, sources: parseSources(i.sourcesJson) })),
  });
});

// PATCH /api/pro/availability
router.patch("/availability", async (req: AuthRequest, res) => {
  const available = !!req.body?.available;
  await prisma.user.update({ where: { id: req.userId }, data: { available } });
  res.json({ available });
});

// POST /api/pro/submit/:type  — { draft?: boolean, ...champs du contenu }
router.post("/submit/:type", async (req: AuthRequest, res) => {
  const type = req.params.type as ContentType;
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  const isPartner = me?.role === "PARTENAIRE";
  if (isPartner && type !== "courses") return res.status(403).json({ error: "Un compte partenaire propose des formations." });
  const status = req.body?.draft ? "BROUILLON" : "A_VALIDER";
  try {
    if (type === "articles") {
      const p = articleInput.safeParse(req.body);
      if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
      const cat = await prisma.articleCategory.findUnique({ where: { slug: p.data.categorySlug } });
      if (!cat) return res.status(400).json({ error: "Rubrique inconnue." });
      const a = await prisma.article.create({
        data: {
          slug: slugify(p.data.titleFr),
          categoryId: cat.id,
          titleFr: p.data.titleFr,
          titleSg: p.data.titleSg,
          bodyFr: p.data.bodyFr,
          bodySg: p.data.bodySg,
          sourcesJson: JSON.stringify(p.data.sources),
          status,
          authorId: req.userId,
        },
      });
      return res.status(201).json({ id: a.id, status });
    }
    if (type === "courses") {
      const p = courseInput.safeParse(req.body);
      if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
      const c = await prisma.course.create({
        data: {
          slug: slugify(p.data.title) + "-" + Date.now().toString(36),
          title: p.data.title,
          summary: p.data.summary,
          icon: p.data.icon || "🎓",
          partner: isPartner ? me!.fullName : p.data.partner,
          certified: p.data.certified ?? true,
          hasTest: p.data.certified === false ? false : p.data.hasTest ?? true,
          durationMin: p.data.durationMin,
          format: p.data.format || "DIRECT",
          startsAt: p.data.startsAt ? new Date(p.data.startsAt) : null,
          outlineMd: p.data.outlineMd,
          qcmJson: JSON.stringify(p.data.qcm || []),
          sourcesJson: JSON.stringify(p.data.sources || []),
          status,
          authorId: req.userId,
        },
      });
      return res.status(201).json({ id: c.id, status });
    }
    if (type === "income") {
      const p = incomeInput.safeParse(req.body);
      if (!p.success) return res.status(400).json({ error: p.error.issues[0].message });
      const i = await prisma.incomeActivity.create({
        data: {
          slug: slugify(p.data.title),
          title: p.data.title,
          icon: p.data.icon || "💼",
          capitalMinFcfa: p.data.capitalMinFcfa,
          summary: p.data.summary,
          needsMd: p.data.needsMd,
          stepsMd: p.data.stepsMd,
          risksMd: p.data.risksMd,
          courseSlug: p.data.courseSlug,
          sourcesJson: JSON.stringify(p.data.sources),
          status,
          authorId: req.userId,
        },
      });
      return res.status(201).json({ id: i.id, status });
    }
    return res.status(400).json({ error: "Type de contenu inconnu." });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Impossible d'enregistrer la proposition." });
  }
});

// DELETE /api/pro/submit/:type/:id — retirer une proposition non publiée
router.delete("/submit/:type/:id", async (req: AuthRequest, res) => {
  const { type, id } = req.params;
  const model: any = type === "articles" ? prisma.article : type === "courses" ? prisma.course : type === "income" ? prisma.incomeActivity : null;
  if (!model) return res.status(400).json({ error: "Type inconnu." });
  const item = await model.findUnique({ where: { id } });
  if (!item || item.authorId !== req.userId) return res.status(404).json({ error: "Introuvable." });
  if (!EDITABLE.includes(item.status)) return res.status(409).json({ error: "Un contenu publié ne peut être retiré que par l'équipe." });
  await model.delete({ where: { id } });
  res.status(204).send();
});

export default router;
