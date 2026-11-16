import { Request, Response, NextFunction } from "express";
import { verifyToken } from "../utils/jwt";
import { prisma } from "../db";

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

/**
 * Exige un utilisateur connecté. Le rôle et l'état du compte sont relus en base à chaque requête :
 * si l'admin désactive un compte ou change un rôle, l'effet est immédiat (pas besoin d'attendre
 * l'expiration du jeton).
 */
export async function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Authentification requise." });
  }
  try {
    const payload = verifyToken(header.slice("Bearer ".length));
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, active: true },
    });
    if (!user || !user.active) {
      return res.status(401).json({ error: "Compte introuvable ou désactivé." });
    }
    req.userId = user.id;
    req.userRole = user.role;
    next();
  } catch {
    return res.status(401).json({ error: "Session invalide ou expirée." });
  }
}

/** Exige un rôle de modération ou admin (pour les routes de modération du forum). */
export function requireModerator(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== "MODERATRICE" && req.userRole !== "ADMIN") {
    return res.status(403).json({ error: "Accès réservé à la modération." });
  }
  next();
}

/** Exige l'un des rôles indiqués. */
export function requireRole(...roles: string[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      return res.status(403).json({ error: "Accès non autorisé pour ce rôle." });
    }
    next();
  };
}

export const PRO_ROLES = ["PROFESSIONNELLE", "COACH", "FORMATRICE"];
