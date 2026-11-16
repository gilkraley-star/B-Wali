// Pays où Wali est proposée. « ready » : contenus locaux (centres de santé, numéros d'urgence) vérifiés et renseignés.
export const COUNTRY_CODES = ["CF", "CM", "TD", "CD", "CG", "GA", "GQ", "BI", "RW"] as const;
export function normCountry(c?: string | null): string {
  const u = (c || "CF").toUpperCase();
  return (COUNTRY_CODES as readonly string[]).includes(u) ? u : "CF";
}
