import { Router } from "express";
import { z } from "zod";
import { requireAuth, AuthRequest } from "../middleware/auth";

// Conseillère IA : le serveur appelle OpenAI (clé secrète dans .env, jamais dans l'appli).
const router = Router();
const KEY = process.env.OPENAI_API_KEY || "";
const MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const DAILY_MAX = Number(process.env.ASSISTANT_DAILY_MAX || 20); // questions par fille et par jour
const GLOBAL_DAILY_MAX = Number(process.env.ASSISTANT_GLOBAL_DAILY_MAX || 1500); // plafond de dépense

const SYSTEM = `Tu es la conseillère de Bê Wali, une application pour adolescentes (dès 10 ans), jeunes femmes et jeunes mères en République centrafricaine.
Règles :
- Réponds en français très simple (ou en anglais si on t'écrit en anglais), en 4 phrases maximum, avec un ton doux, chaleureux et sans jugement.
- Tu parles de santé du corps, des règles, de la puberté, de la grossesse, des bébés, de l'hygiène, du consentement, des émotions, de l'école et de l'argent (petits commerces).
- Tu n'es PAS médecin : jamais de diagnostic, jamais de nom de médicament ni de dose. Pour toute douleur forte, saignement, fièvre, grossesse, violence ou tristesse profonde, dis de parler vite à une professionnelle de santé ou une adulte de confiance, et propose le bouton « Écrire à une de nos professionnelles ».
- Si la fille semble subir une violence ou un abus, rassure-la : ce n'est pas sa faute, et invite-la à en parler à une adulte de confiance ou à un centre de santé.
- Pas de contenu sexuel explicite. Si on te demande autre chose (devoirs d'un autre sujet, politique, etc.), redirige gentiment.
- Ne demande jamais le nom, l'adresse, le numéro ou la photo de la fille.`;

const DANGER = /(suicid|me tuer|mourir|veux mourir|viol|violée|abus|battue|frappe|saigne beaucoup|hémorragie|je suis enceinte et|empoisonn)/i;
const DANGER_REPLY = "Je suis désolée que tu vives ça. Tu n'es pas seule et ce n'est pas ta faute. Parle tout de suite à une adulte de confiance, ou va dans un centre de santé. Tu peux aussi appuyer sur « Écrire à une de nos professionnelles » ou sur le bouton Urgence de l'application. 💛";

const perUser = new Map<string, { day: string; n: number }>();
let globalDay = { day: "", n: 0 };
const today = () => new Date().toISOString().slice(0, 10);

const body = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(600) })).min(1).max(10),
});

router.post("/ask", requireAuth, async (req: AuthRequest, res) => {
  const p = body.safeParse(req.body);
  if (!p.success) return res.status(400).json({ error: "Message invalide." });
  const last = p.data.messages[p.data.messages.length - 1];
  if (last.role !== "user") return res.status(400).json({ error: "Message invalide." });

  if (DANGER.test(last.content)) return res.json({ reply: DANGER_REPLY, urgent: true });
  if (!KEY) return res.status(503).json({ error: "La conseillère n'est pas encore activée sur le serveur." });

  const d = today();
  const u = perUser.get(req.userId!) ?? { day: d, n: 0 };
  if (u.day !== d) { u.day = d; u.n = 0; }
  if (globalDay.day !== d) globalDay = { day: d, n: 0 };
  if (u.n >= DAILY_MAX) return res.status(429).json({ error: "Tu as posé beaucoup de questions aujourd'hui. Reviens demain 💛 ou écris à une de nos professionnelles." });
  if (globalDay.n >= GLOBAL_DAILY_MAX) return res.status(503).json({ error: "La conseillère se repose pour aujourd'hui. Réessaie demain." });
  u.n++; globalDay.n++; perUser.set(req.userId!, u);

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${KEY}` },
      body: JSON.stringify({ model: MODEL, max_tokens: 300, temperature: 0.5, messages: [{ role: "system", content: SYSTEM }, ...p.data.messages] }),
      signal: AbortSignal.timeout(25000),
    });
    if (!r.ok) return res.status(502).json({ error: "La conseillère n'est pas disponible pour le moment." });
    const j: any = await r.json();
    const reply = String(j?.choices?.[0]?.message?.content || "").trim();
    if (!reply) return res.status(502).json({ error: "Pas de réponse, réessaie." });
    res.json({ reply });
  } catch {
    res.status(502).json({ error: "La conseillère n'est pas disponible pour le moment." });
  }
});

export default router;
