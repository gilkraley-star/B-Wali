// Bibliothèque d'histoires de Bê Wali.
// Seules des histoires ORIGINALES (écrites pour l'application) sont fournies ici en texte complet.
// Les contes du domaine public et les histoires sous licence libre sont importés par
// scripts/import-asp.mjs (African Storybook) avec le nom de l'auteur et la licence.
// Tout est chargé avec le statut A_VALIDER : relecture obligatoire avant publication.

export interface StorySeed {
  slug: string;
  title: string;
  summary: string;
  category: "CONTE" | "HEROINE" | "EDUCATION" | "AMOUR" | "ICI";
  ageMin: number;
  icon: string;
  origin: "ORIGINALE" | "DOMAINE_PUBLIC" | "LICENCE_LIBRE";
  credit: string;
  license?: string;
  sourceUrl?: string;
  readMin: number;
  reviewNote?: string;
  chapters: { title: string; body: string }[];
}

export const STORIES: StorySeed[] = [
  {
    slug: "mariam-et-la-machine-a-coudre",
    title: "Mariam et la machine à coudre",
    summary: "Une jeune couturière de Bangui apprend à fixer ses prix, à dire non et à épargner.",
    category: "HEROINE",
    ageMin: 10,
    icon: "🧵",
    origin: "ORIGINALE",
    credit: "Histoire originale Bê Wali",
    readMin: 9,
    reviewNote: "À relire par une enseignante ou une conteuse locale. Vérifier les prix cités.",
    chapters: [
      {
        title: "La vieille machine",
        body:
          "Mariam a quinze ans. Elle habite à Bangui avec sa tante Rose. Au fond de la maison, il y a une vieille machine à coudre. Elle ne marche plus depuis longtemps.\n\n" +
          "Un jour, Mariam la regarde de près. « Elle est cassée, mais peut-être qu'elle peut vivre encore », dit-elle.\n\n" +
          "Le voisin, monsieur Désiré, est tailleur. Il passe, voit la machine et sourit. « Viens demain, je te montre. » Il ne demande rien. Il dit seulement : « Un jour, tu aideras une autre fille. »\n\n" +
          "Pendant trois jours, Mariam nettoie, huile et change une petite pièce. Au quatrième jour, la machine fait « tac-tac-tac ». Mariam saute de joie. Sa machine marche !",
      },
      {
        title: "Le premier sac",
        body:
          "Mariam coud d'abord pour s'entraîner. Elle fait un sac avec un reste de pagne. Sa voisine Sandrine le voit. « Il est très beau ! Tu peux m'en faire un ? »\n\n" +
          "Mariam ne sait pas quel prix demander. Elle prend son cahier. Elle écrit : le tissu coûte 1 500 francs, le fil 200 francs, le transport 300 francs. Cela fait 2 000 francs. « Si je demande 2 000 francs, je ne gagne rien. Mon travail aussi compte. »\n\n" +
          "Elle demande 3 500 francs. Il lui reste 1 500 francs de bénéfice. Sandrine paie sans discuter. Mariam est fière. Elle écrit dans son cahier : « Prix = ce que ça me coûte + mon travail. »",
      },
      {
        title: "Dire non, et grandir",
        body:
          "Mariam met les photos de ses sacs sur WhatsApp. Les commandes arrivent. Un jour, un inconnu lui écrit : « Je te donne un grand travail. Mais d'abord, envoie-moi 20 000 francs pour les papiers. »\n\n" +
          "Mariam pense à ce que sa tante lui a appris : un vrai travail ne demande jamais de payer avant. « Non merci », répond-elle. Elle bloque le numéro et prévient sa tante.\n\n" +
          "Chaque semaine, Mariam met un peu d'argent de côté avec d'autres filles du quartier. À la fin de l'année, elles partagent la caisse. Mariam s'achète un tissu neuf et une deuxième machine. Puis elle appelle une jeune fille du quartier : « Viens, je vais te montrer. Je ne demande rien. Un jour, tu aideras une autre fille. »",
      },
    ],
  },
  {
    slug: "le-jour-ou-grace-a-eu-peur",
    title: "Le jour où Grâce a eu peur",
    summary: "Ses premières règles arrivent à l'école. Qui l'aide ? Une histoire d'amitié et de courage.",
    category: "EDUCATION",
    ageMin: 10,
    icon: "🌧️",
    origin: "ORIGINALE",
    credit: "Histoire originale Bê Wali",
    readMin: 7,
    reviewNote: "À relire par une sage-femme (exactitude) et par une enseignante (ton).",
    chapters: [
      {
        title: "La tache",
        body:
          "Grâce a douze ans. Ce matin-là, elle a mal au ventre à l'école. À la récréation, elle sent quelque chose de chaud et mouillé. Elle regarde sa jupe. Il y a une tache rouge.\n\n" +
          "Son cœur bat très fort. Elle pense : « Je suis malade ? Tout le monde va me voir ! » Elle reste assise à sa place, sans bouger, et ses yeux se remplissent de larmes.",
      },
      {
        title: "Fatou, la bonne amie",
        body:
          "Fatou, sa meilleure amie, remarque que Grâce ne joue pas. Elle s'assoit près d'elle. « Qu'est-ce qui se passe ? » Grâce montre la tache en chuchotant.\n\n" +
          "Fatou ne rit pas. Elle enlève son foulard et le noue autour de la taille de Grâce. « Ce n'est rien de grave. Ça arrive à toutes les filles. Viens, on va voir Madame Brigitte. »\n\n" +
          "Madame Brigitte, la maîtresse, sourit avec douceur. Elle donne à Grâce une protection propre, de l'eau et du savon. « Tu as eu tes premières règles, dit-elle. C'est naturel, ce n'est pas une maladie. Tu as bien fait de ne pas avoir honte. »",
      },
      {
        title: "Le soir, à la maison",
        body:
          "Le soir, Grâce raconte tout à sa maman. Sa maman la prend dans ses bras. « Je suis fière de toi. Ça arrive à toutes les filles, et c'est le signe que ton corps grandit bien. »\n\n" +
          "Elle lui montre comment faire : changer sa protection plusieurs fois par jour, se laver à l'eau propre, laver et bien sécher un tissu réutilisable. « Et si tu as très mal, ou si tes règles durent plus de sept jours, on ira ensemble voir la sage-femme. »\n\n" +
          "Grâce dort tranquille. Le lendemain, elle explique à Fatou ce qu'elle a appris. Les deux amies décident de le dire aussi aux autres filles de la classe.",
      },
    ],
  },
  {
    slug: "contes-indigenes-ouest-africain",
    title: "Contes indigènes de l'Ouest africain français",
    summary: "Des contes recueillis il y a plus de cent ans, dans le domaine public. À choisir et à simplifier avant import.",
    category: "CONTE",
    ageMin: 10,
    icon: "🪘",
    origin: "DOMAINE_PUBLIC",
    credit: "Maurice Delafosse (mort en 1926)",
    sourceUrl: "https://www.gutenberg.org/ebooks/15458",
    readMin: 20,
    reviewNote: "Texte de l'époque coloniale : choisir les contes, simplifier la langue, retirer les passages blessants. Vérifier le domaine public selon la loi du pays. Pas encore importé (aucun chapitre).",
    chapters: [],
  },
];

// Histoires libres de l'African Storybook (CC BY / CC BY-NC), français, importées avec auteur, illustratrice,
// traductrice et licence. Fichier généré depuis https://github.com/global-asp/asp-source/tree/master/fr
import aspStories from "./stories-asp.json";
STORIES.push(...(aspStories as StorySeed[]));
