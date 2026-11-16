// Âge calculé à partir de la date de naissance (l'utilisatrice ne choisit plus de « tranche d'âge »).
export type AgeBracket = "ADOLESCENTE" | "JEUNE_FEMME" | "FEMME_ADULTE";
export const MIN_AGE = 10;

export function ageFromBirthDate(birth: Date, now = new Date()): number {
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age -= 1;
  return age;
}

export function bracketFromAge(age: number): AgeBracket {
  if (age < 18) return "ADOLESCENTE";
  if (age < 26) return "JEUNE_FEMME";
  return "FEMME_ADULTE";
}

// Lit "AAAA-MM-JJ" et vérifie que la date existe vraiment (pas de 31 février).
export function parseBirthDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const y = Number(m[1]), mo = Number(m[2]), d = Number(m[3]);
  const date = new Date(Date.UTC(y, mo - 1, d, 12));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) return null;
  return date;
}
