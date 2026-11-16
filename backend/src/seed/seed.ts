import { prisma } from "../db";
import bcrypt from "bcryptjs";
import { ARTICLES, COURSES, INCOME } from "./content";
import { STORIES } from "./stories";

// Contenu de démarrage basé sur la section 5.3 (bibliothèque éducative) et 5.2 (catégories du forum)
// du dossier projet. À réviser et valider par des professionnels de santé avant mise en production
// (cf. section 5.3 : "Les contenus sanitaires seront préparés ou vérifiés avec des professionnels qualifiés").

async function main() {
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
        fullName: "Administration Bê Wali",
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

  const forumCategoriesData: { slug: string; titleFr: string; restrictedTo?: "ADOLESCENTE" }[] = [
    { slug: "mes-premieres-regles", titleFr: "Mes premières règles", restrictedTo: "ADOLESCENTE" },
    { slug: "mon-corps-ma-sante", titleFr: "Mon corps et ma santé" },
    { slug: "sante-intime", titleFr: "Santé intime" },
    { slug: "puberte-adolescence", titleFr: "Puberté et adolescence", restrictedTo: "ADOLESCENTE" },
    { slug: "relations-consentement", titleFr: "Relations et consentement" },
    { slug: "etudes-vie-scolaire", titleFr: "Études et vie scolaire" },
    { slug: "confiance-en-soi", titleFr: "Confiance en soi" },
    { slug: "maternite", titleFr: "Maternité" },
    { slug: "temoignages", titleFr: "Témoignages" },
    { slug: "mon-avenir", titleFr: "Mon avenir" },
    { slug: "questions-aux-professionnels", titleFr: "Questions aux professionnels" },
  ];

  for (const c of forumCategoriesData) {
    await prisma.forumCategory.upsert({
      where: { slug: c.slug },
      create: c,
      update: c,
    });
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
