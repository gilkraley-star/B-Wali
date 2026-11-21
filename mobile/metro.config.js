const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Certains modules natifs (ex. @livekit/react-native) déclarent dans leur package.json une
// condition d'export "react-native" qui pointe vers leur code source brut plutôt que vers la
// version compilée. Avec la résolution "package exports" de Metro activée, cela peut faire
// échouer silencieusement des fonctions comme registerGlobals() en version publiée (release),
// alors que tout fonctionnait en développement. On revient à la résolution classique
// ("main"/"browser"), plus fiable pour ces librairies.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
