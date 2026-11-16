import { fr, TranslationKeys } from "./fr";

// ⚠️ IMPORTANT — Traduction sango à compléter avant production.
//
// Le dossier projet (section 8 "Langues et accessibilité") prévoit le sango comme deuxième
// langue dès le lancement, et la section 5.3 exige que les contenus de santé soient
// "vérifiés avec des professionnels qualifiés" avant diffusion. Je ne suis pas en mesure de
// garantir une traduction fiable et nuancée de contenus de santé sensibles (contraception,
// violences, consentement...) en sango avec une fiabilité suffisante.
//
// Ci-dessous : seules quelques expressions d'interface très courantes et non ambiguës sont
// traduites à titre d'exemple de structure. TOUT le reste retombe sur le français (fallback)
// tant qu'une traduction n'a pas été validée par une locutrice native et, pour les contenus
// de santé, par un professionnel. Remplacez progressivement les clés ci-dessous, puis
// supprimez le commentaire une fois la relecture professionnelle faite.

const partial: Partial<Record<TranslationKeys, string>> = {
  app_tagline: "Tere ti mbi, nzoni ti mbi, bungbi ti mbi.", // "Mon corps, ma santé, ma communauté" — à faire valider
  get_started: "Zia nda",
  cancel: "Ke",
  confirm: "Yeda",
  save: "Bata",
  loading: "Ayeke gue na kozo…",
  logout: "Zi na yâ",
  // --- Ajouts du 16/11 : brouillon tiré de ma connaissance du sängö, PAS du dictionnaire (il n'a pas pu être consulté).
  // Tout ce qui suit est "à valider" par une locutrice. Les textes de santé restent volontairement en français.
  onboarding_welcome: "Balaô na Wali",
  home_greeting: "Balaô",
  tab_cycle: "Nze tî mbï",
  tab_library: "Mbï hînga",
  tab_forum: "Bungbi tî e",
  settings_language: "Yângâ",
};

export const sg = { ...fr, ...partial };
