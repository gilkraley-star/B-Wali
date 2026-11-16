import { renderCertificate, frDate } from "../utils/certificate";
import { z } from "zod";
import { Router } from "express";
import { prisma } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { parseSources } from "../utils/sources";

const router = Router();

function publicCourse(c: any) {
  return {
    id: c.id,
    slug: c.slug,
    liveState: c.liveState,
    title: c.title,
    summary: c.summary,
    icon: c.icon,
    partner: c.partner,
    durationMin: c.durationMin,
    format: c.format,
    startsAt: c.startsAt,
    postponedTo: c.postponedTo,
    state: c.state,
    outlineMd: c.outlineMd,
    sources: parseSources(c.sourcesJson),
    author: c.author
      ? { fullName: c.author.fullName, profession: c.author.profession, photoUrl: c.author.photoUrl, certified: c.author.certified }
      : null,
  };
}

// GET /api/catalog/courses — formations publiées
router.get("/courses", async (_req, res) => {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLIE" },
    include: { author: true },
    orderBy: { createdAt: "asc" },
  });
  res.json(courses.map(publicCourse));
});

// POST /api/catalog/courses/:slug/enroll — s'inscrire à une formation
router.post("/courses/:slug/enroll", requireAuth, async (req: AuthRequest, res) => {
  const course = await prisma.course.findFirst({ where: { slug: req.params.slug, status: "PUBLIE" } });
  if (!course) return res.status(404).json({ error: "Formation introuvable." });
  // Vraies informations, utilisées ensuite sur l'attestation
  const p = z.object({
    fullName: z.string().trim().min(5, "Écris ton nom complet (nom et prénoms).").max(100),
    birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de naissance invalide."),
    birthPlace: z.string().trim().min(2, "Écris ton lieu de naissance.").max(80),
  }).safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: p.error.issues[0]?.message || "Informations incomplètes." });
  const bd = new Date(p.data.birthDate);
  if (isNaN(bd.getTime()) || bd > new Date() || bd.getFullYear() < 1940) return res.status(400).json({ error: "Date de naissance invalide." });
  const e = await prisma.enrollment.upsert({
    where: { userId_courseId: { userId: req.userId!, courseId: course.id } },
    create: { userId: req.userId!, courseId: course.id, ...p.data },
    update: { ...p.data },
  });
  res.status(201).json({ enrolled: true, enrollmentId: e.id });
});

// GET /api/catalog/my-enrollments
router.get("/my-enrollments", requireAuth, async (req: AuthRequest, res) => {
  const list = await prisma.enrollment.findMany({ where: { userId: req.userId }, include: { course: true } });
  res.json(
    list.map((e) => ({
      courseSlug: e.course.slug,
      title: e.course.title,
      attendedToEnd: e.attendedToEnd,
      score: e.score,
      certificateNo: e.certificateNo,
      fullName: e.fullName,
    }))
  );
});

// POST /api/catalog/courses/:slug/attended — marquer "a suivi le direct jusqu'à la fin".
// En prod, ceci sera déclenché par le serveur de direct (présence cumulée), pas par le téléphone.
// Ici l'appel est réservé aux professionnelles/admin (la formatrice valide la présence).
router.post("/courses/:slug/attendance", requireAuth, async (req: AuthRequest, res) => {
  if (!["FORMATRICE", "PROFESSIONNELLE", "COACH", "ADMIN"].includes(req.userRole || "")) {
    return res.status(403).json({ error: "Réservé aux formatrices et à l'équipe." });
  }
  const userId = String(req.body?.userId || "");
  const course = await prisma.course.findUnique({ where: { slug: req.params.slug } });
  if (!course || !userId) return res.status(400).json({ error: "Données invalides." });
  const updated = await prisma.enrollment.updateMany({
    where: { userId, courseId: course.id },
    data: { attendedToEnd: true },
  });
  res.json({ updated: updated.count });
});

// GET /api/catalog/courses/:slug/qcm — le test n'est accessible qu'aux inscrites ayant suivi le direct jusqu'à la fin
router.get("/courses/:slug/qcm", requireAuth, async (req: AuthRequest, res) => {
  const course = await prisma.course.findFirst({ where: { slug: req.params.slug, status: "PUBLIE" } });
  if (!course) return res.status(404).json({ error: "Formation introuvable." });
  const e = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.userId!, courseId: course.id } },
  });
  if (!e) return res.status(403).json({ error: "Tu dois être inscrite pour passer le test." });
  if (!e.attendedToEnd) return res.status(403).json({ error: "Le test s'ouvre après avoir suivi le direct jusqu'à la fin." });
  const qcm = JSON.parse(course.qcmJson || "[]");
  // On n'envoie jamais les bonnes réponses au téléphone : la correction est faite par le serveur.
  res.json(qcm.map((q: any) => ({ q: q.q, options: q.options })));
});

// POST /api/catalog/courses/:slug/qcm — corrige le test, délivre l'attestation si >= 75 %
router.post("/courses/:slug/qcm", requireAuth, async (req: AuthRequest, res) => {
  const course = await prisma.course.findFirst({ where: { slug: req.params.slug, status: "PUBLIE" } });
  if (!course) return res.status(404).json({ error: "Formation introuvable." });
  const e = await prisma.enrollment.findUnique({
    where: { userId_courseId: { userId: req.userId!, courseId: course.id } },
  });
  if (!e || !e.attendedToEnd) return res.status(403).json({ error: "Test non autorisé." });
  const qcm = JSON.parse(course.qcmJson || "[]") as { correct: number }[];
  const answers: unknown = req.body?.answers;
  if (!Array.isArray(answers) || answers.length !== qcm.length) {
    return res.status(400).json({ error: "Réponses incomplètes." });
  }
  const score = qcm.reduce((n, q, i) => n + (answers[i] === q.correct ? 1 : 0), 0);
  const passed = score / qcm.length >= 0.75;
  let certificateNo = e.certificateNo;
  if (passed && !certificateNo) {
    const count = await prisma.enrollment.count({ where: { certificateNo: { not: null } } });
    certificateNo = `BW-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;
  }
  await prisma.enrollment.update({ where: { id: e.id }, data: { score, certificateNo: passed ? certificateNo : e.certificateNo } });
  res.json({ score, total: qcm.length, passed, certificateNo: passed ? certificateNo : null });
});

// GET /api/catalog/courses/:slug/certificate — l'attestation PDF, remplie avec les infos de l'inscription
router.get("/courses/:slug/certificate", requireAuth, async (req: AuthRequest, res) => {
  const course = await prisma.course.findFirst({ where: { slug: req.params.slug } });
  if (!course) return res.status(404).json({ error: "Formation introuvable." });
  const e = await prisma.enrollment.findUnique({ where: { userId_courseId: { userId: req.userId!, courseId: course.id } } });
  if (!e || !e.certificateNo) return res.status(403).json({ error: "Tu n'as pas encore ton attestation : suis le direct jusqu'au bout puis réussis le test." });
  const tpl = course.certTemplateId ? await prisma.certTemplate.findUnique({ where: { id: course.certTemplateId } }) : null;
  if (!tpl) return res.status(409).json({ error: "Ton attestation est en préparation. Reviens bientôt !" });
  const pdf = await renderCertificate(tpl, {
    fullName: e.fullName || "—", birthDate: e.birthDate || "", birthPlace: e.birthPlace || "—",
    courseTitle: course.title, dateText: "Fait à Bangui, le " + frDate((course.liveEndedAt || e.createdAt).toISOString().slice(0, 10)), number: e.certificateNo,
  });
  res.json({ pdf: Buffer.from(pdf).toString("base64"), fileName: `Attestation-${e.certificateNo}.pdf` });
});

// GET /api/catalog/announcements — annonces actives pour le défilement de l'accueil
router.get("/announcements", requireAuth, async (_req, res) => {
  const now = new Date();
  const list = await prisma.announcement.findMany({ where: { active: true, OR: [{ endsAt: null }, { endsAt: { gt: now } }] }, orderBy: { createdAt: "desc" }, take: 5 });
  res.json(list.map((a) => ({ id: a.id, emoji: a.emoji, title: a.title, body: a.body, color: a.color, target: a.target })));
});

// GET /api/catalog/income — activités génératrices de revenus publiées
router.get("/income", async (_req, res) => {
  const list = await prisma.incomeActivity.findMany({
    where: { status: "PUBLIE" },
    orderBy: { capitalMinFcfa: "asc" },
  });
  res.json(list.map((a) => ({ ...a, sources: parseSources(a.sourcesJson), sourcesJson: undefined })));
});

// GET /api/catalog/professionals — annuaire des professionnelles actives et certifiées
router.get("/professionals", async (_req, res) => {
  const pros = await prisma.user.findMany({
    where: { role: { in: ["PROFESSIONNELLE", "COACH", "FORMATRICE"] }, active: true },
    select: { id: true, fullName: true, profession: true, bio: true, photoUrl: true, certified: true, available: true, role: true },
    orderBy: { fullName: "asc" },
  });
  res.json(pros);
});

export default router;
