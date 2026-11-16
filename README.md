# Bê Wali — Première version technique (MVP Phase 2)

Implémentation de la Phase 2 décrite dans le dossier projet : compte + confidentialité,
calendrier menstruel, suivi des symptômes, rappels, bibliothèque éducative de base, forum
communautaire modéré et adapté à l'âge, français (+ structure prête pour le sango).

**⚠️ Ceci est un prototype technique fonctionnel, pas une version prête pour une publication
publique.** Avant tout déploiement réel auprès d'utilisatrices, il reste à faire :
- valider tous les contenus de santé avec des professionnels qualifiés (sages-femmes, médecins) ;
- compléter et faire valider la traduction sango par une locutrice native (voir
  `mobile/src/i18n/sg.ts`, volontairement incomplet) ;
- obtenir un avis juridique local sur la collecte de données de santé et le consentement
  des mineures ;
- mettre en place une vraie équipe et un process de modération humaine du forum ;
- passer la base de données en PostgreSQL et un vrai hébergement avant toute donnée réelle.

## Structure

```
be-wali/
  backend/   API Node.js / Express / Prisma (TypeScript)
  mobile/    App React Native / Expo (TypeScript, Android-first)
```

## Démarrer le backend

```bash
cd backend
cp .env.example .env
npm install
npx prisma migrate dev --name init   # crée dev.db (SQLite) et les tables
npm run seed                          # charge les catégories/articles/forum de départ
npm run dev                           # démarre l'API sur http://localhost:4000
```

L'API expose notamment :
- `POST /api/auth/signup`, `POST /api/auth/login`, `GET /api/auth/me`
- `PATCH /api/auth/privacy`, `DELETE /api/auth/account`, `GET /api/auth/export`
- `GET/POST/PATCH/DELETE /api/cycle/periods`, `/symptoms`, `/reminders`, `GET /api/cycle/estimate`
- `GET /api/content/categories`, `/articles`, `POST/DELETE /articles/:slug/save`
- `GET /api/forum/categories`, `POST /posts`, `GET /categories/:id/posts`, `POST /reports`,
  et les routes `/moderation/*` réservées au rôle `MODERATRICE`/`ADMIN`

**Passage en production (PostgreSQL) :** dans `backend/prisma/schema.prisma`, changez
`provider = "sqlite"` en `provider = "postgresql"`, mettez à jour `DATABASE_URL` dans `.env`,
puis relancez `npx prisma migrate dev`. Le reste du code ne change pas.

## Démarrer l'app mobile (Expo)

```bash
cd mobile
npm install
npx expo start
```

- Scannez le QR code avec l'app Expo Go sur un téléphone Android, ou lancez un émulateur
  (`npx expo start --android`).
- Par défaut, l'app pointe vers `http://10.0.2.2:4000/api` (adresse du PC hôte depuis un
  émulateur Android). Pour tester sur un vrai téléphone, changez `extra.apiBaseUrl` dans
  `mobile/app.json` par l'adresse IP locale de votre machine (ex: `http://192.168.1.x:4000/api`).

## Ce qui est déjà fonctionnel

- Inscription / connexion, choix de pseudonyme, tranche d'âge, lecture et acceptation des
  conditions d'utilisation (pas d'accord parental demandé ; texte à faire relire par un juriste local).
- **Mon Cycle** : calendrier (react-native-calendars), enregistrement des règles, estimation
  du prochain cycle (avec le rappel explicite que ce n'est pas une méthode contraceptive),
  suivi des symptômes avec intensité, rappels configurables.
- **Je m'informe** : bibliothèque d'articles classés par catégorie, sauvegarde pour lecture
  hors-ligne (calendrier et articles téléchargés restent consultables sans connexion).
- **Entre Nous** : catégories de forum (dont certaines réservées aux comptes "Adolescente"),
  publication soumise à modération avant affichage public, commentaires, signalement de
  contenu, désactivation du forum possible dans les réglages de confidentialité.
- **Réglages** : changement de langue (FR / structure Sango), activer/désactiver la
  participation au forum, export des données, suppression de compte.
- Modération : routes backend dédiées (file d'attente de publications, traitement des
  signalements) pour un futur back-office ou une app de modération séparée — non encore
  couvertes par une interface mobile dans ce MVP.

## Prochaines étapes suggérées

1. Avis juridique local + validation professionnelle des contenus santé et des traductions.
2. Interface web ou mobile dédiée à la modération (les routes API existent déjà).
3. Notifications push réelles pour les rappels (actuellement stockés, pas encore poussés).
4. Tests avec un groupe d'utilisatrices volontaires (Phase 3 du dossier projet) avant tout
   lancement public sur Google Play.


---

## Version 0.2 — admin, professionnelles, contenus sourcés

**Rôles** : `UTILISATRICE`, `PROFESSIONNELLE` (sage-femme, médecin, psychologue…), `COACH`, `FORMATRICE`, `MODERATRICE`, `ADMIN`.

**Circuit de validation** (règle centrale : rien n'est visible des filles avant l'accord d'un admin)
1. L'admin crée le compte d'une professionnelle (avec **photo obligatoire**, badge bleu « certifiée » optionnel). Un mot de passe provisoire est affiché une seule fois ; il doit être changé à la première connexion.
2. La professionnelle propose une fiche (formations et activités de revenus : API prête, écran de saisie à venir) depuis l'application → statut `A_VALIDER`.
3. L'admin relit, vérifie les **sources** et publie ou refuse (motif obligatoire). Un contenu **sans source ne peut pas être publié**.
4. Seuls les contenus `PUBLIE` sont servis par l'API publique. Désactiver un compte coupe l'accès immédiatement.

**Contenus de départ** (`backend/src/seed/content.ts`) : 10 fiches santé, 6 formations (avec QCM), 8 activités génératrices de revenus (dès 10 000 FCFA, et groupe d'épargne dès 500 FCFA). Tout est chargé en `A_VALIDER` avec ses sources (OMS, UNFPA, OIT, CARE…). Les montants en FCFA sont **indicatifs**.

**Interfaces d'administration**
- Site web : `http://<serveur>:4000/admin/` (valider, comptes pro, formations, signalements, journal).
- Dans l'application : écran *Administration* (valider, créer des comptes) visible uniquement pour un compte `ADMIN`.

### Démarrer en local
```bash
cd backend
cp .env.example .env        # renseigner ADMIN_EMAIL / ADMIN_PASSWORD (10 caractères minimum)
npm install
npx prisma db push
npm run seed
npm run dev                 # API sur :4000, admin sur /admin/
```

### GitHub
- `CI` : types + base de test + **test de bout en bout** (`backend/scripts/smoke.mjs`) + types de l'application mobile.
- `Android APK` : compile l'APK (lancement manuel ou étiquette `v*`). Définir la variable de dépôt `API_BASE_URL` (ex. `https://api.exemple.org/api`). L'APK est signé avec la clé de debug : suffisant pour des tests, **pas pour le Play Store** (il faudra une clé de signature de publication).

### Avant d'ouvrir aux filles
Voir la liste de contrôle : numéros d'urgence confirmés localement, relecture médicale des fiches, traduction sängö validée, passage à PostgreSQL + hébergement avec sauvegardes, avis juridique sur les données des mineures, équipe de modération humaine.
