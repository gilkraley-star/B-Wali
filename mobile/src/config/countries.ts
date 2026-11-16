// Configuration par pays. Une seule appli : le pays est choisi à l'inscription et adapte les urgences, les centres de santé et les annonces.
// `ready: false` = contenus locaux pas encore vérifiés : l'appli le dit clairement et ne montre AUCUN numéro inventé.
export interface Centre { nom: string; type: string; ville: string; quartier?: string; lat?: number; lng?: number }
export interface Country { code: string; name: string; flag: string; ready: boolean; emergency: { label: string; number: string }[]; centres: Centre[] }

export const COUNTRIES: Country[] = [
  {
    code: "CF", name: "Centrafrique", flag: "🇨🇫", ready: true,
    // ⚠️ numéros à confirmer avant le lancement auprès des autorités locales
    emergency: [{ label: "Police", number: "117" }, { label: "Ambulance / urgence médicale", number: "1220" }, { label: "Pompiers", number: "118" }, { label: "Autre numéro médical", number: "114" }],
    // Établissements repérés sur Google Maps (Bangui). Noms et positions seulement : numéros et horaires à confirmer avec chaque structure.
    centres: [
      { nom: "Hôpital Général de Bangui", type: "Hôpital public · soins généraux, ouvert 24 h sur 24 (à confirmer)", ville: "Bangui", lat: 4.37237, lng: 18.57470 },
      { nom: "Hôpital Communautaire de Bangui", type: "Hôpital public · urgences et soins de référence", ville: "Bangui", lat: 4.38766, lng: 18.55676 },
      { nom: "Hôpital de l'Amitié", type: "Hôpital public · médecine, chirurgie, obstétrique et gynécologie", ville: "Bangui", lat: 4.40963, lng: 18.55304 },
      { nom: "Centre Hospitalier Universitaire de Bangui", type: "Hôpital universitaire · soins spécialisés", ville: "Bangui", lat: 4.38025, lng: 18.56460 },
      { nom: "Complexe Pédiatrique de Bangui", type: "Hôpital · soins pour enfants et adolescentes", ville: "Bangui", lat: 4.39468, lng: 18.55820 },
      { nom: "Centre de Santé Henry Dunant", type: "Centre de santé · soins de base et vaccination", ville: "Bangui", quartier: "Avenue Barthélemy", lat: 4.37815, lng: 18.53812 },
      { nom: "Clinique Sainte Catherine", type: "Clinique · consultations et gynécologie", ville: "Bangui", lat: 4.42822, lng: 18.54637 },
      { nom: "Polyclinique Saint Jacques", type: "Polyclinique · consultations", ville: "Bangui", lat: 4.36152, lng: 18.56318 },
      { nom: "Clinique Espoir", type: "Clinique · consultations", ville: "Bangui", lat: 4.36809, lng: 18.57138 },
      { nom: "CiBé Clinique", type: "Clinique · quartier Cité Lada II, Bimbo", ville: "Bangui", quartier: "Bimbo 1, Cité Lada II", lat: 4.33169, lng: 18.51006 },
    ],
  },
  ...([["CM", "Cameroun", "🇨🇲"], ["TD", "Tchad", "🇹🇩"], ["CD", "RD Congo", "🇨🇩"], ["CG", "Congo-Brazzaville", "🇨🇬"], ["GA", "Gabon", "🇬🇦"], ["GQ", "Guinée équatoriale", "🇬🇶"], ["BI", "Burundi", "🇧🇮"], ["RW", "Rwanda", "🇷🇼"]] as const).map(([code, name, flag]): Country => ({ code, name, flag, ready: false, emergency: [], centres: [] })),
];
export const DEFAULT_COUNTRY = "CF";
export function getCountry(code?: string | null): Country { return COUNTRIES.find((c) => c.code === (code || DEFAULT_COUNTRY)) || COUNTRIES[0]; }
