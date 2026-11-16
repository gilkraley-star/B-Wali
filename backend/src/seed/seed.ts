import { prisma } from "../db";
import bcrypt from "bcryptjs";
import { ARTICLES, COURSES, INCOME } from "./content";
import { STORIES } from "./stories";

// Contenu de démarrage basé sur la section 5.3 (bibliothèque éducative) et 5.2 (catégories du forum)
// du dossier projet. À réviser et valider par des professionnels de santé avant mise en production
// (cf. section 5.3 : "Les contenus sanitaires seront préparés ou vérifiés avec des professionnels qualifiés").

async function main() {
  // Première annonce de l'accueil (une seule fois ; ensuite elles se gèrent dans l'administration)
  if ((await prisma.announcement.count()) === 0) {
    await prisma.announcement.create({ data: { emoji: "💗", title: "Bienvenue sur Wali !", body: "Ici, tu peux poser tes questions, apprendre, jouer et te faire des amies en toute discrétion.", color: "violet", target: "Assistant" } });
  }
  console.log("Seed : catégories d'articles…");

  const categoriesData = [
    { slug: "cycle-menstruel", titleFr: "Comprendre le cycle menstruel" },
    { slug: "premieres-regles", titleFr: "Les premières règles" },
    { slug: "hygiene-menstruelle", titleFr: "L'hygiène menstruelle" },
    { slug: "puberte", titleFr: "La puberté" },
    { slug: "contraception", titleFr: "La contraception" },
    { slug: "ist", titleFr: "Les infections sexuellement transmissibles" },
    { slug: "consentement", titleFr: "Relations affectives et consentement" },
    { slug: "violences", titleFr: "Violences et situations d'abus" },
    { slug: "sante-mentale", titleFr: "Santé mentale et bien-être" },
    { slug: "grossesse-maternite", titleFr: "Grossesse et maternité" },
  ];

  const categories: Record<string, string> = {};
  for (const c of categoriesData) {
    const created = await prisma.articleCategory.upsert({
      where: { slug: c.slug },
      create: c,
      update: c,
    });
    categories[c.slug] = created.id;
  }

  // Les fiches de santé viennent de ./content.ts : chaque fiche y cite ses sources.
  // (Les anciens brouillons sans source ont été retirés : plus aucune fiche de santé sans référence.)

  console.log("Seed : fiches santé avec sources (statut A_VALIDER)…");
  for (const a of ARTICLES) {
    const categoryId = categories[a.categorySlug];
    if (!categoryId) throw new Error("Catégorie inconnue : " + a.categorySlug);
    await prisma.article.upsert({
      where: { slug: a.slug },
      create: {
        slug: a.slug,
        categoryId,
        titleFr: a.titleFr,
        bodyFr: a.bodyFr,
        sourcesJson: JSON.stringify(a.sources),
        reviewNote: a.reviewNote,
        status: "A_VALIDER",
      },
      // On ne change JAMAIS le statut d'un contenu déjà validé/publié en relançant le seed.
      update: { titleFr: a.titleFr, bodyFr: a.bodyFr, sourcesJson: JSON.stringify(a.sources) },
    });
  }

  console.log("Seed : histoires…");
  for (const st of STORIES) {
    const data = {
      slug: st.slug, title: st.title, summary: st.summary, category: st.category, ageMin: st.ageMin, icon: st.icon,
      origin: st.origin, credit: st.credit, license: st.license ?? null, sourceUrl: st.sourceUrl ?? null,
      readMin: st.readMin, reviewNote: st.reviewNote ?? null,
    };
    const story = await prisma.story.upsert({ where: { slug: st.slug }, create: { ...data, status: "A_VALIDER" }, update: data });
    for (let i = 0; i < st.chapters.length; i++) {
      const ch = st.chapters[i];
      await prisma.storyChapter.upsert({
        where: { storyId_position: { storyId: story.id, position: i + 1 } },
        create: { storyId: story.id, position: i + 1, title: ch.title, body: ch.body },
        update: { title: ch.title, body: ch.body },
      });
    }
  }

  console.log("Seed : formations…");
  for (const c of COURSES) {
    await prisma.course.upsert({
      where: { slug: c.slug },
      create: {
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        icon: c.icon,
        partner: c.partner,
        durationMin: c.durationMin,
        outlineMd: c.outlineMd,
        qcmJson: JSON.stringify(c.qcm),
        sourcesJson: JSON.stringify(c.sources),
        reviewNote: c.reviewNote,
        status: "A_VALIDER",
      },
      update: { title: c.title, summary: c.summary, outlineMd: c.outlineMd, qcmJson: JSON.stringify(c.qcm), sourcesJson: JSON.stringify(c.sources) },
    });
  }

  console.log("Seed : activités génératrices de revenus…");
  for (const i of INCOME) {
    await prisma.incomeActivity.upsert({
      where: { slug: i.slug },
      create: {
        slug: i.slug,
        title: i.title,
        icon: i.icon,
        capitalMinFcfa: i.capitalMinFcfa,
        summary: i.summary,
        needsMd: i.needsMd,
        stepsMd: i.stepsMd,
        risksMd: i.risksMd,
        courseSlug: i.courseSlug,
        sourcesJson: JSON.stringify(i.sources),
        status: "A_VALIDER",
      },
      update: { title: i.title, capitalMinFcfa: i.capitalMinFcfa, summary: i.summary, needsMd: i.needsMd, stepsMd: i.stepsMd, risksMd: i.risksMd, sourcesJson: JSON.stringify(i.sources) },
    });
  }

  // Compte administrateur : e-mail et mot de passe fournis par l'environnement (jamais écrits dans le code).
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 10) throw new Error("ADMIN_PASSWORD doit contenir au moins 10 caractères.");
    await prisma.user.upsert({
      where: { email: adminEmail },
      create: {
        email: adminEmail,
        passwordHash: await bcrypt.hash(adminPassword, 10),
        pseudonyme: "admin-bewali",
        fullName: "Administration Wali",
        ageBracket: "FEMME_ADULTE",
        role: "ADMIN",
      },
      update: {},
    });
    console.log("Compte admin prêt : " + adminEmail);
  } else {
    console.log("ADMIN_EMAIL / ADMIN_PASSWORD absents : aucun compte admin créé.");
  }

  console.log("Seed : catégories du forum…");

  // Thèmes généraux (avec icône) et leurs sous-thèmes. Les anciens slugs sont conservés pour ne perdre aucun message.
  type Sub = { slug: string; titleFr: string; restrictedTo?: "ADOLESCENTE" };
  const tree: { slug: string; titleFr: string; icon: string; subs: Sub[] }[] = [
    { slug: "t-corps", titleFr: "Mon corps et mon cycle", icon: "🌸", subs: [
      { slug: "mes-premieres-regles", titleFr: "Mes premières règles", restrictedTo: "ADOLESCENTE" }, { slug: "puberte-adolescence", titleFr: "Puberté et adolescence", restrictedTo: "ADOLESCENTE" },
      { slug: "mon-corps-ma-sante", titleFr: "Mon corps et ma santé" }, { slug: "regles-douloureuses", titleFr: "Règles douloureuses ou irrégulières" }, { slug: "hygiene-intime", titleFr: "Hygiène et protections" } ] },
    { slug: "t-sexualite", titleFr: "Sexualité et relations", icon: "💞", subs: [
      { slug: "sante-intime", titleFr: "Santé intime" }, { slug: "relations-consentement", titleFr: "Relations et consentement" }, { slug: "contraception", titleFr: "Contraception" },
      { slug: "ist-vih", titleFr: "IST et VIH : se protéger" }, { slug: "premiere-fois", titleFr: "La première fois" }, { slug: "violences", titleFr: "Violences et harcèlement" } ] },
    { slug: "t-maladie", titleFr: "Maladie et santé", icon: "🩺", subs: [
      { slug: "paludisme-infections", titleFr: "Paludisme et infections" }, { slug: "anemie-nutrition", titleFr: "Anémie et alimentation" }, { slug: "maladies-chroniques", titleFr: "Drépanocytose, diabète et autres maladies" },
      { slug: "vih-vivre-avec", titleFr: "Vivre avec le VIH" }, { slug: "handicap", titleFr: "Handicap" }, { slug: "questions-aux-professionnels", titleFr: "Questions aux professionnels" } ] },
    { slug: "t-ecole", titleFr: "École et Université", icon: "🎓", subs: [
      { slug: "etudes-vie-scolaire", titleFr: "Études et vie scolaire" }, { slug: "examens-stress", titleFr: "Examens et stress" }, { slug: "orientation", titleFr: "Orientation et bourses" },
      { slug: "universite", titleFr: "Vie à l'université" }, { slug: "grossesse-ecole", titleFr: "Rester à l'école avec un bébé" } ] },
    { slug: "t-maternite", titleFr: "Grossesse et jeunes mamans", icon: "🤱", subs: [
      { slug: "maternite", titleFr: "Maternité" }, { slug: "grossesse-suivi", titleFr: "Suivi de grossesse" }, { slug: "allaitement", titleFr: "Allaitement" }, { slug: "bebe-soins", titleFr: "Soins du bébé" }, { slug: "apres-accouchement", titleFr: "Après l'accouchement" } ] },
    { slug: "t-mental", titleFr: "Moral et confiance en soi", icon: "🌈", subs: [
      { slug: "confiance-en-soi", titleFr: "Confiance en soi" }, { slug: "stress-tristesse", titleFr: "Stress, tristesse, anxiété" }, { slug: "famille-amis", titleFr: "Famille et amitiés" }, { slug: "solitude", titleFr: "Me sentir seule" } ] },
    { slug: "t-avenir", titleFr: "Avenir et argent", icon: "💼", subs: [
      { slug: "mon-avenir", titleFr: "Mon avenir" }, { slug: "petit-commerce", titleFr: "Petit commerce et revenus" }, { slug: "metiers", titleFr: "Métiers et formations" } ] },
    { slug: "t-temoignages", titleFr: "Témoignages", icon: "✨", subs: [ { slug: "temoignages", titleFr: "Témoignages" }, { slug: "reussites", titleFr: "Mes réussites" } ] },
  ];
  for (let ti = 0; ti < tree.length; ti++) {
    const th = tree[ti];
    const parent = await prisma.forumCategory.upsert({ where: { slug: th.slug }, create: { slug: th.slug, titleFr: th.titleFr, icon: th.icon, sort: ti }, update: { titleFr: th.titleFr, icon: th.icon, sort: ti, parentId: null } });
    for (let si = 0; si < th.subs.length; si++) {
      const c = th.subs[si];
      await prisma.forumCategory.upsert({ where: { slug: c.slug }, create: { ...c, parentId: parent.id, sort: si }, update: { titleFr: c.titleFr, parentId: parent.id, sort: si, restrictedTo: c.restrictedTo ?? null } });
    }
  }

  console.log("Seed terminé.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
