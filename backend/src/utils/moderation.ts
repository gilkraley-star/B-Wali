import { prisma } from "../db";

// Règle de modération décidée avec la direction :
//  - dès que 10 personnes DIFFÉRENTES signalent un message, il est masqué automatiquement ;
//  - son auteure est suspendue : 72 h la 1re fois, 10 jours la 2e fois, 3 mois la 3e fois et les suivantes ;
//  - la suspension est levée seulement par un humain de l'administration (en cas d'abus de signalements).
export const REPORT_THRESHOLD = 10;
const HOUR = 3600 * 1000;
const DURATIONS_MS = [72 * HOUR, 10 * 24 * HOUR, 90 * 24 * HOUR];

export function suspensionDurationMs(previousCount: number): number {
  return DURATIONS_MS[Math.min(previousCount, DURATIONS_MS.length - 1)];
}

export function suspensionLabel(previousCount: number): string {
  return ["72 heures", "10 jours", "3 mois"][Math.min(previousCount, 2)];
}

// Renvoie le message d'erreur à montrer si la personne est suspendue, sinon null.
export async function suspensionError(userId: string): Promise<string | null> {
  const u = await prisma.user.findUnique({ where: { id: userId }, select: { suspendedUntil: true } });
  if (u?.suspendedUntil && u.suspendedUntil.getTime() > Date.now()) {
    return "Ton compte est suspendu jusqu'au " + u.suspendedUntil.toLocaleString("fr-FR", { timeZone: "Africa/Bangui" }) +
      " à cause de messages signalés. Tu peux toujours lire et suivre ton cycle.";
  }
  return null;
}

// À appeler après chaque nouveau signalement. Masque et suspend si le seuil est atteint.
export async function applyThreshold(target: { postId?: string | null; commentId?: string | null }) {
  const where = target.commentId ? { commentId: target.commentId } : { postId: target.postId! };
  const distinct = await prisma.report.groupBy({ by: ["reporterId"], where });
  if (distinct.length < REPORT_THRESHOLD) return { hidden: false };

  let authorId: string | null = null;
  if (target.commentId) {
    const c = await prisma.forumComment.findUnique({ where: { id: target.commentId } });
    if (!c || c.isHidden) return { hidden: false }; // déjà traité : pas de seconde sanction pour le même message
    await prisma.forumComment.update({ where: { id: c.id }, data: { isHidden: true } });
    authorId = c.authorId;
  } else {
    const p = await prisma.forumPost.findUnique({ where: { id: target.postId! } });
    if (!p || p.isHidden) return { hidden: false };
    await prisma.forumPost.update({ where: { id: p.id }, data: { isHidden: true } });
    authorId = p.authorId;
  }
  const author = await prisma.user.findUnique({ where: { id: authorId } });
  if (!author) return { hidden: true };
  // Les comptes de l'équipe (admin, modératrices, professionnelles) ne sont pas suspendus automatiquement :
  // on prévient l'administration à la place (le signalement reste ouvert dans la liste).
  if (author.role !== "UTILISATRICE") return { hidden: true };
  const until = new Date(Date.now() + suspensionDurationMs(author.suspensionCount));
  await prisma.user.update({ where: { id: author.id }, data: { suspendedUntil: until, suspensionCount: { increment: 1 } } });
  await prisma.auditLog.create({
    data: { actorId: "system", action: "SUSPENSION_AUTO", target: author.pseudonyme + " · " + suspensionLabel(author.suspensionCount) + " · jusqu'au " + until.toISOString() },
  }).catch(() => {});
  return { hidden: true, suspendedUntil: until };
}
