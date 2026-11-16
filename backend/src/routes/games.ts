import { Router } from "express";
import { z } from "zod";
import { prisma } from "../db";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { countRight, MAX_LEVEL, PASS_MARK, QuizKind, STARS_PER_RIGHT } from "../games/quiz";
import { buildPuzzle, MM_MAX_SERIES, MM_STARS } from "../games/motsMeles";

const router = Router();
router.use(requireAuth);

const BOT_STARS = { win: 30, loss: 10 } as const; // Awalé et Ludo contre le téléphone
const BOT_DAILY_CAP = 90; // les parties contre le téléphone ne peuvent pas rapporter plus par jour (anti-triche simple)

async function award(userId: string, game: string, refKey: string, stars: number): Promise<number> {
  if (stars <= 0) return 0;
  try {
    await prisma.starEvent.create({ data: { userId, game, refKey, stars } });
    return stars;
  } catch {
    return 0; // déjà donné
  }
}

async function unlockedLevel(userId: string, game: string): Promise<number> {
  const best = await prisma.gameLevel.findFirst({ where: { userId, game, passed: true }, orderBy: { level: "desc" } });
  return (best?.level ?? 0) + 1; // on peut jouer le niveau suivant celui déjà réussi
}

// GET /api/games/me — étoiles totales, étoiles de la semaine, niveaux ouverts
router.get("/me", async (req: AuthRequest, res) => {
  const uid = req.userId!;
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const [total, week] = await Promise.all([
    prisma.starEvent.aggregate({ where: { userId: uid }, _sum: { stars: true } }),
    prisma.starEvent.aggregate({ where: { userId: uid, createdAt: { gte: weekAgo } }, _sum: { stars: true } }),
  ]);
  const games = ["quiz-culture", "quiz-english", "mm-fr", "mm-en"];
  const open: Record<string, number> = {};
  for (const g of games) open[g] = await unlockedLevel(uid, g);
  res.json({ totalStars: total._sum.stars ?? 0, weekStars: week._sum.stars ?? 0, open });
});

// POST /api/games/quiz — la joueuse envoie ses 5 réponses ; le serveur corrige.
const quizSchema = z.object({
  kind: z.enum(["culture", "english"]),
  level: z.number().int().min(1).max(MAX_LEVEL),
  answers: z.array(z.boolean()).length(5),
});
router.post("/quiz", async (req: AuthRequest, res) => {
  const parsed = quizSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides." });
  const { kind, level, answers } = parsed.data;
  const uid = req.userId!;
  const game = "quiz-" + kind;
  if (level > (await unlockedLevel(uid, game))) return res.status(403).json({ error: "Ce niveau n'est pas encore ouvert." });

  const right = countRight(kind as QuizKind, level, answers);
  const passed = right >= PASS_MARK;
  const prev = await prisma.gameLevel.findUnique({ where: { userId_game_level: { userId: uid, game, level } } });
  const prevBest = prev?.bestRight ?? 0;
  const newBest = Math.max(prevBest, right);
  await prisma.gameLevel.upsert({
    where: { userId_game_level: { userId: uid, game, level } },
    create: { userId: uid, game, level, bestRight: newBest, passed },
    update: { bestRight: newBest, passed: (prev?.passed ?? false) || passed },
  });
  // Étoiles seulement pour les bonnes réponses « nouvelles » : on ne peut pas refaire le même niveau pour en gagner plus.
  let earned = 0;
  for (let k = prevBest + 1; k <= newBest; k++) earned += await award(uid, game, "L" + level + "#r" + k, STARS_PER_RIGHT);
  res.json({ right, passed, earned, nextOpen: await unlockedLevel(uid, game) });
});

// POST /api/games/mots-meles — le serveur reconstruit la série et vérifie que tous les mots ont été trouvés.
const mmSchema = z.object({
  lang: z.enum(["fr", "en"]),
  serie: z.number().int().min(1).max(MM_MAX_SERIES),
  found: z.array(z.string().max(20)).max(20),
});
router.post("/mots-meles", async (req: AuthRequest, res) => {
  const parsed = mmSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides." });
  const { lang, serie, found } = parsed.data;
  const uid = req.userId!;
  const game = "mm-" + lang;
  if (serie > (await unlockedLevel(uid, game))) return res.status(403).json({ error: "Cette série n'est pas encore ouverte." });
  const puzzle = buildPuzzle(serie, lang);
  const ok = puzzle.words.every((w) => found.includes(w.word));
  if (!ok) return res.status(200).json({ passed: false, earned: 0 });
  await prisma.gameLevel.upsert({
    where: { userId_game_level: { userId: uid, game, level: serie } },
    create: { userId: uid, game, level: serie, bestRight: puzzle.words.length, passed: true },
    update: { passed: true, bestRight: puzzle.words.length },
  });
  const earned = await award(uid, game, "S" + serie, MM_STARS);
  res.json({ passed: true, earned, nextOpen: await unlockedLevel(uid, game) });
});

// POST /api/games/bot — résultat d'une partie contre le téléphone (Awalé, Ludo). Un identifiant unique par partie.
const botSchema = z.object({ game: z.enum(["awale", "ludo"]), result: z.enum(["win", "loss"]), clientId: z.string().min(8).max(64) });
router.post("/bot", async (req: AuthRequest, res) => {
  const parsed = botSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Données invalides." });
  const { game, result, clientId } = parsed.data;
  const uid = req.userId!;
  const dayStart = new Date(); dayStart.setHours(0, 0, 0, 0);
  const today = await prisma.starEvent.aggregate({ where: { userId: uid, game: { in: ["awale", "ludo"] }, createdAt: { gte: dayStart } }, _sum: { stars: true } });
  const left = BOT_DAILY_CAP - (today._sum.stars ?? 0);
  const earned = left > 0 ? await award(uid, game, clientId, Math.min(BOT_STARS[result], left)) : 0;
  res.json({ earned, dailyCapReached: left <= 0 });
});

// GET /api/games/leaderboard — classement de la semaine (pseudonymes seulement)
router.get("/leaderboard", async (req: AuthRequest, res) => {
  const weekAgo = new Date(Date.now() - 7 * 24 * 3600 * 1000);
  const rows = await prisma.starEvent.groupBy({
    by: ["userId"], where: { createdAt: { gte: weekAgo } }, _sum: { stars: true }, orderBy: { _sum: { stars: "desc" } }, take: 20,
  });
  const users = await prisma.user.findMany({ where: { id: { in: rows.map((r: any) => r.userId) } }, select: { id: true, pseudonyme: true } });
  const top = rows.map((r: any, i: number) => ({ rank: i + 1, pseudonyme: users.find((u: any) => u.id === r.userId)?.pseudonyme ?? "—", stars: r._sum.stars ?? 0, me: r.userId === req.userId }));
  res.json({ top });
});

export default router;
