// Configuration par pays. Une seule appli : le pays est choisi à l'inscription et adapte les urgences, les centres de santé et les annonces.
// `ready: false` = contenus locaux pas encore vérifiés : l'appli le dit clairement et ne montre AUCUN numéro inventé.
export interface Centre { nom: string; type: string; ville: string }
export interface Country { code: string; name: string; flag: string; ready: boolean; emergency: { label: string; number: string }[]; centres: Centre[] }

export const COUNTRIES: Country[] = [
  {
    code: "CF", name: "Centrafrique", flag: "🇨🇫", ready: true,
    // ⚠️ numéros à confirmer avant le lancement auprès des autorités locales
    emergency: [{ label: "Police", number: "117" }, { label: "Ambulance / urgence médicale", number: "1220" }, { label: "Pompiers", number: "118" }, { label: "Autre numéro médical", number: "114" }],
    centres: [
      { nom: "Hôpital Général de Bangui", type: "Hôpital public · soins généraux", ville: "Bangui" },
      { nom: "Hôpital Communautaire de Bangui", type: "Urgences · traumatologie", ville: "Bangui" },
      { nom: "Hôpital de l'Amitié", type: "Hôpital public", ville: "Bangui" },
      { nom: "Complexe Pédiatrique de Bangui", type: "Soins pour enfants et adolescentes", ville: "Bangui" },
      { nom: "Centre Hospitalier Universitaire de Bangui", type: "Soins spécialisés, imagerie", ville: "Bangui" },
    ],
  },
  ...([["CM", "Cameroun", "🇨🇲"], ["TD", "Tchad", "🇹🇩"], ["CD", "RD Congo", "🇨🇩"], ["CG", "Congo-Brazzaville", "🇨🇬"], ["GA", "Gabon", "🇬🇦"], ["GQ", "Guinée équatoriale", "🇬🇶"], ["BI", "Burundi", "🇧🇮"], ["RW", "Rwanda", "🇷🇼"]] as const).map(([code, name, flag]): Country => ({ code, name, flag, ready: false, emergency: [], centres: [] })),
];
export const DEFAULT_COUNTRY = "CF";
export function getCountry(code?: string | null): Country { return COUNTRIES.find((c) => c.code === (code || DEFAULT_COUNTRY)) || COUNTRIES[0]; }
