import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { ageFromBirthDate } from "../utils/age";

const router = Router();

async function ageOf(userId: string): Promise<number> {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  return u?.birthDate ? ageFromBirthDate(u.birthDate) : 0;
}

// GET /api/stories?category=HEROINE — histoires publiées ET adaptées à l'âge de la lectrice.
// Les romans 18+ n'apparaissent jamais pour une mineure : le filtre est fait ICI, sur le serveur.
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const age = await ageOf(req.userId!);
  const category = typeof req.query.category === "string" ? req.query.category : undefined;
  const list = await prisma.story.findMany({
    where: { status: "PUBLIE", ageMin: { lte: age }, ...(category ? { category } : {}) },
    orderBy: { createdAt: "asc" },
  });
  res.json(
    list.map((s: any) => ({
      slug: s.slug, title: s.title, summary: s.summary, category: s.category, icon: s.icon,
      ageMin: s.ageMin, readMin: s.readMin, origin: s.origin, credit: s.credit, license: s.license, sourceUrl: s.sourceUrl,
    })),
  );
});

// GET /api/stories/:slug — le texte complet, par chapitres
router.get("/:slug", requireAuth, async (req: AuthRequest, res) => {
  const age = await ageOf(req.userId!);
  const s = await prisma.story.findFirst({
    where: { slug: req.params.slug, status: "PUBLIE", ageMin: { lte: age } },
    include: { chapters: { orderBy: { position: "asc" } } },
  });
  if (!s) return res.status(404).json({ error: "Histoire introuvable." });
  res.json({
    slug: s.slug, title: s.title, category: s.category, icon: s.icon, readMin: s.readMin,
    origin: s.origin, credit: s.credit, license: s.license, sourceUrl: s.sourceUrl,
    chapters: s.chapters.map((c: any) => ({ position: c.position, title: c.title, body: c.body })),
  });
});

export default router;
