import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
if (process.env.NODE_ENV === "production" && JWT_SECRET === "dev-secret-change-me") {
  throw new Error("JWT_SECRET doit être défini en production.");
}

export interface TokenPayload {
  userId: string;
  role: string;
}

export function signToken(payload: TokenPayload): string {
  // Les filles restent connectées jusqu'à ce qu'elles se déconnectent elles-mêmes (10 ans).
  // Les comptes d'équipe (admin, professionnelles, modératrices) gardent 30 jours, par prudence.
  return jwt.sign(payload, JWT_SECRET, { expiresIn: payload.role === "UTILISATRICE" ? "3650d" : "30d" });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, JWT_SECRET) as TokenPayload;
}
