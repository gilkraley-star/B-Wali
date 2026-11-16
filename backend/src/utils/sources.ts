import { z } from "zod";

export const sourceSchema = z.object({
  title: z.string().min(2).max(300),
  org: z.string().min(1).max(120),
  url: z.string().url().refine((u) => /^https?:\/\//.test(u), "L'adresse doit commencer par http(s)://"),
});
export const sourcesSchema = z.array(sourceSchema).max(15);

export function parseSources(json: string | null | undefined) {
  try {
    const v = JSON.parse(json || "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
