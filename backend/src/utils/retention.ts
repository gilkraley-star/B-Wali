import { prisma } from "../db";
import { deleteMedia } from "./media";

// Règle des discussions : on garde au plus MAX_MESSAGES messages par discussion ;
// au-delà, les messages de plus de RETENTION_HOURS (48 h) disparaissent tout seuls,
// avec leurs photos et vidéos. Réglable par variables d'environnement.
export const MAX_MESSAGES = Number(process.env.FORUM_MAX_MESSAGES || 50);
export const RETENTION_HOURS = Number(process.env.FORUM_RETENTION_HOURS || 48);

/** Supprime les vieux messages des discussions qui dépassent la limite. Retourne le nombre supprimé. */
export async function purgeOldMessages(now = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - RETENTION_HOURS * 3600 * 1000);
  const groups = await prisma.forumComment.groupBy({ by: ["postId"], _count: { _all: true } });
  let removed = 0;
  for (const g of groups) {
    if (g._count._all <= MAX_MESSAGES) continue;
    const old = await prisma.forumComment.findMany({
      where: { postId: g.postId, createdAt: { lt: cutoff } },
      select: { id: true, mediaUrl: true },
    });
    if (!old.length) continue;
    old.forEach((c: { id: string; mediaUrl: string | null }) => deleteMedia(c.mediaUrl));
    // Les signalements liés à ces messages sont supprimés avec eux.
    await prisma.report.deleteMany({ where: { commentId: { in: old.map((c: { id: string }) => c.id) } } });
    const res = await prisma.forumComment.deleteMany({ where: { id: { in: old.map((c: { id: string }) => c.id) } } });
    removed += res.count;
  }
  return removed;
}

export function startRetentionJob() {
  const run = () => purgeOldMessages().catch((e) => console.error("Nettoyage des messages :", e));
  run();
  setInterval(run, 60 * 60 * 1000).unref(); // toutes les heures
}
