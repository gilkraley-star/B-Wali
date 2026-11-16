import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";

const router = Router();
router.use(requireAuth);

const periodSchema = z.object({
  startDate: z.string(), // ISO date
  endDate: z.string().optional(),
  notes: z.string().optional(),
});

// POST /api/cycle/periods — enregistrer des règles
router.post("/periods", async (req: AuthRequest, res) => {
  const parsed = periodSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const period = await prisma.cyclePeriod.create({
    data: {
      userId: req.userId!,
      startDate: new Date(parsed.data.startDate),
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : null,
      notes: parsed.data.notes,
    },
  });
  res.status(201).json(period);
});

// GET /api/cycle/periods — historique
router.get("/periods", async (req: AuthRequest, res) => {
  const periods = await prisma.cyclePeriod.findMany({
    where: { userId: req.userId },
    orderBy: { startDate: "desc" },
  });
  res.json(periods);
});

// PATCH /api/cycle/periods/:id
router.patch("/periods/:id", async (req: AuthRequest, res) => {
  const existing = await prisma.cyclePeriod.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.userId) {
    return res.status(404).json({ error: "Introuvable." });
  }
  const parsed = periodSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const updated = await prisma.cyclePeriod.update({
    where: { id: req.params.id },
    data: {
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
      endDate: parsed.data.endDate ? new Date(parsed.data.endDate) : undefined,
      notes: parsed.data.notes,
    },
  });
  res.json(updated);
});

// DELETE /api/cycle/periods/:id
router.delete("/periods/:id", async (req: AuthRequest, res) => {
  const existing = await prisma.cyclePeriod.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.userId) {
    return res.status(404).json({ error: "Introuvable." });
  }
  await prisma.cyclePeriod.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// GET /api/cycle/estimate — estimation du prochain cycle
// IMPORTANT : indication approximative uniquement, jamais une méthode contraceptive
// (cf. section 5.1 du dossier projet — limite essentielle explicitement posée).
router.get("/estimate", async (req: AuthRequest, res) => {
  const periods = await prisma.cyclePeriod.findMany({
    where: { userId: req.userId },
    orderBy: { startDate: "desc" },
    take: 6,
  });

  if (periods.length < 2) {
    return res.json({
      averageCycleLength: null,
      nextEstimatedStart: null,
      disclaimer:
        "Pas assez de données pour une estimation. Ceci restera toujours une indication approximative, jamais une méthode contraceptive.",
    });
  }

  const diffs: number[] = [];
  for (let i = 0; i < periods.length - 1; i++) {
    const diff =
      (periods[i].startDate.getTime() - periods[i + 1].startDate.getTime()) / (1000 * 60 * 60 * 24);
    diffs.push(diff);
  }
  const averageCycleLength = Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
  const lastStart = periods[0].startDate;
  const nextEstimatedStart = new Date(lastStart.getTime() + averageCycleLength * 24 * 60 * 60 * 1000);

  res.json({
    averageCycleLength,
    nextEstimatedStart,
    disclaimer:
      "Indication approximative basée sur vos cycles précédents. Ne remplace pas un avis médical et ne doit jamais être utilisée comme méthode de contraception.",
  });
});

// --- Symptômes ---

const symptomSchema = z.object({
  date: z.string(),
  type: z.string(), // douleur | fatigue | humeur | autre
  intensity: z.number().min(1).max(5).default(1),
  note: z.string().optional(),
});

// POST /api/cycle/symptoms
router.post("/symptoms", async (req: AuthRequest, res) => {
  const parsed = symptomSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const log = await prisma.symptomLog.create({
    data: {
      userId: req.userId!,
      date: new Date(parsed.data.date),
      type: parsed.data.type,
      intensity: parsed.data.intensity,
      note: parsed.data.note,
    },
  });
  res.status(201).json(log);
});

// GET /api/cycle/symptoms
router.get("/symptoms", async (req: AuthRequest, res) => {
  const logs = await prisma.symptomLog.findMany({
    where: { userId: req.userId },
    orderBy: { date: "desc" },
  });
  res.json(logs);
});

// DELETE /api/cycle/symptoms/:id
router.delete("/symptoms/:id", async (req: AuthRequest, res) => {
  const existing = await prisma.symptomLog.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.userId) return res.status(404).json({ error: "Introuvable." });
  await prisma.symptomLog.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

// --- Rappels ---

const reminderSchema = z.object({
  label: z.string().min(1),
  daysBefore: z.number().min(0).max(14).default(2),
  active: z.boolean().optional(),
});

// POST /api/cycle/reminders
router.post("/reminders", async (req: AuthRequest, res) => {
  const parsed = reminderSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const reminder = await prisma.reminder.create({
    data: { userId: req.userId!, ...parsed.data },
  });
  res.status(201).json(reminder);
});

// GET /api/cycle/reminders
router.get("/reminders", async (req: AuthRequest, res) => {
  const reminders = await prisma.reminder.findMany({ where: { userId: req.userId } });
  res.json(reminders);
});

// PATCH /api/cycle/reminders/:id
router.patch("/reminders/:id", async (req: AuthRequest, res) => {
  const existing = await prisma.reminder.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.userId) return res.status(404).json({ error: "Introuvable." });
  const parsed = reminderSchema.partial().safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const updated = await prisma.reminder.update({ where: { id: req.params.id }, data: parsed.data });
  res.json(updated);
});

// DELETE /api/cycle/reminders/:id
router.delete("/reminders/:id", async (req: AuthRequest, res) => {
  const existing = await prisma.reminder.findUnique({ where: { id: req.params.id } });
  if (!existing || existing.userId !== req.userId) return res.status(404).json({ error: "Introuvable." });
  await prisma.reminder.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
