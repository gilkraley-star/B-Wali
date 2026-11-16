import { z } from "zod";
import crypto from "crypto";
import { sourcesSchema } from "./sources";

export type ContentType = "articles" | "courses" | "income";
export const CONTENT_TYPES: ContentType[] = ["articles", "courses", "income"];

export function slugify(text: string): string {
  const base = text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `${base || "contenu"}-${crypto.randomBytes(3).toString("hex")}`;
}

// --- Schémas de saisie (utilisés par l'admin ET par les professionnelles qui soumettent) ---

export const articleInput = z.object({
  titleFr: z.string().min(4).max(200),
  titleSg: z.string().max(200).optional(),
  categorySlug: z.string().min(1),
  bodyFr: z.string().min(40).max(20000),
  bodySg: z.string().max(20000).optional(),
  sources: sourcesSchema.min(1, "Au moins une source est obligatoire pour un contenu de santé."),
});

const qcmSchema = z
  .array(
    z.object({
      q: z.string().min(3),
      options: z.array(z.string().min(1)).min(2).max(5),
      correct: z.number().int().min(0),
    })
  )
  .max(20)
  .refine((arr) => arr.every((x) => x.correct < x.options.length), "Une bonne réponse dépasse le nombre d'options.");

export const courseInput = z.object({
  title: z.string().min(4).max(200),
  summary: z.string().min(10).max(500),
  icon: z.string().max(8).optional(),
  partner: z.string().max(200).optional(),
  durationMin: z.number().int().min(10).max(600),
  format: z.enum(["DIRECT", "REPLAY"]).optional(),
  startsAt: z.string().datetime().optional(),
  outlineMd: z.string().min(20).max(10000),
  qcm: qcmSchema.optional(),
  sources: sourcesSchema,
});

export const incomeInput = z.object({
  title: z.string().min(4).max(200),
  icon: z.string().max(8).optional(),
  capitalMinFcfa: z.number().int().min(0).max(100000000),
  summary: z.string().min(10).max(500),
  needsMd: z.string().min(10).max(5000),
  stepsMd: z.string().min(10).max(5000),
  risksMd: z.string().min(10).max(5000),
  courseSlug: z.string().optional(),
  sources: sourcesSchema.min(1, "Au moins une source est obligatoire."),
});
