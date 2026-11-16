// Configuration Expo : reprend app.json et lit l'adresse du serveur dans l'environnement.
// Exemple : API_BASE_URL="https://api.mon-domaine.org/api" npx expo prebuild
const base = require("./app.json");

module.exports = () => ({
  ...base.expo,
  extra: {
    ...base.expo.extra,
    apiBaseUrl: process.env.API_BASE_URL || base.expo.extra.apiBaseUrl,
    // Lien que les filles partagent à leurs amies (page de téléchargement). À définir avant le lancement.
    shareUrl: process.env.SHARE_URL || "https://bewali.example/telecharger",
  },
});
