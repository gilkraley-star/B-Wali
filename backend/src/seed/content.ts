// Contenus de démarrage de Wali : fiches santé, formations, activités génératrices de revenus.
//
// RÈGLES :
//  - Chaque contenu cite ses sources (organisations reconnues : OMS, UNFPA, ILO, CARE…).
//  - Tout est chargé avec le statut "A_VALIDER". Rien n'est visible des filles avant qu'un compte
//    ADMIN (ou une professionnelle habilitée) l'ait relu et publié depuis l'espace d'administration.
//  - Les chiffres médicaux viennent des sources citées. Les montants en FCFA sont INDICATIFS :
//    à ajuster avec les prix réels des marchés de Bangui avant publication.

export interface Source {
  title: string;
  org: string;
  url: string;
}

const S = {
  cefr: {
    title: "Cadre européen commun de référence pour les langues : niveau A1 (débutant)",
    org: "Conseil de l'Europe",
    url: "https://www.coe.int/en/web/common-european-framework-reference-languages/level-descriptions",
  },
  britishCouncil: {
    title: "LearnEnglish : apprendre l'anglais gratuitement (débutants A1)",
    org: "British Council",
    url: "https://learnenglish.britishcouncil.org/",
  },
  whatsappBiz: {
    title: "WhatsApp Business app features (catalogue, réponses rapides, étiquettes, messages d'absence)",
    org: "WhatsApp Business (Meta)",
    url: "https://whatsappbusiness.com/products/business-app-features/?lang=en_US",
  },
  metaAge: {
    title: "How Do We Know Someone Is Old Enough to Use Our Apps? (âge minimum 13 ans pour Facebook et Instagram)",
    org: "Meta",
    url: "https://about.fb.com/news/2021/07/age-verification/",
  },
  marketplaceAge: {
    title: "How old do you have to be to use Facebook Marketplace? (18 ans pour vendre)",
    org: "GoHenry (éducation financière)",
    url: "https://www.gohenry.com/us/blog/financial-education/facebook-marketplace-age",
  },
  tiktokShopAfrica: {
    title: "TikTok Shop : l'Afrique reste hors de la feuille de route officielle",
    org: "Capmad",
    url: "https://www.capmad.com/post/tiktok-shops-standalone-app-sharpens-bytedances-ecommerce-play-against-amazon",
  },
  carMobileMoney: {
    title: "Mobile Money en RCA : les envois et retraits d'argent désormais taxés à 1 % du montant",
    org: "Ecomatin",
    url: "https://ecomatin.net/mobile-money-en-rca-les-envois-et-retraits-dargent-desormais-taxes-a-1-du-montant",
  },
  carTelecom: {
    title: "Haut débit mobile : Telecel Centrafrique rejoint Orange et Moov Africa sur la 4G",
    org: "Osiris",
    url: "https://osiris.sn/haut-debit-mobile-telecel-centrafrique-rejoint-orange-et-moov-africa-sur-la-4g.html",
  },
  whoMenstrual: {
    title: "Menstrual health, not just hygiene: the path toward a strong cross-sectoral response",
    org: "OMS",
    url: "https://www.who.int/news/item/28-05-2023-menstrual-health-not-just-hygiene-the-path-toward-a-strong-cross-sectoral-response",
  },
  normalCycle: {
    title: "The normal menstrual cycle (Curr Probl Pediatr Adolesc Health Care, 2022)",
    org: "PubMed / revue pédiatrique",
    url: "https://pubmed.ncbi.nlm.nih.gov/35527220/",
  },
  whoMenarche: {
    title: "WHO multicenter study on menstrual and ovulatory patterns in adolescent girls",
    org: "OMS (Task Force on Adolescent Reproductive Health)",
    url: "https://pubmed.ncbi.nlm.nih.gov/3721946/",
  },
  rchPeriods: {
    title: "Periods — fact sheet",
    org: "Royal Children's Hospital Melbourne",
    url: "https://www.rch.org.au/kidsinfo/fact_sheets/Periods/",
  },
  nationwide: {
    title: "Menstrual period disorders",
    org: "Nationwide Children's Hospital",
    url: "https://www.nationwidechildrens.org/conditions/menstrual-period-disorders",
  },
  womensHealth: {
    title: "Top questions about your menstrual cycle",
    org: "Office on Women's Health (USA)",
    url: "https://womenshealth.gov/sites/default/files/documents/fact-sheet-menstrual-cycle.pdf",
  },
  whoFP: {
    title: "Family planning / contraception methods — fact sheet",
    org: "OMS",
    url: "https://www.who.int/news-room/fact-sheets/detail/family-planning-contraception-methods",
  },
  whoCondoms: {
    title: "Condoms — fact sheet",
    org: "OMS",
    url: "https://who.int/news-room/fact-sheets/detail/condoms",
  },
  whoSTI: {
    title: "Sexually transmitted infections — prevention",
    org: "OMS",
    url: "https://www.who.int/teams/global-hiv-hepatitis-and-stis-programmes/stis/prevention",
  },
  condomPosition: {
    title: "Position statement on condoms and the prevention of HIV, other STIs and unintended pregnancy",
    org: "UNFPA / OMS / ONUSIDA",
    url: "https://www.unfpa.org/resources/condoms-and-hiv-prevention-position-statement-unaids-unfpa-and-world-health-organization",
  },
  whoAdolPreg: {
    title: "Adolescent pregnancy — fact sheet",
    org: "OMS",
    url: "https://www.who.int/en/news-room/fact-sheets/detail/adolescent-pregnancy",
  },
  whoAdolGuideline: {
    title: "WHO guideline on preventing early pregnancy and poor reproductive outcomes among adolescents",
    org: "OMS",
    url: "https://www.who.int/publications/i/item/B09322",
  },
  whoPostnatal: {
    title: "WHO recommendations on postnatal care of the mother and newborn",
    org: "OMS",
    url: "https://www.ncbi.nlm.nih.gov/books/NBK190090/",
  },
  whoBreastfeeding: {
    title: "Breastfeeding",
    org: "OMS",
    url: "https://www.who.int/westernpacific/health-topics/breastfeeding",
  },
  unfpaCar: {
    title: "Central African Republic — Situation Report (violences basées sur le genre, espaces sûrs)",
    org: "UNFPA",
    url: "https://www.unfpa.org/resources/central-african-republic-situation-report-12-december-2024",
  },
  unfpaSafeSpaces: {
    title: "Safe spaces for women and girls in the Central African Republic",
    org: "UNFPA",
    url: "https://wcaro.unfpa.org/en/news/safe-spaces-boukayas-women-central-african-republic",
  },
  siyb: {
    title: "Start and Improve Your Business (SIYB) — implementation strategy",
    org: "Organisation internationale du Travail (OIT)",
    url: "https://webapps.ilo.org/public/libdoc/ilo/2010/482561.pdf",
  },
  careVsla: {
    title: "Village Savings and Loans Associations (VSLA)",
    org: "CARE International",
    url: "https://www.care-international.org/what-we-do/womens-economic-justice/village-savings-and-loans-associations",
  },
  vslaCar: {
    title: "Overview of the VSLA programme in the Central African Republic",
    org: "Mercy Corps",
    url: "https://cl.globalgiving.org/pfil/7064/projdoc.pdf",
  },
};

export interface ArticleSeed {
  slug: string;
  categorySlug: string;
  titleFr: string;
  bodyFr: string;
  sources: Source[];
  reviewNote?: string;
}

export const ARTICLES: ArticleSeed[] = [
  {
    slug: "fiche-cycle-menstruel",
    categorySlug: "cycle-menstruel",
    titleFr: "Comprendre tes règles et ton cycle",
    bodyFr:
      "Les règles sont normales. Toutes les filles en ont. Ce n'est pas une honte et ce n'est pas un secret.\n" +
      "\n" +
      "C'EST QUOI LE CYCLE ?\n" +
      "Le cycle va du 1er jour de tes règles jusqu'au 1er jour des règles suivantes. En général, il dure environ 28 jours. Chez les jeunes filles, il peut durer de 21 à 45 jours. Le sang coule le plus souvent de 3 à 7 jours.\n" +
      "\n" +
      "LES 4 TEMPS DU CYCLE\n" +
      "1. Les règles : le sang sort de ton corps.\n" +
      "2. Après les règles : ton corps prépare un petit œuf (l'ovule).\n" +
      "3. Au milieu du cycle : l'ovule sort. À ce moment, tu peux tomber enceinte.\n" +
      "4. À la fin : si l'ovule ne devient pas un bébé, les règles reviennent.\n" +
      "\n" +
      "SI TES RÈGLES NE SONT PAS RÉGULIÈRES\n" +
      "C'est normal au début. Pendant les premières années, les règles viennent à des dates différentes. Écris la date de tes règles dans l'application. L'application dessine ton cycle avec ces dates.\n" +
      "\n" +
      "IMPORTANT\n" +
      "L'application te donne une idée, pas une certitude. Elle ne remplace pas une méthode pour éviter la grossesse. Elle ne remplace pas l'avis d'une sage-femme.",
    sources: [S.whoMenstrual, S.normalCycle, S.whoMenarche, S.rchPeriods],
  },
  {
    slug: "premieres-regles-que-faire",
    categorySlug: "premieres-regles",
    titleFr: "Mes premières règles : que faire ?",
    bodyFr:
      "Les premières règles arrivent le plus souvent entre 9 et 15 ans. Chaque fille a son rythme. Tu n'es pas malade.\n" +
      "\n" +
      "CE QUI EST NORMAL\n" +
      "• Du sang pendant 2 à 7 jours. Parfois peu, parfois beaucoup.\n" +
      "• Mal au ventre, fatigue, humeur qui change.\n" +
      "• Au début, les règles ne reviennent pas toujours à la même date.\n" +
      "\n" +
      "QUE FAIRE LE PREMIER JOUR\n" +
      "1. Reste calme.\n" +
      "2. Mets une serviette propre, ou un tissu propre et sec.\n" +
      "3. Parle à une personne de confiance : maman, tante, grande sœur, maîtresse, sage-femme.\n" +
      "4. Écris la date dans l'application.\n" +
      "\n" +
      "QUAND DEMANDER DE L'AIDE\n" +
      "Va voir une sage-femme si tu n'as pas encore tes règles à 15 ans. Va aussi la voir si tu as tellement mal que tu ne peux plus faire tes activités.",
    sources: [S.rchPeriods, S.whoMenstrual, S.nationwide],
  },
  {
    slug: "hygiene-menstruelle-serviettes",
    categorySlug: "hygiene-menstruelle",
    titleFr: "Rester propre pendant les règles",
    bodyFr:
      "Pendant tes règles, tu as besoin de protections, d'eau propre, de savon et d'un endroit pour te changer. C'est un droit. Il n'y a pas de honte.\n" +
      "\n" +
      "LES BONNES HABITUDES\n" +
      "• Change ta serviette ou ton tissu souvent, même s'il y a peu de sang.\n" +
      "• Lave-toi les mains avant et après.\n" +
      "• Un tissu qu'on réutilise : lave-le avec de l'eau propre et du savon. Fais-le sécher complètement avant de le remettre.\n" +
      "• Prépare tes protections avant la date de tes règles. L'application te le rappelle.\n" +
      "\n" +
      "ATTENTION\n" +
      "Va voir une sage-femme si tu dois changer ta serviette chaque heure pendant plusieurs heures. Va aussi la voir si tes règles durent plus de 7 jours. Trop de sang peut rendre malade (anémie) : on est très fatiguée et pâle.",
    sources: [S.whoMenstrual, S.nationwide, S.womensHealth],
  },
  {
    slug: "regles-irregulieres-quand-consulter",
    categorySlug: "cycle-menstruel",
    titleFr: "Règles en retard ou pas régulières : quand aller voir quelqu'un ?",
    bodyFr:
      "Beaucoup de filles ont des règles irrégulières au début. Mais dans certains cas, il faut voir une sage-femme ou un médecin.\n" +
      "\n" +
      "VA VOIR UNE SAGE-FEMME SI :\n" +
      "• Tu n'as pas tes règles à 15 ans.\n" +
      "• Tu as passé plus de 90 jours entre deux règles.\n" +
      "• Tes règles durent plus de 7 jours.\n" +
      "• Tu changes ta serviette chaque heure pendant 2 ou 3 heures.\n" +
      "• Tu as du sang en dehors des règles.\n" +
      "\n" +
      "ET SI TU AS EU UN RAPPORT SEXUEL ?\n" +
      "Un retard peut vouloir dire que tu es enceinte. Va dans un centre de santé pour un test ou une consultation. On ne te juge pas. Tu peux aussi écrire à une sage-femme dans l'application.",
    sources: [S.nationwide, S.womensHealth, S.rchPeriods],
  },
  {
    slug: "contraception-les-methodes",
    categorySlug: "contraception",
    titleFr: "Éviter une grossesse : choisir une méthode avec une professionnelle",
    bodyFr:
      "Éviter une grossesse permet de choisir quand tu veux un enfant. Cela protège la santé de la maman et du bébé. Cela permet aussi de continuer l'école ou le travail.\n" +
      "\n" +
      "À RETENIR\n" +
      "• Il existe plusieurs méthodes. La bonne dépend de ta santé et de ton âge.\n" +
      "• Le préservatif est la seule méthode qui protège de la grossesse ET de la plupart des maladies qui s'attrapent par les rapports sexuels, comme le VIH.\n" +
      "• Une sage-femme ou un agent de santé t'explique les méthodes près de chez toi.\n" +
      "• Si tu as eu un rapport sans protection, va vite dans un centre de santé. Il existe une pilule d'urgence.\n" +
      "\n" +
      "TU AS LE DROIT d'être informée et d'être bien traitée, sans jugement.",
    sources: [S.whoFP, S.whoCondoms, S.whoAdolGuideline],
    reviewNote: "À faire valider par une sage-femme : liste des méthodes réellement disponibles à Bangui et en province.",
  },
  {
    slug: "preservatif-et-ist",
    categorySlug: "ist",
    titleFr: "Se protéger des maladies des rapports sexuels (IST)",
    bodyFr:
      "Les IST sont des maladies qu'on attrape par les rapports sexuels. Parfois, on n'a aucun signe. On peut être malade sans le savoir.\n" +
      "\n" +
      "COMMENT SE PROTÉGER\n" +
      "• Le préservatif, bien mis à chaque rapport, protège très bien de la plupart des IST, du VIH et de la grossesse.\n" +
      "• Parler avec ton partenaire et faire des tests de temps en temps aident aussi.\n" +
      "\n" +
      "COMMENT SE SOIGNER\n" +
      "• Quatre IST se guérissent : la syphilis, la gonorrhée, la chlamydia et la trichomonase.\n" +
      "• Va dans un centre de santé si tu as des pertes qui ne sont pas comme d'habitude, des brûlures, des plaies ou des douleurs. Plus on soigne tôt, mieux c'est.\n" +
      "• Une IST qu'on ne soigne pas peut empêcher d'avoir des enfants plus tard. Pendant la grossesse, elle peut aussi rendre le bébé malade.",
    sources: [S.whoCondoms, S.whoSTI, S.condomPosition],
  },
  {
    slug: "grossesse-adolescente-risques-et-droits",
    categorySlug: "grossesse-maternite",
    titleFr: "Enceinte quand on est jeune : les risques et tes droits",
    bodyFr:
      "Dans beaucoup de pays pauvres, les problèmes de la grossesse et de l'accouchement sont la première cause de décès des filles de 15 à 19 ans. Être suivie tôt par une professionnelle protège la maman et le bébé.\n" +
      "\n" +
      "SI TU ES ENCEINTE\n" +
      "• Va le plus tôt possible dans un centre de santé pour être suivie.\n" +
      "• Tu n'as pas à avoir honte. Le plus important est d'être suivie.\n" +
      "• Tu peux continuer à apprendre : regarde la partie Formations.\n" +
      "\n" +
      "ÉVITER UNE GROSSESSE QUE TU NE VEUX PAS\n" +
      "Il est important que les filles restent à l'école, qu'elles ne se marient pas avant 18 ans et qu'elles reçoivent des informations claires sur leur corps. Elles doivent aussi pouvoir aller au centre de santé. Personne n'a le droit de te forcer à un rapport ou à un mariage.",
    sources: [S.whoAdolPreg, S.whoAdolGuideline],
  },
  {
    slug: "apres-laccouchement-soins-mere-bebe",
    categorySlug: "grossesse-maternite",
    titleFr: "Après l'accouchement : prendre soin de la maman et du bébé",
    bodyFr:
      "Les six semaines après la naissance sont très importantes. La maman et le bébé doivent être suivis.\n" +
      "\n" +
      "LES VISITES\n" +
      "• Reste au moins 24 heures au centre de santé après la naissance.\n" +
      "• Ensuite, va à au moins 3 visites : vers le 3e jour, entre le 7e et le 14e jour, puis 6 semaines après la naissance.\n" +
      "• Une visite à la maison la première semaine est une bonne chose.\n" +
      "\n" +
      "POUR LE BÉBÉ\n" +
      "• Garde le bébé contre ta peau, au chaud, dès la naissance.\n" +
      "• Attends au moins 24 heures avant le premier bain. Si c'est impossible, attends au moins 6 heures.\n" +
      "• Va vite au centre de santé si le bébé a de la fièvre, respire mal, bouge très peu, a des convulsions, a du mal à téter, ou si sa peau ou ses paumes sont jaunes.\n" +
      "\n" +
      "POUR LA MAMAN\n" +
      "Dis ce qui te fait mal, si tu saignes beaucoup, et comment tu te sens dans ta tête. Beaucoup de mamans se sentent très tristes après la naissance. C'est fréquent. Demande de l'aide.",
    sources: [S.whoPostnatal, S.whoBreastfeeding],
    reviewNote: "Vérifier l'adaptation au contexte local (centres disponibles, vaccins à la naissance).",
  },
  {
    slug: "allaitement-exclusif-six-mois",
    categorySlug: "grossesse-maternite",
    titleFr: "Allaiter : de la naissance à 6 mois",
    bodyFr:
      "Il est recommandé de mettre le bébé au sein dans la première heure après la naissance. Pendant les 6 premiers mois, donne seulement le lait de la maman : pas d'eau, pas de bouillie, pas d'autre boisson.\n" +
      "\n" +
      "APRÈS 6 MOIS\n" +
      "Continue à allaiter et ajoute d'autres aliments adaptés. Tu peux allaiter jusqu'à 2 ans et plus.\n" +
      "\n" +
      "SI ÇA FAIT MAL\n" +
      "Mal aux seins ou bébé qui tète mal : c'est fréquent au début. Une sage-femme peut te montrer la bonne position. N'arrête pas sans demander conseil.\n" +
      "\n" +
      "Chaque situation est différente, par exemple si la maman a le VIH. Demande conseil à une professionnelle de santé.",
    sources: [S.whoBreastfeeding, S.whoPostnatal],
  },
  {
    slug: "violences-et-consentement",
    categorySlug: "violences",
    titleFr: "Dire non, être protégée : tu n'es pas seule",
    bodyFr:
      "Dire « oui » doit être un choix libre. Ce « oui » doit être clair. Tu peux changer d'avis à tout moment. Personne n'a le droit de te forcer, de te faire peur ou de te faire du chantage, même quelqu'un que tu connais.\n" +
      "\n" +
      "SI QUELQU'UN T'A FAIT DU MAL\n" +
      "• Ce n'est jamais ta faute.\n" +
      "• Va dans un endroit sûr, avec une personne de confiance.\n" +
      "• Va le plus vite possible dans un centre de santé. Il y a des soins, et ils marchent mieux quand on y va tôt.\n" +
      "• En Centrafrique, il existe des « espaces sûrs », par exemple à Bangui. Ils aident les femmes et les filles : écoute, aide de la loi, soins.\n" +
      "• Si tu es en danger tout de suite, appuie sur le bouton rouge SOS de l'application.\n" +
      "\n" +
      "Beaucoup de filles et de jeunes subissent des violences en Centrafrique. Tu mérites d'être protégée et d'être écoutée.",
    sources: [S.unfpaCar, S.unfpaSafeSpaces],
    reviewNote:
      "À valider avec une professionnelle : délais de prise en charge médicale après une agression (contraception d'urgence, traitement post-exposition VIH) et numéro d'écoute confirmé localement.",
  },
];

// ---------------------------------------------------------------------------
// FORMATIONS
// ---------------------------------------------------------------------------

export interface CourseSeed {
  slug: string;
  title: string;
  summary: string;
  icon: string;
  partner: string;
  durationMin: number;
  outlineMd: string;
  qcm: { q: string; options: string[]; correct: number }[];
  sources: Source[];
  reviewNote?: string;
}

export const COURSES: CourseSeed[] = [
  {
    slug: "comprendre-son-cycle",
    title: "Comprendre mes règles et mon corps",
    summary: "Les règles, le cycle, et quand demander de l'aide.",
    icon: "🩸",
    partner: "FAFECA",
    durationMin: 90,
    outlineMd: "1. Les règles sont normales (5 min)\n2. Les 4 temps du cycle (20 min)\n3. Quand les règles ne sont pas régulières : c'est fréquent au début (15 min)\n4. Écrire mes dates dans l'application (15 min)\n5. Quand aller voir une sage-femme (15 min)\n6. Tes questions (20 min)",
    qcm: [
      { q: "En général, un cycle dure combien de jours ?", options: ["Environ 14 jours", "Environ 28 jours", "Environ 45 jours"], correct: 1 },
      { q: "Quand peut-on tomber enceinte le plus facilement ?", options: ["Pendant les règles", "Vers le milieu du cycle", "Juste avant les règles"], correct: 1 },
      { q: "Tu as passé plus de 90 jours entre deux règles. Que fais-tu ?", options: ["J'attends sans rien faire", "Je vais voir une sage-femme ou au centre de santé", "Je demande seulement à mes amies"], correct: 1 },
      { q: "L'application te dit quand tes règles vont revenir. C'est :", options: ["Une méthode sûre pour ne pas tomber enceinte", "Une idée utile, mais pas une méthode pour éviter la grossesse", "Une certitude"], correct: 1 },
    ],
    sources: [S.whoMenstrual, S.normalCycle, S.whoMenarche, S.nationwide],
  },
  {
    slug: "hygiene-menstruelle",
    title: "Rester propre pendant les règles",
    summary: "Protections, lavage, douleurs, et pas de honte.",
    icon: "🧼",
    partner: "Ministère de la Santé (à confirmer)",
    durationMin: 45,
    outlineMd: "1. Les règles : soins et droits (10 min)\n2. Choisir et laver mes protections (15 min)\n3. Douleurs et beaucoup de sang : que faire (10 min)\n4. Parler des règles sans honte (10 min)",
    qcm: [
      { q: "Un tissu qu'on réutilise doit être :", options: ["Remis sans être lavé", "Lavé à l'eau propre et au savon, puis bien séché", "Prêté à une sœur"], correct: 1 },
      { q: "Quand va-t-on voir une sage-femme ?", options: ["Si les règles durent plus de 7 jours ou si je change de protection chaque heure", "Jamais", "Seulement après 30 ans"], correct: 0 },
      { q: "Les règles, c'est :", options: ["Une maladie", "Normal et naturel", "Une punition"], correct: 1 },
    ],
    sources: [S.whoMenstrual, S.nationwide, S.womensHealth],
  },
  {
    slug: "bien-vivre-sa-grossesse-jeune",
    title: "Être enceinte quand on est jeune",
    summary: "Les visites, les signes de danger, tes droits, la naissance et les premières semaines.",
    icon: "🤱",
    partner: "Association de sages-femmes (à confirmer)",
    durationMin: 90,
    outlineMd: "1. Pourquoi aller tôt au centre de santé (15 min)\n2. Les visites pendant la grossesse (20 min)\n3. Se préparer à accoucher (20 min)\n4. Après la naissance : 3 visites et le lait de maman (20 min)\n5. Continuer d'apprendre ou de se former (15 min)",
    qcm: [
      { q: "Après la naissance, il faut aller à combien de visites en plus ?", options: ["Aucune", "Trois : vers le 3e jour, entre le 7e et le 14e jour, puis après 6 semaines", "Une seule, après un an"], correct: 1 },
      { q: "Que donne-t-on au bébé jusqu'à 6 mois ?", options: ["Eau sucrée et bouillie", "Seulement le lait de maman", "Lait de vache avec de l'eau"], correct: 1 },
      { q: "Le bébé a de la fièvre ou respire mal. Que fais-tu ?", options: ["J'attends demain", "Je vais vite au centre de santé", "Je le baigne dans l'eau froide"], correct: 1 },
    ],
    sources: [S.whoAdolPreg, S.whoPostnatal, S.whoBreastfeeding],
  },
  {
    slug: "creer-sa-petite-entreprise",
    title: "Lancer et gérer mon petit commerce",
    summary: "Trouver une idée, calculer mes dépenses, fixer mes prix, noter mes ventes, mettre de l'argent de côté.",
    icon: "🧺",
    partner: "FAFECA",
    durationMin: 120,
    outlineMd: "Inspiré de la méthode « Start and Improve Your Business » de l'OIT.\n1. Trouver une idée : qu'est-ce qui manque dans mon quartier ? (20 min)\n2. Calculer ce que je dépense et fixer mon prix (30 min)\n3. Séparer l'argent du commerce et l'argent de la maison (15 min)\n4. Tenir un cahier : ce que je dépense, ce que je vends (25 min)\n5. Mettre de l'argent de côté et acheter plus (15 min)\n6. Un exemple et vos questions (15 min)",
    qcm: [
      { q: "Pour fixer ton prix, tu dois d'abord :", options: ["Copier le prix le plus bas", "Compter ce que tu as dépensé (achat, transport, ton travail), puis ajouter ton gain", "Demander le prix à ta voisine seulement"], correct: 1 },
      { q: "Pourquoi noter dans un cahier ?", options: ["Pour savoir si je gagne vraiment de l'argent", "Ce n'est pas utile", "Pour le montrer au marché"], correct: 0 },
      { q: "Il vaut mieux :", options: ["Mélanger l'argent du commerce et celui de la maison", "Garder séparés l'argent du commerce et celui de la maison", "Tout dépenser chaque jour"], correct: 1 },
    ],
    sources: [S.siyb, S.careVsla],
    reviewNote: "Cours à animer par une formatrice formée à la méthode SIYB (OIT) ou par le partenaire FAFECA.",
  },
  {
    slug: "vendre-en-ligne-facebook-whatsapp-tiktok",
    title: "Vendre en ligne : Facebook, WhatsApp et TikTok",
    summary: "Les techniques pour montrer ce que tu vends, attirer des clientes et conclure la vente avec ton téléphone.",
    icon: "🛍️",
    partner: "À confirmer (formatrice en marketing digital)",
    durationMin: 120,
    outlineMd:
      "1. Choisir ce que tu vends et à qui (15 min)\n   - Une cliente précise (étudiantes, mamans, voisines du quartier) et un besoin précis.\n   - Choisir 5 à 10 produits à bien présenter plutôt que 50 mal présentés.\n" +
      "2. Faire de belles photos avec ton téléphone (15 min)\n   - Prendre la photo à la lumière du jour, sans flash, près d'une fenêtre ou dehors.\n   - Un fond propre et simple. Montrer le produit de face, de côté et de près.\n   - Essuyer l'objectif du téléphone avant de photographier.\n" +
      "3. Écrire une bonne annonce (15 min)\n   - Toujours écrire : le nom du produit, la taille ou la couleur, le prix, le quartier, comment commander.\n   - Phrases courtes. Pas de mensonge sur le produit.\n" +
      "4. Facebook : page, groupes et Marketplace (20 min)\n   - Pour avoir un compte Facebook, il faut avoir au moins 13 ans. Pour vendre sur Marketplace, il faut avoir 18 ans.\n   - Si tu as moins de 18 ans : parles-en à un adulte de confiance et vends avec lui ou elle, ou passe par WhatsApp.\n   - Poster régulièrement, répondre aux commentaires, partager dans les groupes de ton quartier.\n" +
      "5. WhatsApp Business : ta petite boutique (20 min)\n   - Le catalogue : une liste de tes produits avec photo, prix et description.\n   - Les réponses rapides : tu enregistres tes réponses (prix, livraison) et tu les envoies en un geste.\n   - Les étiquettes : « Nouvelle cliente », « Paiement en attente », « Commande finie ».\n   - Le message d'absence : dire à quelle heure tu réponds.\n" +
      "6. TikTok : de courtes vidéos qui donnent envie (20 min)\n   - Montrer le produit en vrai : l'essayer, le coudre, le préparer, avant/après.\n   - Dire où commander (ton numéro WhatsApp) à la fin de la vidéo.\n   - La vente directe dans TikTok n'est pas ouverte dans beaucoup de pays d'Afrique : on utilise TikTok pour se faire connaître, puis on conclut sur WhatsApp. À vérifier pour la Centrafrique.\n" +
      "7. Parler aux clientes et bien conclure (15 min)\n   - Répondre vite et poliment. Dire merci. Ne pas se disputer.\n   - Relancer gentiment une cliente qui hésite. Demander un avis à celles qui sont contentes.\n" +
      "8. Compter mes ventes (10 min)\n   - Noter chaque vente et chaque dépense dans un cahier. Calculer ce qu'il te reste : c'est ton gain.",
    qcm: [
      { q: "Pour une belle photo de ton produit, le mieux est :", options: ["La lumière du jour, sans flash, avec un fond propre", "La nuit avec le flash tout près", "Une photo floue prise de loin"], correct: 0 },
      { q: "Une bonne annonce contient :", options: ["Seulement « Contactez-moi »", "Le nom du produit, la taille ou la couleur, le prix, le quartier et comment commander", "Seulement une photo sans texte"], correct: 1 },
      { q: "À quoi servent les réponses rapides de WhatsApp Business ?", options: ["À répondre vite aux questions qu'on te pose souvent (prix, livraison)", "À bloquer les clientes", "À supprimer les messages"], correct: 0 },
      { q: "TikTok Shop n'est pas ouvert dans beaucoup de pays d'Afrique. Que peut faire une vendeuse ?", options: ["Arrêter de vendre", "Montrer ses produits en vidéo sur TikTok et envoyer les clientes commander sur WhatsApp", "Donner ses produits gratuitement"], correct: 1 },
      { q: "Une cliente te demande le prix. Tu fais quoi ?", options: ["Tu réponds vite et poliment", "Tu réponds après deux jours", "Tu ne réponds pas"], correct: 0 },
      { q: "Pour savoir si tu gagnes de l'argent, tu dois :", options: ["Deviner", "Noter tes ventes et tes dépenses dans un cahier", "Demander à une amie"], correct: 1 },
    ],
    sources: [S.whatsappBiz, S.metaAge, S.marketplaceAge, S.tiktokShopAfrica, S.siyb],
    reviewNote: "À valider par une formatrice en marketing digital : vérifier si TikTok Shop est ouvert en Centrafrique, les règles de Facebook Marketplace selon l'âge, et adapter les exemples aux produits vendus à Bangui.",
  },
  {
    slug: "vendre-en-ligne-securite-paiement-livraison",
    title: "Vendre en ligne sans se faire arnaquer : paiement et livraison",
    summary: "Recevoir un paiement Mobile Money en sécurité, livrer, rencontrer les clientes et protéger tes informations.",
    icon: "🔐",
    partner: "À confirmer (formatrice en marketing digital)",
    durationMin: 60,
    outlineMd:
      "1. Reconnaître une arnaque (15 min)\n   - Une personne que tu ne connais pas veut payer trop, ou te demande ton code secret.\n   - Un faux message qui ressemble à celui de l'opérateur.\n   - Quelqu'un te met la pression : « Vite, vite ! »\n" +
      "2. Recevoir un paiement Mobile Money en sécurité (20 min)\n   - Ne jamais donner ton code secret (PIN), à personne, même si on dit venir de l'opérateur.\n   - Vérifier dans ton téléphone que l'argent est bien arrivé, avant de remettre le produit.\n   - Savoir que les envois et retraits Mobile Money sont taxés en Centrafrique (1 % du montant) : en tenir compte dans ton prix.\n" +
      "3. Livrer et rencontrer les clientes (15 min)\n   - Donner rendez-vous dans un lieu public, de jour. Venir accompagnée si tu es jeune.\n   - Ne pas donner l'adresse de ta maison à quelqu'un que tu ne connais pas.\n   - Pour une livraison, dire clairement qui paie le transport.\n" +
      "4. Protéger tes informations (10 min)\n   - Ne publier ni ta pièce d'identité, ni ton adresse complète.\n   - Parler d'abord à un adulte de confiance si une personne te demande de l'argent ou des photos privées.",
    qcm: [
      { q: "Quelqu'un te demande ton code secret Mobile Money. Tu fais quoi ?", options: ["Tu le donnes s'il dit être de l'opérateur", "Tu refuses et tu ne le partages jamais", "Tu le donnes à une amie"], correct: 1 },
      { q: "Avant de remettre ton produit, tu dois :", options: ["Vérifier dans ton téléphone que l'argent est bien arrivé", "Faire confiance à une capture d'écran", "Le donner d'abord et attendre"], correct: 0 },
      { q: "Pour rencontrer une nouvelle cliente, le mieux est :", options: ["Chez toi, la nuit", "Dans un lieu public, de jour, si possible accompagnée", "Dans un endroit isolé"], correct: 1 },
      { q: "Les envois et retraits Mobile Money sont taxés. Pour ton prix, tu dois :", options: ["L'oublier", "En tenir compte dans tes calculs", "Demander à la cliente de payer deux fois"], correct: 1 },
    ],
    sources: [S.carMobileMoney, S.carTelecom, S.siyb],
    reviewNote: "À valider avec un opérateur de Mobile Money et une formatrice : règles de sécurité à jour, frais réels. Le contenu pour les moins de 18 ans doit être revu par une personne chargée de la protection de l'enfance.",
  },
  {
    slug: "anglais-debutant",
    title: "Anglais niveau 1 : débutant (A1)",
    summary: "10 leçons pour parler anglais de base : se présenter, compter, faire le marché, vendre, demander de l'aide.",
    icon: "🇬🇧",
    partner: "À confirmer (professeure d'anglais)",
    durationMin: 480,
    outlineMd: "NIVEAU 1 — DÉBUTANT (A1) · 10 leçons · environ 8 heures\nComment apprendre : 20 minutes par jour valent mieux que 3 heures un seul jour. Répète à voix haute. Écris chaque nouveau mot dans un cahier. Entre parenthèses, tu vois comment dire le mot (prononciation en français).\n\nLEÇON 1 — Dire bonjour et se présenter\n- Hello (hèlo) = Bonjour / Salut. Good morning (goud mo-ning) = Bonjour (le matin). Good afternoon (goud afteu-noun) = Bonjour (l'après-midi). Good evening (goud iv-ning) = Bonsoir. Good night (goud naïte) = Bonne nuit. Goodbye (goud-baï) = Au revoir.\n- How are you? (haou ar you) = Comment vas-tu ? → I'm fine, thank you (aïm faïne, thank you) = Je vais bien, merci. And you? (and you) = Et toi ?\n- My name is Grace (maï nème iz Grace) = Je m'appelle Grace. What is your name? (wotte iz yor nème) = Comment t'appelles-tu ? Nice to meet you (naïce tou mite you) = Enchantée.\n- I am from Bangui (aï am from Bangui) = Je viens de Bangui. I am 15 years old (aï am fifteen yiars old) = J'ai 15 ans.\nÀ toi : présente-toi en 4 phrases. Dis-les à voix haute devant un miroir.\n\nLEÇON 2 — Les nombres, l'heure et les jours\n- 1 one (ouane), 2 two (tou), 3 three (thri), 4 four (fo), 5 five (faïve), 6 six (sixe), 7 seven (sèven), 8 eight (éïte), 9 nine (naïne), 10 ten (tène). 20 twenty, 50 fifty, 100 one hundred, 1000 one thousand.\n- Les jours : Monday (monn-dé) lundi, Tuesday (tioz-dé) mardi, Wednesday (wènz-dé) mercredi, Thursday (theurz-dé) jeudi, Friday (fraï-dé) vendredi, Saturday (sa-teur-dé) samedi, Sunday (sonn-dé) dimanche.\n- What time is it? (wotte taïme iz it) = Quelle heure est-il ? It is eight o'clock (it iz éïte oklok) = Il est huit heures.\n- How much is it? (haou motch iz it) = Combien ça coûte ? It is two thousand francs = Ça coûte deux mille francs. Très utile pour vendre !\n\nLEÇON 3 — La famille et les personnes\n- mother (mo-zeur) maman, father (fa-zeur) papa, sister (sis-teur) sœur, brother (bro-zeur) frère, grandmother (grane-mo-zeur) grand-mère, grandfather grand-père, aunt (ânte) tante, uncle (onn-kèl) oncle, daughter (do-teur) fille, son (sonn) fils, friend (frènd) ami(e), baby (bé-bi) bébé.\n- This is my mother (zis iz maï mo-zeur) = Voici ma mère. I have two brothers (aï hav tou bro-zeurz) = J'ai deux frères. My friend is kind (maï frènd iz kaïnd) = Mon amie est gentille.\n- Les mots de base : I (moi), you (toi), he (lui), she (elle), we (nous), they (eux/elles). Le verbe to be : I am, you are, he/she is, we are, they are.\n\nLEÇON 4 — Les couleurs, les objets et la maison\n- red (rède) rouge, blue (blou) bleu, green (grine) vert, yellow (yè-lo) jaune, black (blak) noir, white (ouaïte) blanc, pink (pinke) rose.\n- house (haouss) maison, door (do) porte, table (téï-beul) table, chair (tchère) chaise, bed (bède) lit, phone (fone) téléphone, bag (bague) sac, book (bouk) livre, water (ouo-teur) eau, food (foud) nourriture.\n- What is this? (wotte iz zis) = Qu'est-ce que c'est ? It is a red bag (it iz a rède bague) = C'est un sac rouge. Where is my phone? (wère iz maï fone) = Où est mon téléphone ?\n\nLEÇON 5 — Manger, boire et faire le marché\n- rice (raïce) riz, bread (brède) pain, fish (fiche) poisson, chicken (tchi-kène) poulet, meat (mite) viande, egg (ègue) œuf, banana (ba-na-na), cassava (ka-sa-va) manioc, tomato (to-ma-to) tomate, onion (o-nione) oignon, milk (milke) lait, tea (ti) thé.\n- I want a banana, please (aï wonte a ba-na-na pliz) = Je voudrais une banane, s'il te plaît. How much is the fish? = Combien coûte le poisson ? It is too expensive (it iz tou ek-spèn-sive) = C'est trop cher. Can you give me a good price? (kane you guive mi a goud praïce) = Tu peux me faire un bon prix ?\n- Dialogue : — Hello, madam. — Hello. What do you want? — Two tomatoes and one onion, please. — That is 500 francs. — Here you are. — Thank you. Goodbye!\n\nLEÇON 6 — Les actions de tous les jours (présent)\n- Verbes : eat (ite) manger, drink (drinke) boire, go (go) aller, come (komme) venir, work (weurk) travailler, sell (sèl) vendre, buy (baï) acheter, cook (kouk) cuisiner, sleep (slip) dormir, read (rid) lire, write (raïte) écrire, speak (spik) parler, study (stodi) étudier, help (hèlp) aider.\n- Phrases : I sell clothes (aï sèl klozes) = Je vends des vêtements. She cooks rice (chi kouks raïce) = Elle cuisine du riz. Avec he/she/it on ajoute un s au verbe : he works, she sells.\n- La négation : I do not (don't) eat meat = Je ne mange pas de viande. She does not (doesn't) work today.\n\nLEÇON 7 — Poser des questions\n- Who? (hou) Qui ? What? (wotte) Quoi ? Where? (wère) Où ? When? (wène) Quand ? Why? (ouaï) Pourquoi ? How? (haou) Comment ? How much? Combien ?\n- Where do you live? (wère dou you live) = Où habites-tu ? I live in Bangui. What do you do? (wotte dou you dou) = Que fais-tu (dans la vie) ? I am a student (aï am a stiou-dènte) = Je suis étudiante. I am a seamstress (si-mstrèsse) = Je suis couturière. I sell food = Je vends de la nourriture.\n- Do you speak English? (dou you spik inn-glich) = Parles-tu anglais ? A little (a li-teul) = Un peu. Can you repeat, please? (kane you ri-pite pliz) = Peux-tu répéter ?\n\nLEÇON 8 — Le corps et la santé\n- head (hède) tête, eye (aï) œil, mouth (maouth) bouche, hand (hande) main, stomach (sto-mak) ventre, leg (lègue) jambe, back (bak) dos. I have a headache (aï hav a hède-éïke) = J'ai mal à la tête. My stomach hurts (maï sto-mak heurts) = J'ai mal au ventre.\n- I am sick (aï am sike) = Je suis malade. I need a doctor (aï nid a dok-teur) = J'ai besoin d'un médecin. Please help me! (pliz hèlp mi) = Aide-moi, s'il te plaît ! Call the nurse (kol zeu neurs) = Appelle l'infirmière.\n- Dans un cas grave, dis toujours clairement : I need help! (aï nid hèlp) = J'ai besoin d'aide !\n\nLEÇON 9 — Le travail, l'argent et vendre en anglais\n- shop (chope) boutique, market (mar-kète) marché, customer (kos-to-meur) cliente, price (praïce) prix, money (monn-i) argent, cheap (tchipe) pas cher, expensive (ek-spèn-sive) cher, discount (diss-kaounte) réduction, change (tchéïndj) monnaie, profit (pro-fite) gain.\n- Phrases pour vendre : Welcome! (ouèl-komme) Bienvenue ! What do you need? (wotte dou you nid) Que cherchez-vous ? This is very good (zis iz vè-ri goud) C'est très bien. The price is 3,000 francs. Do you want it? Do you pay with Mobile Money? (dou you péï wize mo-baïl monn-i) Vous payez avec Mobile Money ? I will send you the photo on WhatsApp (aï wil sènd you zeu fo-to onn ouotsap) Je t'envoie la photo sur WhatsApp. Thank you for your order (thank you for yor o-deur) Merci pour ta commande.\n- Pour chercher du travail : I am looking for a job (aï am lou-king for a djobe) = Je cherche du travail. I can sew / cook / sell (aï kane so / kouk / sèl) = Je sais coudre / cuisiner / vendre. Je ne paie jamais pour avoir un travail.\n\nLEÇON 10 — Se débrouiller : téléphone, voyage, révision\n- Au téléphone : Hello, this is Grace (hèlo zis iz Grace). Can I speak to Mary? (kane aï spik tou mè-ri) = Puis-je parler à Mary ? Wait a moment, please (ouéïte a mo-mènte pliz) = Un instant. Sorry, I don't understand (so-ri aï dont onn-deur-stande) = Désolée, je ne comprends pas.\n- Se déplacer : Where is the hospital? (wère iz zeu hos-pi-teul) = Où est l'hôpital ? Turn left (teurn lèfte) tourne à gauche, turn right (raïte) à droite, go straight (go stréïte) tout droit, near (nir) près, far (far) loin.\n- Remercier et s'excuser : Please (pliz) s'il te plaît, Thank you very much (thank you vè-ri motch) merci beaucoup, You are welcome (you ar ouèl-komme) de rien, Excuse me (ek-skiouz mi) excuse-moi, I am sorry (aï am so-ri) je suis désolée.\n- Révision : refais les 9 dialogues à voix haute avec une amie. Quand tu peux te présenter, acheter, vendre, demander de l'aide et dire l'heure, tu as le niveau débutant A1 : tu peux continuer vers le niveau suivant.\n\nASTUCES POUR PROGRESSER : (1) 20 minutes par jour. (2) Mets 5 étiquettes anglaises sur les objets de la maison. (3) Écoute des chansons ou des radios en anglais et répète. (4) Parle avec une amie en anglais 10 minutes par jour. (5) N'aie pas peur de faire des fautes : on apprend en parlant.",
    qcm: [
      { q: "Comment dit-on « Bonjour » en anglais ?", options: ["Hello", "Goodbye", "Thank you"], correct: 0 },
      { q: "« My name is Grace » veut dire :", options: ["J'ai 15 ans", "Je m'appelle Grace", "Je viens de Bangui"], correct: 1 },
      { q: "Que veut dire « thank you » ?", options: ["Au revoir", "S'il te plaît", "Merci"], correct: 2 },
      { q: "Le nombre « seven » est :", options: ["6", "7", "8"], correct: 1 },
      { q: "Comment demande-t-on le prix ?", options: ["How much is it?", "Where is it?", "Who is it?"], correct: 0 },
      { q: "« Friday » est :", options: ["Jeudi", "Vendredi", "Samedi"], correct: 1 },
      { q: "« My sister » veut dire :", options: ["Ma sœur", "Mon frère", "Ma mère"], correct: 0 },
      { q: "« red » est quelle couleur ?", options: ["Bleu", "Vert", "Rouge"], correct: 2 },
      { q: "« I want a banana, please » veut dire :", options: ["Je voudrais une banane, s'il te plaît", "Je vends des bananes", "Où est la banane ?"], correct: 0 },
      { q: "Avec « she », on dit :", options: ["She sell", "She sells", "She sells-s"], correct: 1 },
      { q: "« I do not eat meat » veut dire :", options: ["Je mange de la viande", "Je ne mange pas de viande", "Je vends de la viande"], correct: 1 },
      { q: "« Where do you live? » veut dire :", options: ["Où habites-tu ?", "Quel âge as-tu ?", "Que fais-tu ?"], correct: 0 },
      { q: "Tu es malade et tu as besoin d'aide. Tu dis :", options: ["Good night", "I need help", "I am fine"], correct: 1 },
      { q: "« It is too expensive » veut dire :", options: ["C'est gratuit", "C'est trop cher", "C'est très bon"], correct: 1 },
      { q: "Pour dire à une cliente « Vous payez avec Mobile Money ? » :", options: ["Do you pay with Mobile Money?", "Where is the market?", "What is your name?"], correct: 0 },
      { q: "« Turn left » veut dire :", options: ["Tourne à droite", "Tout droit", "Tourne à gauche"], correct: 2 },
      { q: "Pour mieux apprendre l'anglais, le mieux est :", options: ["20 minutes chaque jour et parler à voix haute", "3 heures un seul jour", "Ne jamais parler par peur des fautes"], correct: 0 },
      { q: "« You are welcome » veut dire :", options: ["De rien", "Merci", "Au revoir"], correct: 0 },
    ],
    sources: [S.cefr, S.britishCouncil],
    reviewNote: "À valider par une professeure d'anglais : prononciations écrites en français à vérifier à l'oral, exemples à adapter au contexte centrafricain. Ce contenu couvre le niveau A1 seulement.",
  },
  {
    slug: "anglais-elementaire-a2",
    title: "Anglais niveau 2 : élémentaire (A2)",
    summary: "Parler du passé et du futur, donner son avis simple, faire des projets, voyager et travailler.",
    icon: "🇬🇧",
    partner: "À confirmer (professeure d'anglais)",
    durationMin: 600,
    outlineMd: "NIVEAU 2 — ÉLÉMENTAIRE (A2) · 10 leçons · environ 10 heures. Avant de commencer : tu dois connaître le niveau 1 (se présenter, nombres, marché, verbes de base).\nComment apprendre : 20 minutes par jour. Répète à voix haute. Écris les nouveaux mots dans un cahier.\n\nLEÇON 1 — Parler du passé (le passé simple)\n- Verbes réguliers : on ajoute -ed. work → worked (j'ai travaillé), cook → cooked, walk → walked, help → helped. Yesterday I cooked rice = Hier j'ai cuisiné du riz.\n- Verbes irréguliers à connaître : go → went (aller), eat → ate (manger), see → saw (voir), buy → bought (acheter), sell → sold (vendre), have → had (avoir), make → made (faire), come → came (venir), give → gave (donner), take → took (prendre).\n- Négation : I did not (didn't) go to school = Je ne suis pas allée à l'école. Question : Did you eat? = As-tu mangé ? Yes, I did. / No, I didn't.\n- Mots du passé : yesterday (hier), last week (la semaine dernière), last year (l'année dernière), two days ago (il y a deux jours).\n\nLEÇON 2 — Parler du futur et faire des projets\n- Will + verbe : I will call you tomorrow (je t'appellerai demain). Going to + verbe : I am going to sell clothes (je vais vendre des vêtements).\n- Mots du futur : tomorrow (demain), next week (la semaine prochaine), next month (le mois prochain), soon (bientôt).\n- Projets : What are you going to do on Saturday? = Que vas-tu faire samedi ? I am going to visit my aunt = Je vais rendre visite à ma tante. I want to open a small shop = Je veux ouvrir une petite boutique.\n\nLEÇON 3 — Décrire les personnes et les choses\n- Adjectifs : tall (grande), short (petite), young (jeune), old (âgée), beautiful (belle), strong (forte), funny (drôle), shy (timide), kind (gentille), clever/smart (intelligente), hard-working (travailleuse).\n- Comparer : bigger than (plus grand que), smaller than, cheaper than (moins cher que), more expensive than (plus cher que). The market is bigger than the shop. This bag is cheaper than that one.\n- Le meilleur : the best (le meilleur), the biggest, the most beautiful. She is the best seller in the market.\n- Décrire une personne : She is tall and kind. She has long black hair (elle a de longs cheveux noirs).\n\nLEÇON 4 — Le temps, les saisons et les activités\n- Météo : sunny (ensoleillé), rainy (pluvieux), cloudy (nuageux), hot (chaud), cold (froid), It is raining (il pleut), It is very hot today.\n- Saisons chez nous : the dry season (la saison sèche), the rainy season (la saison des pluies).\n- Loisirs : I like dancing / singing / cooking / playing football. Do you like music? = Aimes-tu la musique ? Yes, I love it! / No, I don't like it.\n- Fréquence : always (toujours), usually (d'habitude), sometimes (parfois), never (jamais). I always wash my hands before eating.\n\nLEÇON 5 — Au restaurant, à l'hôpital et à la banque\n- Restaurant : I would like rice and fish, please (je voudrais du riz et du poisson). Can I have the bill, please? (L'addition, s'il vous plaît.) The food is delicious.\n- Santé : I have a fever (j'ai de la fièvre), I have a cough (je tousse), I feel dizzy (j'ai la tête qui tourne), How long have you been sick? Since two days. Take this medicine twice a day = Prends ce médicament deux fois par jour.\n- Argent : I want to send money (je veux envoyer de l'argent), I want to withdraw money (retirer de l'argent), What is the fee? = Quels sont les frais ?\n\nLEÇON 6 — Le travail et les entretiens simples\n- Métiers : seamstress, hairdresser (coiffeuse), trader (commerçante), tailor, cashier (caissière), secretary (secrétaire), receptionist, teacher, nurse.\n- Entretien : Tell me about yourself = Parle-moi de toi. I have two years of experience in sewing = J'ai deux ans d'expérience en couture. I am hard-working and I learn fast = Je travaille dur et j'apprends vite. When can you start? = Quand peux-tu commencer ?\n- Rappel important : un vrai employeur ne te demande JAMAIS de l'argent pour te donner un travail.\n\nLEÇON 7 — Écrire un message et un e-mail simple\n- Début : Dear Mrs Smith (Chère Madame), Hello Mary. Fin : Best regards (Cordialement), Thank you, See you soon (À bientôt).\n- Modèle : Hello, I am Grace. I am interested in the job. I can sew and sell. My phone number is 0 0 0 0. Thank you.\n- Message à une cliente : Good morning! Your order is ready. You can come at 3 pm. Thank you for choosing us.\n- Écrire une adresse e-mail : name at gmail dot com (name@gmail.com) = « name at gmail dot com ».\n\nLEÇON 8 — Vendre et négocier en anglais\n- Négocier : Can you give me a discount? = Peux-tu me faire une réduction ? I can give you 10 percent off. This is my last price. If you buy two, I give you a better price.\n- Promotion : Special offer today! Buy one, get one free. New arrival (nouvel arrivage). Limited stock (stock limité).\n- Livraison : Where do you live? We can deliver to your home. Delivery costs 1,000 francs. When can you receive it?\n- Conclure : Thank you for your order! Please send me your feedback.\n\nLEÇON 9 — Voyager et se débrouiller en ville\n- Transports : bus, taxi, motorbike (moto), plane (avion), ticket (billet), station (gare/station), airport (aéroport). One ticket to Douala, please.\n- Demander son chemin : Excuse me, how can I get to the hospital? Go straight, then turn left. It is next to the market / opposite the school / behind the church.\n- Hébergement : I have a reservation (j'ai une réservation). How much is a room for one night?\n\nLEÇON 10 — Révision et test de niveau A2\n- Révise les verbes irréguliers (go/went, eat/ate, buy/bought, sell/sold).\n- Écris un paragraphe de 6 phrases sur ta journée d'hier. Lis-le à voix haute.\n- Si tu peux parler du passé, du futur, décrire, négocier un prix et demander ton chemin, tu es au niveau A2.",
    qcm: [
      { q: "Hier, « I went to the market » veut dire :", options: ["Je vais au marché", "Je suis allée au marché", "J'irai au marché"], correct: 1 },
      { q: "Le passé de « sell » est :", options: ["selled", "sold", "sell"], correct: 1 },
      { q: "Pour le futur, on dit :", options: ["I will call you tomorrow", "I called you tomorrow", "I calling you tomorrow"], correct: 0 },
      { q: "« cheaper than » veut dire :", options: ["plus cher que", "moins cher que", "aussi cher que"], correct: 1 },
      { q: "« I would like rice and fish, please » est :", options: ["Une demande polie au restaurant", "Une dispute", "Un salut"], correct: 0 },
      { q: "« last week » veut dire :", options: ["la semaine prochaine", "la semaine dernière", "chaque semaine"], correct: 1 },
      { q: "« Did you eat? » veut dire :", options: ["As-tu mangé ?", "Vas-tu manger ?", "Manges-tu ?"], correct: 0 },
      { q: "« Can you give me a discount? » veut dire :", options: ["Peux-tu me faire une réduction ?", "Où est le marché ?", "Combien de temps ?"], correct: 0 },
      { q: "« never » veut dire :", options: ["toujours", "parfois", "jamais"], correct: 2 },
      { q: "Un employeur sérieux peut te demander de payer pour avoir un travail.", options: ["Vrai", "Faux"], correct: 1 },
      { q: "« It is next to the market » veut dire :", options: ["Il est à côté du marché", "Il est loin du marché", "Il est dans le marché"], correct: 0 },
      { q: "« I have a fever » veut dire :", options: ["J'ai de la fièvre", "J'ai faim", "J'ai peur"], correct: 0 },
      { q: "« Delivery costs 1,000 francs » veut dire :", options: ["La livraison coûte 1 000 francs", "Je livre gratuitement", "Le prix est 100 francs"], correct: 0 },
    ],
    sources: [S.cefr, S.britishCouncil],
    reviewNote: "À valider par une professeure d'anglais. Pas d'audio : la prononciation est écrite en français.",
  },
  {
    slug: "anglais-intermediaire-b1",
    title: "Anglais niveau 3 : intermédiaire (B1)",
    summary: "Raconter, expliquer, donner son opinion, écrire des textes, comprendre une conversation courante.",
    icon: "🇬🇧",
    partner: "À confirmer (professeure d'anglais)",
    durationMin: 720,
    outlineMd: "NIVEAU 3 — INTERMÉDIAIRE (B1) · 10 leçons · environ 12 heures. Avant de commencer : tu dois connaître le niveau 2 (passé simple, futur, décrire).\nComment apprendre : 20 minutes par jour. Répète à voix haute. Écris les nouveaux mots dans un cahier.\n\nLEÇON 1 — Le présent parfait (have/has + participe passé)\n- Il relie le passé au présent : I have lived in Bangui for ten years (j'habite à Bangui depuis dix ans). She has sold 50 bags this month.\n- Participes passés : been (été), done (fait), seen (vu), eaten (mangé), written (écrit), taken (pris), bought, sold, made, gone.\n- Mots : already (déjà), yet (encore/déjà en question), just (à l'instant), ever (jamais/déjà), never (jamais), for (pendant), since (depuis). Have you ever sold online? Not yet.\n- Différence : I went to Douala last year (passé précis). I have been to Douala (expérience, sans date).\n\nLEÇON 2 — Passé simple ou passé continu\n- Past continuous : was/were + verbe en -ing. I was cooking when you called (j'étais en train de cuisiner quand tu as appelé).\n- When + passé simple, while + passé continu : While I was selling, a customer arrived.\n- Used to : I used to sell fruit; now I sell clothes (avant, je vendais des fruits).\n\nLEÇON 3 — Donner son opinion et être d'accord\n- I think that... (je pense que...), In my opinion... (à mon avis...), I believe... (je crois), I agree / I disagree (je suis d'accord / pas d'accord), That is true / I am not sure.\n- Raisons : because (parce que), so (donc), but (mais), however (cependant), although (bien que), for example (par exemple).\n- Exemple : In my opinion, girls should study because education gives them freedom. However, they also need support from their family.\n\nLEÇON 4 — Conditions et conseils\n- If + présent, will + verbe : If you work hard, you will succeed (si tu travailles dur, tu réussiras). If it rains, I will stay at home.\n- Conseils : You should (tu devrais), You should not (tu ne devrais pas), Why don't you...? (Pourquoi tu ne...?), It is better to... You should save a little money every week.\n- Obligation : must (devoir), have to (devoir), need to. You must keep your PIN secret.\n\nLEÇON 5 — Parler de sa santé et de la santé en général\n- Santé de la femme : period (règles), pregnancy (grossesse), midwife (sage-femme), clinic (clinique), vaccine, hygiene. I need to see a midwife.\n- Conseils sanitaires : Wash your hands with soap. Drink clean water. Eat vegetables and beans. Sleep at least eight hours.\n- Expliquer un problème : I have had a stomach ache since yesterday. It started after lunch. I feel weak.\n\nLEÇON 6 — Écrire : lettre de motivation et CV simple\n- CV : Name, Phone, Education (études), Experience (expérience), Skills (compétences), Languages (langues).\n- Lettre : Dear Sir or Madam, I am writing to apply for the position of... I have experience in... I am reliable and motivated. I would be grateful for the opportunity to meet you. Yours faithfully, Grace.\n- Compétences : team work (travail en équipe), customer service (service client), time management (gestion du temps), communication.\n\nLEÇON 7 — Marketing digital en anglais\n- Vocabulaire : online shop, page, post, share (partager), like, follow (suivre), followers (abonnés), advertising (publicité), brand (marque), offer, discount code.\n- Un bon post : Photo + short text + price + how to order. New dresses! 8,000 francs. Message us on WhatsApp.\n- Statistiques simples : This post got 120 likes and 15 messages. We sold 5 dresses this week.\n\nLEÇON 8 — Passif simple et phrases plus riches\n- Passif : The bread is made every morning (le pain est fait chaque matin). The bag was sold yesterday.\n- Relier : who (qui, personne), which (qui/que, chose), where (où). The woman who sells fish is my aunt. The market where I work is big.\n- Mots de liaison : first, then, after that, finally (d'abord, puis, ensuite, enfin).\n\nLEÇON 9 — Comprendre une conversation et une annonce\n- Stratégie : écoute le sujet général d'abord, puis les chiffres, les noms et les lieux. Demande de répéter : Could you say that again, please? Could you speak more slowly?\n- Phrases courantes : I'm afraid I can't (je crains de ne pas pouvoir), Would you mind...? (Cela te dérangerait-il de...?), By the way (au fait), It depends (cela dépend).\n- Écoute chaque jour 10 minutes d'une radio ou d'une vidéo en anglais.\n\nLEÇON 10 — Révision et test de niveau B1\n- Raconte en 10 phrases une expérience (un voyage, un travail, une vente réussie) avec le passé et le présent parfait.\n- Donne ton opinion sur un sujet (l'éducation des filles) avec 3 raisons.\n- Si tu peux raconter, donner ton avis, écrire un CV et comprendre une conversation courante, tu es au niveau B1.",
    qcm: [
      { q: "« I have lived in Bangui for ten years » veut dire :", options: ["J'habite à Bangui depuis dix ans", "J'ai habité à Bangui il y a dix ans", "J'habiterai à Bangui"], correct: 0 },
      { q: "Le participe passé de « write » est :", options: ["wrote", "written", "writed"], correct: 1 },
      { q: "« If you work hard, you will succeed » est une phrase de :", options: ["condition", "passé", "comparaison"], correct: 0 },
      { q: "« You should save money » veut dire :", options: ["Tu dois dépenser", "Tu devrais épargner", "Tu ne peux pas épargner"], correct: 1 },
      { q: "« however » veut dire :", options: ["donc", "cependant", "parce que"], correct: 1 },
      { q: "« Could you say that again, please? » sert à :", options: ["Demander de répéter", "Dire au revoir", "Refuser"], correct: 0 },
      { q: "« I used to sell fruit » veut dire :", options: ["Avant, je vendais des fruits", "Je vais vendre des fruits", "Je vends des fruits maintenant"], correct: 0 },
      { q: "« followers » veut dire :", options: ["abonnés", "clientes", "commandes"], correct: 0 },
      { q: "« The bread is made every morning » est :", options: ["un passif", "un futur", "une question"], correct: 0 },
      { q: "« I have never been to Douala » veut dire :", options: ["Je ne suis jamais allée à Douala", "Je vais à Douala", "Je suis née à Douala"], correct: 0 },
      { q: "Dans un CV, « Skills » veut dire :", options: ["Compétences", "Études", "Adresse"], correct: 0 },
      { q: "« In my opinion » veut dire :", options: ["À mon avis", "Dans ma maison", "Pendant mon travail"], correct: 0 },
      { q: "« It depends » veut dire :", options: ["Cela dépend", "C'est fini", "C'est trop cher"], correct: 0 },
    ],
    sources: [S.cefr, S.britishCouncil],
    reviewNote: "À valider par une professeure d'anglais. Pas d'audio : la prononciation est écrite en français.",
  },
  {
    slug: "anglais-avance-b2",
    title: "Anglais niveau 4 : avancé (B2)",
    summary: "Parler avec aisance, argumenter, présenter une idée, négocier et écrire des textes professionnels.",
    icon: "🇬🇧",
    partner: "À confirmer (professeure d'anglais)",
    durationMin: 900,
    outlineMd: "NIVEAU 4 — AVANCÉ (B2) · 10 leçons · environ 15 heures. Avant de commencer : tu dois connaître le niveau 3 (présent parfait, opinion, CV).\nComment apprendre : 20 minutes par jour. Répète à voix haute. Écris les nouveaux mots dans un cahier.\n\nLEÇON 1 — Les temps du passé en détail\n- Past perfect (had + participe passé) : When I arrived, the shop had already closed (quand je suis arrivée, la boutique avait déjà fermé).\n- Present perfect continuous : I have been learning English for six months (j'apprends l'anglais depuis six mois, et je continue).\n- Raconter une histoire : At first... Then... Meanwhile... In the end... (Au début... Puis... Pendant ce temps... À la fin...).\n\nLEÇON 2 — Conditionnels et hypothèses\n- Si + passé, would + verbe : If I had more money, I would open a bigger shop (si j'avais plus d'argent, j'ouvrirais une plus grande boutique).\n- Si + past perfect, would have + participe : If I had studied more, I would have passed (si j'avais plus étudié, j'aurais réussi).\n- Souhaits : I wish I could speak English better. I wish I had started earlier.\n\nLEÇON 3 — Argumenter et débattre\n- Introduire : To begin with, Firstly, Moreover (de plus), Furthermore, In addition.\n- Contraster : On the one hand... on the other hand..., Nevertheless (néanmoins), Despite (malgré), Whereas (alors que).\n- Conclure : To sum up, In conclusion, All things considered (tout bien considéré).\n- Exemple de débat : Should girls have the same education as boys? Argue for or against with three reasons and one example.\n\nLEÇON 4 — Le discours rapporté\n- Dire ce que quelqu'un a dit : She said that she was tired (elle a dit qu'elle était fatiguée). He told me that he would call. They asked if I could come.\n- Changements : now → then, today → that day, tomorrow → the next day, here → there.\n- Verbes : say, tell, ask, explain, suggest, promise, warn.\n\nLEÇON 5 — L'entreprise : plan, budget et marketing\n- Business plan : goal (objectif), target customers (clients visés), costs (coûts), revenue (revenu), profit margin (marge), budget, loan (prêt), savings (épargne), investment.\n- Expliquer un projet : My business sells traditional clothes to young women. We aim to reach 100 customers in six months.\n- Marketing : branding, social media campaign, customer loyalty (fidélité), word of mouth (bouche-à-oreille), testimonial (témoignage).\n\nLEÇON 6 — Entretien d'embauche et réunions\n- Questions courantes : What are your strengths and weaknesses? Why do you want this job? Where do you see yourself in five years? Tell me about a problem you solved.\n- Réponses : My main strength is my reliability. I solved a problem by staying calm and listening to the customer.\n- En réunion : Let me add something. I would like to suggest... Could we move on to the next point? I see your point, but...\n\nLEÇON 7 — Droits, santé et société\n- Vocabulaire : equality (égalité), gender (genre), violence, consent (consentement), harassment (harcèlement), protection, support, law (loi), justice, community.\n- Exprimer son soutien : Every girl has the right to education and safety. Nobody should be forced to marry.\n- Demander de l'aide : I need to talk to someone about a problem. Is there a safe place where I can get help?\n\nLEÇON 8 — Écrire un rapport et un e-mail professionnel\n- E-mail professionnel : Subject: Request for information. Dear Mr Jones, I am writing to ask about... Please find attached... I look forward to your reply. Kind regards.\n- Rapport : Introduction, Main points, Conclusion, Recommendations.\n- Ton : formel (I would like to...) ou informel (I'd like to...).\n\nLEÇON 9 — Comprendre l'anglais authentique\n- Accents : anglais britannique, américain, africain (Nigeria, Ghana, Kenya). Écoute des infos, des podcasts, des vidéos éducatives.\n- Expressions courantes : It's a piece of cake (c'est facile), Break a leg (bonne chance), Once in a blue moon (très rarement), Let's keep in touch (restons en contact).\n- Méthode : écoute 3 fois : (1) idée générale, (2) détails, (3) mots nouveaux à noter.\n\nLEÇON 10 — Révision et test de niveau B2\n- Présente en 3 minutes un projet de petite entreprise (produit, clientes, prix, plan).\n- Débat : donne 3 arguments pour ou contre un sujet.\n- Si tu peux argumenter, présenter, négocier et comprendre l'essentiel d'un document, tu es au niveau B2.",
    qcm: [
      { q: "« The shop had already closed » est au :", options: ["past perfect", "futur", "présent"], correct: 0 },
      { q: "« If I had more money, I would open a shop » exprime :", options: ["Une hypothèse", "Un ordre", "Un fait certain"], correct: 0 },
      { q: "« Moreover » veut dire :", options: ["de plus", "malgré", "donc"], correct: 0 },
      { q: "« She said that she was tired » est :", options: ["du discours rapporté", "une question", "un ordre"], correct: 0 },
      { q: "« revenue » veut dire :", options: ["revenu", "dette", "ordre"], correct: 0 },
      { q: "« word of mouth » veut dire :", options: ["bouche-à-oreille", "parler fort", "publicité à la télé"], correct: 0 },
      { q: "« Nevertheless » veut dire :", options: ["néanmoins", "jamais", "souvent"], correct: 0 },
      { q: "« I wish I had started earlier » exprime :", options: ["un regret", "un projet", "un ordre"], correct: 0 },
      { q: "« Kind regards » termine :", options: ["un e-mail poli", "une dispute", "un contrat de vente"], correct: 0 },
      { q: "« It's a piece of cake » veut dire :", options: ["C'est facile", "C'est un gâteau", "C'est cher"], correct: 0 },
      { q: "« loan » veut dire :", options: ["prêt", "perte", "gain"], correct: 0 },
      { q: "« consent » veut dire :", options: ["consentement", "conseil", "conflit"], correct: 0 },
      { q: "« Despite the rain, we sold everything » veut dire :", options: ["Malgré la pluie, nous avons tout vendu", "À cause de la pluie, rien vendu", "Grâce à la pluie, tout vendu"], correct: 0 },
    ],
    sources: [S.cefr, S.britishCouncil],
    reviewNote: "À valider par une professeure d'anglais.",
  },
  {
    slug: "anglais-expert-c1",
    title: "Anglais niveau 5 : expert (C1)",
    summary: "S'exprimer avec précision, convaincre, écrire des textes longs, travailler dans un environnement international.",
    icon: "🇬🇧",
    partner: "À confirmer (professeure d'anglais)",
    durationMin: 1080,
    outlineMd: "NIVEAU 5 — EXPERT (C1) · 10 leçons · environ 18 heures. Avant de commencer : tu dois connaître le niveau 4 (hypothèses, discours rapporté, argumenter).\nComment apprendre : 20 minutes par jour. Répète à voix haute. Écris les nouveaux mots dans un cahier.\n\nLEÇON 1 — Nuances et précision\n- Mots de degré : quite, rather, fairly, extremely, slightly, hardly, barely. The task was rather difficult. She barely had time to rest.\n- Synonymes : big → huge / enormous, good → excellent / outstanding, bad → terrible / awful, say → state / declare / mention, think → believe / consider / assume.\n- Collocations : make a decision, take a risk, do business, pay attention, meet a deadline (respecter un délai).\n\nLEÇON 2 — Grammaire avancée\n- Inversion pour insister : Never have I seen such talent. Not only did she study, but she also worked.\n- Subjonctif et formules : It is essential that she be present. I suggest that he go. If only I knew...\n- Voix passive complexe : It is said that... It is believed that... The report is being written.\n- Phrases relatives : The woman whose shop I visited is a lawyer.\n\nLEÇON 3 — Persuader et présenter en public\n- Structure : Hook (accroche) → Problem → Solution → Evidence → Call to action. Imagine a world where every girl can learn and earn. Together, we can make it happen.\n- Rhétorique : rhetorical question, repetition, three examples.\n- Gestes et voix : parle lentement, regarde le public, fais des pauses.\n- Phrases : Let me start by telling you a story. The key point is... I would like to draw your attention to...\n\nLEÇON 4 — Négociation et affaires internationales\n- Négocier : We would be willing to... provided that... (à condition que). That is our best offer. Let's find a middle ground (un compromis). We need to reach an agreement.\n- Contrat : terms and conditions (conditions), deadline, penalty, payment schedule (calendrier de paiement), invoice (facture), receipt (reçu).\n- Import-export : customs (douane), shipping, tax, supplier (fournisseur).\n\nLEÇON 5 — Leadership, entrepreneuriat et finance\n- Leadership : to lead a team, to motivate, to delegate (déléguer), to give feedback, accountability (responsabilité), vision.\n- Finance : cash flow (trésorerie), break-even point (seuil de rentabilité), interest rate (taux d'intérêt), microfinance, credit, risk, insurance.\n- Pitch de 1 minute : My name is... My business... Our customers... We need... to grow.\n\nLEÇON 6 — Écrire : essai, article et proposition\n- Essai : Introduction avec thèse, 3 paragraphes avec arguments et exemples, conclusion.\n- Article : titre accrocheur, intro courte, faits, citations, conclusion.\n- Proposition de projet : Background, Objectives, Activities, Budget, Expected results.\n- Style : phrases variées, mots de liaison, ton adapté, relecture.\n\nLEÇON 7 — Débats de société\n- Sujets : education and employment of girls, health rights, technology and social media, climate and farming, migration, peace and security.\n- Nuancer : It could be argued that... There is evidence that... Some people claim that..., yet...\n- Rester respectueuse : I see it differently. May I add a point? That is an interesting perspective.\n\nLEÇON 8 — Humour, expressions et culture\n- Idioms : to break the ice (briser la glace), to be on the same page (être sur la même longueur d'onde), the ball is in your court (c'est à toi de jouer), to hit the nail on the head (taper dans le mille), better late than never.\n- Proverbes africains en anglais : If you want to go fast, go alone; if you want to go far, go together.\n- Les différences culturelles dans les affaires : ponctualité, politesse, contact visuel.\n\nLEÇON 9 — Technologie, numérique et sécurité\n- Vocabulaire : password, encryption, privacy, data, scam (arnaque), phishing, update, app, platform, algorithm, content creator.\n- Prudence en ligne : Never share your PIN or password. Verify the identity of a buyer. Do not send money to strangers. Report suspicious accounts.\n- Créer du contenu : script, caption (légende), hashtag, engagement, audience.\n\nLEÇON 10 — Révision et test de niveau C1\n- Prépare un pitch de 2 minutes en anglais sur ton projet. Enregistre-toi et réécoute.\n- Écris un essai de 250 mots sur « Why education changes a girl's future ».\n- Si tu peux nuancer, persuader, négocier et écrire avec précision, tu es au niveau C1 : tu peux étudier, travailler et vendre en anglais.",
    qcm: [
      { q: "« barely » veut dire :", options: ["à peine", "souvent", "très"], correct: 0 },
      { q: "« Not only did she study, but she also worked » utilise :", options: ["l'inversion", "le passif", "le futur simple"], correct: 0 },
      { q: "« break-even point » veut dire :", options: ["seuil de rentabilité", "retard de paiement", "taux d'intérêt"], correct: 0 },
      { q: "« Let's find a middle ground » veut dire :", options: ["Trouvons un compromis", "Partons maintenant", "Changeons de lieu"], correct: 0 },
      { q: "« to break the ice » veut dire :", options: ["briser la glace (détendre l'ambiance)", "casser de la glace", "partir vite"], correct: 0 },
      { q: "« phishing » est :", options: ["une arnaque en ligne par faux messages", "un sport", "un poisson"], correct: 0 },
      { q: "« accountability » veut dire :", options: ["responsabilité", "compte bancaire", "avantage"], correct: 0 },
      { q: "« It could be argued that... » sert à :", options: ["nuancer une opinion", "dire au revoir", "poser une question simple"], correct: 0 },
      { q: "« provided that » veut dire :", options: ["à condition que", "parce que", "malgré"], correct: 0 },
      { q: "« invoice » veut dire :", options: ["facture", "reçu", "contrat"], correct: 0 },
      { q: "« the ball is in your court » veut dire :", options: ["c'est à toi de décider ou d'agir", "il y a un match", "le ballon est perdu"], correct: 0 },
      { q: "Dans un pitch, on commence souvent par :", options: ["une accroche qui capte l'attention", "la fin de l'histoire", "des excuses"], correct: 0 },
      { q: "« supplier » veut dire :", options: ["fournisseur", "cliente", "voisin"], correct: 0 },
    ],
    sources: [S.cefr, S.britishCouncil],
    reviewNote: "À valider par une professeure d'anglais. Ce niveau demande de la pratique orale avec une personne anglophone : prévoir des séances de conversation entre filles ou avec une bénévole.",
  },
  {
    slug: "bien-gerer-son-argent",
    title: "Bien gérer mon argent : épargne et tontine",
    summary: "Mettre de l'argent de côté avec d'autres, groupes d'épargne, éviter les dettes qu'on ne peut pas payer.",
    icon: "💰",
    partner: "FAFECA",
    durationMin: 60,
    outlineMd: "1. Pourquoi mettre de côté, même un tout petit peu (10 min)\n2. Les groupes d'épargne : comment ça marche, les règles, la caisse fermée à clé (25 min)\n3. Emprunter avec prudence (15 min)\n4. Tes questions (10 min)",
    qcm: [
      { q: "Dans un groupe d'épargne, l'intérêt payé sur les prêts :", options: ["Reste dans le groupe et fait grossir la caisse", "Part dans une banque étrangère", "Disparaît"], correct: 0 },
      { q: "Avant d'emprunter, je dois :", options: ["Être sûre de pouvoir rembourser", "Emprunter le plus possible", "Cacher le prêt à ma famille"], correct: 0 },
    ],
    sources: [S.careVsla, S.vslaCar],
  },
  {
    slug: "initiation-telephone-informatique",
    title: "Bien utiliser mon téléphone et l'ordinateur",
    summary: "Utiliser mon téléphone sans danger, Mobile Money, écrire un message ou un document.",
    icon: "💻",
    partner: "Atelier numérique (à confirmer)",
    durationMin: 60,
    outlineMd: "1. Utiliser mon téléphone sans danger : code secret, arnaques (20 min)\n2. Mobile Money : envoyer, recevoir, vérifier (20 min)\n3. Écrire et envoyer un e-mail, garder un document (20 min)",
    qcm: [
      { q: "Un bon code secret est :", options: ["Ton prénom", "Long, à toi seule, et jamais donné à personne", "123456"], correct: 1 },
      { q: "Quelqu'un que tu ne connais pas te demande ton code Mobile Money. Que fais-tu ?", options: ["Je le donne", "Je refuse et je ne le donne jamais", "Je le donne s'il dit qu'il travaille pour l'opérateur"], correct: 1 },
    ],
    sources: [],
    reviewNote: "Aucune source externe encore associée : le partenaire du cours doit fournir son programme et ses références avant publication.",
  },
];

// ---------------------------------------------------------------------------
// ACTIVITÉS GÉNÉRATRICES DE REVENUS
// Montants INDICATIFS en FCFA à ajuster avec les prix réels de Bangui avant publication.
// ---------------------------------------------------------------------------

export interface IncomeSeed {
  slug: string;
  title: string;
  icon: string;
  capitalMinFcfa: number;
  summary: string;
  needsMd: string;
  stepsMd: string;
  risksMd: string;
  courseSlug?: string;
  sources: Source[];
}

const COMMON_RISKS =
  "• Les prix sont des exemples. Regarde les vrais prix au marché avant de commencer.\n• Commence petit. Note chaque achat et chaque vente. Ne mélange pas l'argent du commerce et l'argent de la maison.\n• Ne fais pas de dette si tu n'es pas sûre de pouvoir la payer.";

export const INCOME: IncomeSeed[] = [
  {
    slug: "chercher-du-travail-plan-daction",
    title: "Chercher du travail : mon plan d'action",
    icon: "🔎",
    capitalMinFcfa: 0,
    summary: "Un plan simple pour trouver un travail ou un apprentissage sans dépenser d'argent.",
    needsMd: "• Aucun argent n'est nécessaire.\n• Un cahier et un crayon. Un téléphone, si possible.\n• Une personne de confiance qui t'aide (maman, tante, maîtresse, grande sœur).",
    stepsMd: "SEMAINE 1 : Je prépare.\n1. J'écris ce que je sais faire (cuisiner, coudre, vendre, bien parler, compter, coiffer...).\n2. Je choisis 2 ou 3 métiers qui me plaisent.\n3. Je prépare une présentation de 30 secondes : mon prénom, ce que je sais faire, ce que je cherche.\nSEMAINE 2 : Je cherche.\n4. Je dis à 10 personnes que je cherche du travail ou un apprentissage : famille, voisins, église ou mosquée, FAFECA.\n5. Je vais voir 3 ateliers ou boutiques près de chez moi (couture, coiffure, restaurant, boutique). Je demande si je peux apprendre ou aider.\nSEMAINE 3 : Je propose.\n6. Je propose d'essayer 1 ou 2 jours sans être payée. Si ça se passe bien, je demande un petit paiement ou un apprentissage.\nSEMAINE 4 : Je continue.\n7. Je retourne voir ceux qui m'ont dit « peut-être ». Je dis merci à ceux qui m'ont aidée.\n8. Je note ce qui a marché dans mon cahier.",
    risksMd: "• Ne paie JAMAIS pour avoir un travail. Une vraie entreprise ne demande pas d'argent pour t'embaucher.\n• Ne va pas seule dans un endroit isolé pour un « entretien ». Dis à un adulte où tu vas.\n• Méfie-toi de celui qui promet un travail à l'étranger ou beaucoup d'argent très vite.",
    sources: [S.siyb],
  },
  {
    slug: "vendre-ses-competences-sans-argent",
    title: "Vendre mes compétences (sans argent au départ)",
    icon: "🧠",
    capitalMinFcfa: 0,
    summary: "Gagner un peu d'argent avec ce que je sais déjà faire : tresser, faire la cuisine, aider à l'école, faire des courses, laver...",
    needsMd: "• Aucun argent n'est nécessaire.\n• Un savoir-faire : coiffer, repasser, faire le ménage, garder des enfants, aider aux devoirs, écrire, faire des courses, porter des charges.\n• Ton temps et ton sérieux.",
    stepsMd: "1. Je choisis UN service que je sais bien faire.\n2. Je fixe un prix simple (par exemple pour une heure ou pour une tâche).\n3. Je dis à mes voisines et à ma famille : « Je peux faire ça, pour tel prix ».\n4. Je fais très bien le premier travail. Je suis à l'heure et polie.\n5. Je demande à la cliente de parler de moi à d'autres.\n6. Quand j'ai un peu d'argent, je le mets de côté pour acheter ce qui me manque (matériel, tissu, produits).",
    risksMd: "• Ne travaille pas pour quelqu'un qui te fait peur ou te touche sans ton accord. Dis-le à un adulte de confiance.\n• Fais-toi payer à la fin du travail, ou une partie avant pour les gros travaux." + COMMON_RISKS,
    sources: [S.siyb],
  },
  {
    slug: "vente-nourriture-preparee",
    title: "Vendre de la nourriture cuisinée",
    icon: "🍲",
    capitalMinFcfa: 10000,
    summary: "Beignets, haricots, poisson grillé, jus. On commence avec peu d'argent et on vend chaque jour.",
    needsMd: "• Environ 10 000 FCFA pour commencer : ingrédients pour quelques jours, huile, charbon ou gaz.\n• Une marmite, un foyer ou un réchaud, des assiettes ou des emballages propres.\n• Un bon endroit pour vendre : devant la maison, près d'une école ou du marché.",
    stepsMd: "1. Je choisis un plat que je sais bien faire et que les gens du quartier achètent déjà.\n2. Je compte ce que me coûte chaque part (ingrédients + charbon ou gaz). Je fixe mon prix en gardant un gain.\n3. Je commence avec peu de quantité pour ne pas jeter.\n4. Chaque jour, j'écris dans mon cahier : ce que j'ai dépensé, ce que j'ai vendu, ce qui reste.\n5. Je mets un peu du gain de côté pour racheter les ingrédients.\nPLAN DES 30 PREMIERS JOURS : semaine 1 petite quantité, semaine 2 je vois ce qui se vend le mieux, semaine 3 je garde seulement les plats qui partent vite, semaine 4 je compte mon gain.",
    risksMd: "• Propreté : mains lavées, marmite et assiettes propres, nourriture couverte.\n" + COMMON_RISKS,
    courseSlug: "creer-sa-petite-entreprise",
    sources: [S.siyb],
  },
  {
    slug: "petit-commerce-quartier",
    title: "Petite boutique dans mon quartier",
    icon: "🛒",
    capitalMinFcfa: 15000,
    summary: "Vendre des choses qu'on achète tous les jours : savon, sel, sucre, allumettes, légumes.",
    needsMd: "• Environ 15 000 FCFA pour commencer.\n• Une table, une bassine ou un étal, des sachets, une balance ou des mesures si besoin.",
    stepsMd: "1. Je regarde ce que mes voisins achètent souvent et ce qui manque près de chez moi.\n2. J'achète en petite quantité au grand marché. Je compare les prix.\n3. Je vends en petites parts, avec un gain.\n4. Je rachète souvent ce qui part vite.\nPLAN DES 30 PREMIERS JOURS : semaine 1 j'achète 5 produits, semaine 2 je note ceux qui partent le plus, semaine 3 j'ajoute 2 produits, semaine 4 je compte mon gain.",
    risksMd: COMMON_RISKS,
    courseSlug: "creer-sa-petite-entreprise",
    sources: [S.siyb],
  },
  {
    slug: "coiffure-tresses",
    title: "Coiffure et tresses",
    icon: "💇🏾‍♀️",
    capitalMinFcfa: 20000,
    summary: "Coiffer à la maison ou dans un petit salon, avec peu de matériel.",
    needsMd: "• Environ 20 000 FCFA : peignes, élastiques, mèches, produits.\n• Un endroit propre et une chaise.",
    stepsMd: "1. Je m'entraîne, ou je vais apprendre chez une coiffeuse qui connaît bien le métier.\n2. Je dis dans le quartier que je coiffe.\n3. Je fixe un prix par coiffure, selon le temps et le matériel.\n4. Je nettoie mes peignes et mon matériel entre deux clientes.",
    risksMd: COMMON_RISKS,
    sources: [S.siyb],
  },
  {
    slug: "credit-telephone-mobile-money",
    title: "Vendre du crédit de téléphone",
    icon: "📱",
    capitalMinFcfa: 25000,
    summary: "Vendre du crédit et de petits accessoires à un endroit où les gens passent.",
    needsMd: "• Environ 25 000 FCFA pour avoir du crédit à vendre.\n• Un téléphone chargé et un endroit sûr pour vendre.",
    stepsMd: "1. Je demande à l'opérateur (Orange, Moov, Telecel) ou à un grossiste comment devenir revendeuse.\n2. Je commence avec de petites sommes.\n3. Je garde l'argent du commerce séparé de mon argent personnel.\n4. Je ne donne jamais mon code secret.",
    risksMd: "• Arnaque : ne donne jamais ton code secret, même si on dit que c'est l'opérateur.\n" + COMMON_RISKS,
    courseSlug: "initiation-telephone-informatique",
    sources: [S.siyb],
  },
  {
    slug: "fabrication-savon",
    title: "Fabriquer et vendre du savon",
    icon: "🧼",
    capitalMinFcfa: 35000,
    summary: "Faire du savon pour la maison et le vendre au marché ou à des groupes.",
    needsMd: "• Environ 35 000 FCFA : matières, moules, matériel.\n• Une formation pour apprendre à fabriquer sans danger.",
    stepsMd: "1. J'apprends avec une personne bien formée.\n2. Je fais d'abord de petites quantités. Je les fais essayer.\n3. Je calcule ce que me coûte un savon avant de fixer le prix.\n4. Je vends d'abord à mes voisines, puis au marché.",
    risksMd: "• Certains produits sont dangereux : mets des gants, ouvre les fenêtres, éloigne les enfants.\n" + COMMON_RISKS,
    sources: [S.siyb],
  },
  {
    slug: "petit-elevage",
    title: "Élever quelques poules ou chèvres",
    icon: "🐔",
    capitalMinFcfa: 50000,
    summary: "Vendre des œufs ou des animaux.",
    needsMd: "• Environ 50 000 FCFA : les animaux, un abri, la nourriture.\n• Un endroit fermé et de l'eau.",
    stepsMd: "1. Je commence avec peu d'animaux.\n2. Je demande conseil à un agent d'élevage ou à une personne qui connaît bien : maladies, vaccins.\n3. J'écris ce que je dépense pour la nourriture et ce que je vends.\n4. Je mets une partie du gain de côté pour acheter d'autres animaux.",
    risksMd: "• Les animaux peuvent tomber malades ou être volés. Prépare un abri fermé et des soins.\n" + COMMON_RISKS,
    sources: [S.siyb],
  },
  {
    slug: "couture-retouches",
    title: "Couture et retouches",
    icon: "🧵",
    capitalMinFcfa: 75000,
    summary: "Coudre ou réparer des vêtements. La machine à coudre est la plus grande dépense.",
    needsMd: "• Environ 75 000 FCFA : une machine d'occasion, du fil, des aiguilles, des ciseaux.\n• Une formation en couture, si tu n'en as pas.",
    stepsMd: "1. J'apprends ou je me perfectionne dans un atelier.\n2. Je commence par des retouches (ourlets, boutons) et de petites commandes.\n3. Pour une robe sur mesure, je demande une avance.\n4. J'écris les commandes et les paiements dans un cahier.",
    risksMd: COMMON_RISKS,
    sources: [S.siyb],
  },
  {
    slug: "groupe-epargne-solidaire",
    title: "Groupe d'épargne entre femmes (tontine)",
    icon: "🤝",
    capitalMinFcfa: 500,
    summary: "Mettre de l'argent de côté chaque semaine avec d'autres femmes, et emprunter à la caisse pour démarrer une activité.",
    needsMd: "• Un petit groupe de femmes de confiance (jusqu'à environ 30).\n• Une caisse fermée à clé. Les clés sont gardées par des personnes différentes.\n• Un cahier et une personne qui écrit.\n• Une somme par semaine choisie par le groupe, même toute petite (par exemple 500 FCFA).",
    stepsMd: "1. Le groupe décide ensemble des règles : combien chaque semaine, combien de temps, combien on paie quand on emprunte.\n2. Chaque semaine, chacune met son argent dans la caisse, devant tout le monde.\n3. Une membre peut emprunter à la caisse, puis rembourser avec un petit supplément. Ce supplément reste dans le groupe.\n4. À la fin du cycle, on partage l'argent et les suppléments.\nUne organisation peut aider à former le groupe (voir les sources).",
    risksMd: "• Choisis des femmes de confiance.\n• Ne prête que ce qui peut être rendu.\n• Adapte les règles à ce que vous faites déjà chez vous (tontine).",
    courseSlug: "bien-gerer-son-argent",
    sources: [S.careVsla, S.vslaCar],
  },
];
