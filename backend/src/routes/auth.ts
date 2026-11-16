import { normCountry } from "../utils/countries";
import { ageFromBirthDate, bracketFromAge, MIN_AGE, parseBirthDate } from "../utils/age";
import { Router } from "express";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../db";
import { signToken } from "../utils/jwt";
import { requireAuth, AuthRequest } from "../middleware/auth";
import { deletePhoto, savePhotoFromDataUrl } from "../utils/uploads";
import { looksLikeEmail, normalizePhone } from "../utils/phone";

const router = Router();

const signupSchema = z.object({
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  pseudonyme: z.string().min(2).max(30),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de naissance : jour, mois et année sont obligatoires."),
  acceptTerms: z.literal(true, { errorMap: () => ({ message: "Tu dois lire et accepter les conditions d'utilisation." }) }),
  participatesForum: z.boolean().optional(),
  country: z.string().length(2).optional(),
  photo: z.string().min(100, "Ajoute ta photo pour continuer."),
});

// Quand une fille fête ses 18 ou 26 ans, sa tranche d'âge change toute seule (calculée sur la date de naissance).
async function refreshBracket(user: { id: string; birthDate: Date | null; ageBracket: string }) {
  if (!user.birthDate) return;
  const b = bracketFromAge(ageFromBirthDate(user.birthDate));
  if (b !== user.ageBracket) {
    await prisma.user.update({ where: { id: user.id }, data: { ageBracket: b } });
    user.ageBracket = b;
  }
}

// POST /api/auth/signup
router.post("/signup", async (req, res) => {
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0].message });
  }
  const { password, pseudonyme, birthDate: birthDateStr, participatesForum } = parsed.data;
  const rawEmail = (parsed.data.email || "").trim().toLowerCase();
  const rawPhone = (parsed.data.phone || "").trim();
  if (!rawEmail && !rawPhone) return res.status(400).json({ error: "Écris ton numéro de téléphone (ou ton e-mail)." });
  const email = rawEmail || null;
  if (email && !looksLikeEmail(email)) return res.status(400).json({ error: "Cet e-mail n'est pas écrit correctement." });
  const phone = rawPhone ? normalizePhone(rawPhone) : null;
  if (rawPhone && !phone) return res.status(400).json({ error: "Ce numéro n'est pas correct. Écris les 8 chiffres, par exemple 70 12 34 56." });

  const birthDate = parseBirthDate(birthDateStr);
  if (!birthDate) return res.status(400).json({ error: "Cette date de naissance n'existe pas. Vérifie le jour, le mois et l'année." });
  const age = ageFromBirthDate(birthDate);
  if (age < 0 || age > 110) return res.status(400).json({ error: "Vérifie ta date de naissance." });
  if (age < MIN_AGE) {
    return res.status(400).json({ error: "Wali est réservée aux filles et aux femmes à partir de " + MIN_AGE + " ans." });
  }
  const ageBracket = bracketFromAge(age);

  if (email && (await prisma.user.findUnique({ where: { email } }))) {
    return res.status(409).json({ error: "Un compte existe déjà avec cet e-mail." });
  }
  if (phone && (await prisma.user.findUnique({ where: { phone } }))) {
    return res.status(409).json({ error: "Un compte existe déjà avec ce numéro." });
  }
  const existingPseudo = await prisma.user.findUnique({ where: { pseudonyme } });
  if (existingPseudo) {
    return res.status(409).json({ error: "Ce pseudonyme est déjà utilisé, choisissez-en un autre." });
  }

  let photoUrl: string;
  try { photoUrl = savePhotoFromDataUrl(parsed.data.photo); } catch (e: any) { return res.status(400).json({ error: e.message }); }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      photoUrl,
      country: normCountry(parsed.data.country),
      email,
      phone,
      passwordHash,
      pseudonyme,
      ageBracket,
      birthDate,
      termsAcceptedAt: new Date(),
      participatesForum: participatesForum ?? true,
    },
  });

  const token = signToken({ userId: user.id, role: user.role });
  res.status(201).json({
    token,
    user: { id: user.id, pseudonyme: user.pseudonyme, ageBracket: user.ageBracket, role: user.role, country: user.country },
  });
});

// On peut se connecter avec son numéro de téléphone ou son e-mail (champ "identifier" ; "email" reste accepté).
const loginSchema = z.object({
  identifier: z.string().optional(),
  email: z.string().optional(),
  password: z.string(),
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Identifiants invalides." });
  }
  const { password } = parsed.data;
  const id = (parsed.data.identifier || parsed.data.email || "").trim();
  const BAD = "Numéro (ou e-mail) ou mot de passe incorrect.";
  if (!id) return res.status(401).json({ error: BAD });
  let user = null;
  if (looksLikeEmail(id)) user = await prisma.user.findUnique({ where: { email: id.toLowerCase() } });
  else {
    const ph = normalizePhone(id);
    if (ph) user = await prisma.user.findUnique({ where: { phone: ph } });
  }
  if (!user) return res.status(401).json({ error: BAD });
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) return res.status(401).json({ error: BAD });
  if (!user.active) {
    return res.status(403).json({ error: "Ce compte est désactivé. Contacte l'équipe Wali." });
  }

  await refreshBracket(user);

  const token = signToken({ userId: user.id, role: user.role });
  res.json({
    token,
    user: {
      id: user.id,
      pseudonyme: user.pseudonyme,
      ageBracket: user.ageBracket,
      role: user.role,
      country: user.country,
      fullName: user.fullName,
      profession: user.profession,
      photoUrl: user.photoUrl,
      mustChangePassword: user.mustChangePassword,
    },
  });
});

// GET /api/auth/me
router.get("/me", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: "Utilisatrice introuvable." });
  await refreshBracket(user);
  res.json({
    id: user.id,
    email: user.email,
    phone: user.phone,
    pseudonyme: user.pseudonyme,
    ageBracket: user.ageBracket,
    role: user.role,
    country: user.country,
    fullName: user.fullName,
    profession: user.profession,
    photoUrl: user.photoUrl,
    mustChangePassword: user.mustChangePassword,
    participatesForum: user.participatesForum,
    anonymousDefault: user.anonymousDefault,
    birthDate: user.birthDate ? user.birthDate.toISOString().slice(0, 10) : null,
  });
});

// PATCH /api/auth/privacy — gérer les paramètres de confidentialité (section 7)
const privacySchema = z.object({
  participatesForum: z.boolean().optional(),
  anonymousDefault: z.boolean().optional(),
  pseudonyme: z.string().min(2).max(30).optional(),
  dataRetentionAcknowledged: z.boolean().optional(),
});

router.patch("/privacy", requireAuth, async (req: AuthRequest, res) => {
  const parsed = privacySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });

  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: parsed.data,
  });
  res.json({
    pseudonyme: updated.pseudonyme,
    participatesForum: updated.participatesForum,
    anonymousDefault: updated.anonymousDefault,
    dataRetentionAcknowledged: updated.dataRetentionAcknowledged,
  });
});

// POST /api/auth/change-password — obligatoire à la première connexion d'un compte créé par l'admin
const changePwSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
});

router.post("/change-password", requireAuth, async (req: AuthRequest, res) => {
  const parsed = changePwSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0].message });
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: "Compte introuvable." });
  const ok = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!ok) return res.status(401).json({ error: "Mot de passe actuel incorrect." });
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await bcrypt.hash(parsed.data.newPassword, 10), mustChangePassword: false },
  });
  res.status(204).send();
});

// DELETE /api/auth/account — suppression du compte et de ses données (section 7)
router.delete("/account", requireAuth, async (req: AuthRequest, res) => {
  const me = await prisma.user.findUnique({ where: { id: req.userId } });
  deletePhoto(me?.photoUrl);
  await prisma.user.delete({ where: { id: req.userId } });
  res.status(204).send();
});

// GET /api/auth/export — export des données personnelles (portabilité)
router.get("/export", requireAuth, async (req: AuthRequest, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { periods: true, symptoms: true, reminders: true, posts: true, comments: true, savedArticles: true },
  });
  if (!user) return res.status(404).json({ error: "Introuvable." });
  const { passwordHash, ...safeUser } = user;
  res.json(safeUser);
});

export default router;
