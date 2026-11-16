export const fr = {
  app_name: "Bê Wali",
  app_tagline: "« Mon corps, ma santé, ma communauté »",

  // Onboarding / Auth
  onboarding_welcome: "Bienvenue sur Bê Wali",
  onboarding_subtitle:
    "Une application gratuite pour comprendre ton corps, suivre ta santé et échanger en toute sécurité.",
  get_started: "Commencer",
  already_have_account: "J'ai déjà un compte",
  email: "E-mail",
  password: "Mot de passe",
  pseudonyme: "Pseudonyme (visible dans la communauté)",
  birth_date: "Date de naissance",
  birth_date_hint: "Obligatoire. Elle sert à t'adapter les fiches et reste privée.",
  accept_terms: "J'ai lu et j'accepte les conditions d'utilisation.",
  read_terms: "Lire les conditions",
  signup: "Créer mon compte",
  login: "Se connecter",
  logout: "Se déconnecter",

  // Navigation
  tab_home: "Accueil",
  tab_cycle: "Mon Cycle",
  tab_library: "Je m'informe",
  tab_forum: "Entre Nous",
  tab_settings: "Réglages",

  // Home
  home_greeting: "Bonjour",
  home_next_period: "Prochaines règles estimées",
  home_no_data: "Ajoute tes dernières règles pour voir une estimation.",
  home_quick_actions: "Actions rapides",

  // Cycle
  cycle_title: "Mon Cycle",
  cycle_log_period: "Enregistrer mes règles",
  cycle_start_date: "Date de début",
  cycle_end_date: "Date de fin (optionnel)",
  cycle_save: "Enregistrer",
  cycle_history: "Historique",
  cycle_disclaimer:
    "Indication approximative. Ne remplace pas un avis médical et ne doit jamais être utilisée comme méthode de contraception.",
  cycle_symptoms: "Symptômes",
  cycle_add_symptom: "Ajouter un symptôme",
  symptom_douleur: "Douleur",
  symptom_fatigue: "Fatigue",
  symptom_humeur: "Changement d'humeur",
  symptom_autre: "Autre",
  cycle_intensity: "Intensité",
  cycle_reminders: "Rappels",
  cycle_add_reminder: "Ajouter un rappel",
  reminder_days_before: "jours avant la date estimée",

  // Library
  library_title: "Je m'informe",
  library_categories: "Catégories",
  library_save_offline: "Enregistrer pour lecture hors-ligne",
  library_saved: "Enregistré",
  library_reviewed_by: "Vérifié par",

  // Forum
  forum_title: "Entre Nous",
  forum_categories: "Catégories",
  forum_new_post: "Nouvelle publication",
  forum_post_title: "Titre",
  forum_post_body: "Ton message",
  forum_publish: "Publier",
  forum_pending_note:
    "Ton message est publié tout de suite. Ici, on se respecte : pas d'insultes ni de haine. Les messages signalés par les filles sont cachés.",
  forum_comment: "Répondre",
  forum_report: "Signaler",
  forum_report_reason: "Explique pourquoi tu signales ce contenu",
  forum_report_send: "Envoyer le signalement",
  forum_disabled:
    "Le forum est désactivé pour ton compte. Tu peux l'activer dans les réglages de confidentialité.",

  // Settings / Privacy
  settings_title: "Réglages",
  settings_privacy: "Confidentialité",
  settings_participate_forum: "Participer à la communauté (Entre Nous)",
  settings_change_pseudonyme: "Changer mon pseudonyme",
  settings_language: "Langue",
  settings_export_data: "Exporter mes données",
  settings_delete_account: "Supprimer mon compte",
  settings_delete_confirm: "Cette action est définitive et supprimera toutes tes données. Confirmer ?",

  // Generic
  cancel: "Annuler",
  confirm: "Confirmer",
  save: "Enregistrer",
  loading: "Chargement…",
  error_generic: "Une erreur est survenue. Réessaie.",
  offline_notice: "Tu es hors ligne. Certaines données affichées peuvent ne pas être à jour.",
};

export type TranslationKeys = keyof typeof fr;
