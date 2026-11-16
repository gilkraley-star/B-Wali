// Numéros de téléphone : on les range tous de la même façon (+236XXXXXXXX pour la Centrafrique)
// pour qu'un même numéro écrit "70 12 34 56", "0070123456" ou "+236 70 12 34 56" soit reconnu.
export function normalizePhone(raw: string): string | null {
  let s = (raw || "").trim().replace(/[\s.\-()]/g, "");
  if (!s) return null;
  if (s.startsWith("00")) s = "+" + s.slice(2);
  if (s.startsWith("+")) {
    const digits = s.slice(1);
    return /^\d{8,15}$/.test(digits) ? "+" + digits : null;
  }
  if (!/^\d+$/.test(s)) return null;
  if (s.startsWith("236") && s.length === 11) return "+" + s; // 236 + 8 chiffres
  if (s.length === 8) return "+236" + s; // numéro centrafricain local, 8 chiffres
  return null;
}
export const looksLikeEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
