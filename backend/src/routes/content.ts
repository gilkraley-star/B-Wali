import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";

import { parseSources } from "../utils/sources";

const router = Router();

/** Ajoute les sources lisibles et masque les champs internes (revue, auteur sensible). */
function withSources(a: any) {
  const { sourcesJson, reviewNote, authorId, author, ...rest } = a;
  return {
    ...rest,
    sources: parseSources(sourcesJson),
    author: author ? { fullName: author.fullName, profession: author.profession, photoUrl: author.photoUrl, certified: author.certified } : null,
  };
}

// GET /api/content/categories
router.get("/categories", async (_req, res) => {
  const categories = await prisma.articleCategory.findMany({
    include: { _count: { select: { articles: { where: { status: "PUBLIE" } } } } },
  });
  res.json(categories);
});

// GET /api/content/articles?category=slug
router.get("/articles", async (req, res) => {
  const categorySlug = req.query.category as string | undefined;
  const articles = await prisma.article.findMany({
    where: { status: "PUBLIE", ...(categorySlug ? { category: { slug: categorySlug } } : {}) },
    include: { category: true, author: true },
    orderBy: { publishedAt: "desc" },
  });
  res.json(articles.map(withSources));
});

// GET /api/content/articles/:slug
router.get("/articles/:slug", async (req, res) => {
  const article = await prisma.article.findFirst({
    where: { slug: req.params.slug, status: "PUBLIE" },
    include: { category: true, author: true },
  });
  if (!article) return res.status(404).json({ error: "Article introuvable." });
  res.json(withSources(article));
});

// --- Sauvegarde pour consultation hors-ligne (section 8) ---

// POST /api/content/articles/:slug/save
router.post("/articles/:slug/save", requireAuth, async (req: AuthRequest, res) => {
  const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!article) return res.status(404).json({ error: "Article introuvable." });

  const saved = await prisma.savedArticle.upsert({
    where: { userId_articleId: { userId: req.userId!, articleId: article.id } },
    create: { userId: req.userId!, articleId: article.id },
    update: {},
  });
  res.status(201).json(saved);
});

// DELETE /api/content/articles/:slug/save
router.delete("/articles/:slug/save", requireAuth, async (req: AuthRequest, res) => {
  const article = await prisma.article.findUnique({ where: { slug: req.params.slug } });
  if (!article) return res.status(404).json({ error: "Article introuvable." });
  await prisma.savedArticle.deleteMany({ where: { userId: req.userId, articleId: article.id } });
  res.status(204).send();
});

// GET /api/content/saved — articles téléchargés/sauvegardés par l'utilisatrice
router.get("/saved", requireAuth, async (req: AuthRequest, res) => {
  const saved = await prisma.savedArticle.findMany({
    where: { userId: req.userId },
    include: { article: { include: { category: true } } },
  });
  res.json(saved.map((s: (typeof saved)[number]) => s.article));
});

export default router;
