// Test de bout en bout du backend (lancé par la CI après `prisma db push` + `npm run seed`).
// Vérifie le circuit complet : contenus "à valider" -> admin publie -> visibles côté public ;
// création d'un compte pro avec photo -> proposition -> validation ; contrôles d'accès.
const base = process.env.BASE || "http://localhost:4000";
const adminEmail = process.env.ADMIN_EMAIL;
const adminPassword = process.env.ADMIN_PASSWORD;

let failures = 0;
function check(name, cond, extra = "") {
  if (cond) console.log("✓", name);
  else { failures++; console.error("✗", name, extra); }
}
async function call(method, path, { token, body } = {}) {
  const r = await fetch(base + "/api" + path, {
    method,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await r.json(); } catch {}
  return { status: r.status, data };
}

// PNG 1x1 valide
const PNG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

(async () => {
  // 1. Avant validation, le public ne voit aucun contenu
  let r = await call("GET", "/content/articles");
  check("public : aucune fiche visible avant validation", r.status === 200 && r.data.length === 0, JSON.stringify(r.data).slice(0, 100));
  r = await call("GET", "/catalog/courses");
  check("public : aucune formation visible avant validation", r.status === 200 && r.data.length === 0);

  // 2. Admin
  r = await call("POST", "/auth/login", { body: { email: adminEmail, password: adminPassword } });
  check("connexion admin", r.status === 200 && r.data.user.role === "ADMIN");
  const admin = r.data.token;

  r = await call("GET", "/admin/queue?status=A_VALIDER", { token: admin });
  check("file de validation remplie", r.status === 200 && r.data.length >= 20, "n=" + (r.data && r.data.length));
  const withSources = r.data.filter((x) => x.sources.length > 0);
  const noSource = r.data.filter((x) => x.sources.length === 0);
  check("chaque fiche santé a des sources", r.data.filter((x) => x.type === "articles").every((x) => x.sources.length > 0));

  // Un contenu sans source ne peut pas être publié
  if (noSource.length) {
    const x = noSource[0];
    const rr = await call("POST", `/admin/review/${x.type}/${x.id}`, { token: admin, body: { decision: "approve" } });
    check("publication refusée sans source", rr.status === 400);
  }

  // Refus sans motif interdit
  const rr2 = await call("POST", `/admin/review/${withSources[0].type}/${withSources[0].id}`, { token: admin, body: { decision: "reject" } });
  check("refus sans motif interdit", rr2.status === 400);

  // 3. Un compte utilisatrice ne doit pas accéder à l'admin
  r = await call("POST", "/auth/signup", { body: { email: "fille@test.org", password: "motdepasse1", pseudonyme: "fille_test", birthDate: "2003-04-12", acceptTerms: true, photo: PNG } });
  check("inscription utilisatrice", r.status === 201);
  const fille = r.data.token;
  check("pays par défaut = Centrafrique", r.data.user.country === "CF");
  r = await call("POST", "/auth/signup", { body: { email: "tchad@test.org", password: "motdepasse1", pseudonyme: "fille_tchad", birthDate: "2003-04-12", acceptTerms: true, country: "TD", photo: PNG } });
  check("inscription avec pays Tchad", r.status === 201 && r.data.user.country === "TD");
  const tchad = r.data.token;
  r = await call("POST", "/admin/announcements", { token: admin, body: { title: "Annonce Tchad seulement", country: "TD" } });
  check("admin : annonce réservée au Tchad", r.status === 201);
  r = await call("GET", "/catalog/announcements", { token: tchad });
  check("fille du Tchad voit l'annonce Tchad", r.status === 200 && r.data.some((x) => x.title === "Annonce Tchad seulement"));
  r = await call("GET", "/catalog/announcements", { token: fille });
  check("fille de Centrafrique ne la voit pas", r.status === 200 && !r.data.some((x) => x.title === "Annonce Tchad seulement"));
  r = await call("GET", "/admin/queue?status=A_VALIDER", { token: admin });
  const heroine = Array.isArray(r.data) ? r.data.find((x) => x.type === "stories" && x.title.includes("Nzinga")) : null;
  check("admin : l'histoire de Nzinga attend la validation", !!heroine, JSON.stringify(r.data).slice(0, 120));
  if (heroine) {
    r = await call("POST", "/admin/review/stories/" + heroine.id, { token: admin, body: { decision: "approve" } });
    check("admin : publie l'histoire", r.status === 200);
    r = await call("GET", "/stories?category=HEROINE", { token: fille });
    check("la lectrice voit l'histoire publiée", r.status === 200 && r.data.some((x) => x.slug === "nzinga-reine-du-ndongo"));
  }
  r = await call("GET", "/admin/stats", { token: fille });
  check("utilisatrice : admin interdit (403)", r.status === 403);
  r = await call("GET", "/pro/mine", { token: fille });
  check("utilisatrice : espace pro interdit (403)", r.status === 403);
  r = await call("GET", "/admin/stats");
  check("sans jeton : admin interdit (401)", r.status === 401);

  // 4. Publication en lot
  const items = withSources.map((x) => ({ type: x.type, id: x.id }));
  r = await call("POST", "/admin/review-bulk", { token: admin, body: { items, decision: "approve" } });
  check("publication en lot", r.status === 200 && r.data.results.every((x) => x.ok));
  r = await call("GET", "/content/articles");
  check("public : fiches visibles après validation, avec sources", r.status === 200 && r.data.length >= 8 && r.data[0].sources.length > 0);
  check("public : pas de champs internes exposés", !("reviewNote" in r.data[0]) && !("sourcesJson" in r.data[0]));
  r = await call("GET", "/catalog/income");
  check("public : activités de revenus (dont 2 sans argent)", r.status === 200 && r.data.length === 10 && r.data.filter((a) => a.capitalMinFcfa === 0).length === 2);

  // 5. Création d'un compte professionnel avec photo
  r = await call("POST", "/admin/users", { token: admin, body: { email: "sf@test.org", fullName: "Mireille Test", profession: "Sage-femme", role: "PROFESSIONNELLE", certified: true, photo: "data:image/png;base64,AAAA" } });
  check("photo invalide refusée", r.status === 400);
  r = await call("POST", "/admin/users", { token: admin, body: { email: "sf@test.org", fullName: "Mireille Test", profession: "Sage-femme", role: "PROFESSIONNELLE", certified: true, photo: PNG } });
  check("création du compte professionnel", r.status === 201 && r.data.temporaryPassword.length >= 10, JSON.stringify(r.data));
  const temp = r.data.temporaryPassword;
  r = await call("POST", "/auth/login", { body: { email: "sf@test.org", password: temp } });
  check("connexion pro avec mot de passe provisoire", r.status === 200 && r.data.user.mustChangePassword === true);
  let pro = r.data.token;
  r = await call("POST", "/auth/change-password", { token: pro, body: { currentPassword: temp, newPassword: "NouveauMotDePasse9" } });
  check("changement du mot de passe", r.status === 204);

  // 6. La pro soumet une fiche, l'admin la valide
  r = await call("POST", "/pro/submit/articles", { token: pro, body: { titleFr: "Anémie et règles abondantes", categorySlug: "hygiene-menstruelle", bodyFr: "Des règles très abondantes peuvent provoquer une anémie. Consulte si tu changes de protection toutes les heures.", sources: [] } });
  check("soumission sans source refusée", r.status === 400);
  r = await call("POST", "/pro/submit/articles", { token: pro, body: { titleFr: "Anémie et règles abondantes", categorySlug: "hygiene-menstruelle", bodyFr: "Des règles très abondantes peuvent provoquer une anémie. Consulte si tu changes de protection toutes les heures.", sources: [{ title: "Top questions about your menstrual cycle", org: "Office on Women's Health", url: "https://womenshealth.gov/sites/default/files/documents/fact-sheet-menstrual-cycle.pdf" }] } });
  check("soumission par la professionnelle", r.status === 201 && r.data.status === "A_VALIDER");
  const newId = r.data.id;
  r = await call("GET", "/content/articles");
  check("proposition invisible du public avant validation", !r.data.some((a) => a.titleFr.startsWith("Anémie")));
  r = await call("POST", `/admin/review/articles/${newId}`, { token: admin, body: { decision: "approve" } });
  check("validation par l'admin", r.status === 200);
  r = await call("GET", "/content/articles");
  check("proposition visible après validation", r.data.some((a) => a.titleFr.startsWith("Anémie") && a.author && a.author.fullName === "Mireille Test"));
  r = await call("GET", "/catalog/professionals");
  check("annuaire : pro certifiée avec photo", r.data.some((p) => p.fullName === "Mireille Test" && p.certified && p.photoUrl.startsWith("/uploads/")));

  // 7. Désactivation immédiate d'un compte
  r = await call("GET", "/admin/users", { token: admin });
  const proId = r.data.find((u) => u.email === "sf@test.org").id;
  r = await call("PATCH", `/admin/users/${proId}`, { token: admin, body: { active: false } });
  check("désactivation du compte", r.status === 200);
  r = await call("GET", "/pro/mine", { token: pro });
  check("jeton d'un compte désactivé refusé immédiatement", r.status === 401);

  // 8. Formations : le test est verrouillé sans présence jusqu'à la fin
  r = await call("GET", "/catalog/courses");
  check("formations publiées", r.status === 200 && r.data.length >= 5);
  const slug = r.data[0].slug;
  r = await call("POST", `/catalog/courses/${slug}/enroll`, { token: fille });
  check("inscription refusée sans nom, date et lieu de naissance", r.status === 400);
  r = await call("POST", `/catalog/courses/${slug}/enroll`, { token: fille, body: { fullName: "Marie Test Ngaïssona", birthDate: "2008-03-14", birthPlace: "Bangui" } });
  check("inscription à une formation avec les vraies informations", r.status === 201);
  r = await call("GET", `/catalog/courses/${slug}/certificate`, { token: fille });
  check("pas d'attestation avant le test", r.status === 403);
  r = await call("GET", `/catalog/courses/${slug}/qcm`, { token: fille });
  check("test verrouillé tant que la fille n'a pas suivi le direct jusqu'au bout", r.status === 403);

  // 9. Formation en vidéos, avec attestation sans test : création, vidéo, suivi, attestation
  r = await call("POST", "/admin/courses", { token: admin, body: { title: "Formation vidéo test", summary: "Une formation en vidéos pour le test.", outlineMd: "Leçon 1\nLeçon 2", hours: 1, format: "VIDEOS", certified: true, hasTest: false, trainerName: "Mme Test" } });
  check("l'admin crée une formation en vidéos sans test", r.status === 201, JSON.stringify(r.data));
  const cid = r.data.id, cslug = r.data.slug;
  const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from("ftypmp42"), Buffer.alloc(2000, 1)]);
  let up = await fetch(base + "/api/admin/courses/" + cid + "/videos?title=" + encodeURIComponent("Leçon 1"), { method: "POST", headers: { Authorization: "Bearer " + admin, "Content-Type": "video/mp4" }, body: mp4 });
  check("envoi d'une vidéo par l'admin", up.status === 201, String(up.status));
  up = await fetch(base + "/api/admin/courses/" + cid + "/videos?title=faux", { method: "POST", headers: { Authorization: "Bearer " + admin, "Content-Type": "video/mp4" }, body: Buffer.alloc(3000, 7) });
  check("un fichier qui n'est pas une vidéo est refusé", up.status === 400, String(up.status));
  r = await call("POST", `/catalog/courses/${cslug}/enroll`, { token: fille, body: { fullName: "Marie Test Ngaïssona", birthDate: "2008-03-14", birthPlace: "Bangui" } });
  r = await call("GET", `/catalog/courses/${cslug}/videos`, { token: fille });
  check("la fille inscrite voit les vidéos", r.status === 200 && r.data.videos.length === 1 && r.data.videos[0].url.startsWith("/uploads/courses/"), JSON.stringify(r.data));
  r = await call("POST", `/catalog/courses/${cslug}/complete`, { token: fille });
  check("pas d'attestation avant d'avoir tout vu", r.status === 403);
  const vid = (await call("GET", `/catalog/courses/${cslug}/videos`, { token: fille })).data.videos[0].id;
  r = await call("POST", `/catalog/courses/${cslug}/videos/${vid}/done`, { token: fille });
  check("dernière vidéo vue : formation terminée", r.status === 200 && r.data.allDone === true);
  r = await call("POST", `/catalog/courses/${cslug}/complete`, { token: fille });
  check("attestation délivrée sans test", r.status === 200 && !!r.data.certificateNo, JSON.stringify(r.data));
  r = await call("GET", `/catalog/courses/${cslug}/certificate`, { token: fille });
  check("l'attestation PDF est générée avec le modèle par défaut", r.status === 200 && !!r.data.pdf, JSON.stringify(r.data).slice(0, 120));
  r = await call("GET", `/catalog/courses/${cslug}/qcm`, { token: fille });
  check("pas de test pour cette formation", r.status === 400);
  r = await call("PATCH", `/admin/courses/${cid}/content`, { token: admin, body: { certified: false } });
  r = await call("GET", `/catalog/courses/${cslug}/certificate`, { token: fille });
  check("formation sans certification : plus d'attestation", r.status === 400);
  r = await call("PATCH", `/admin/courses/${cid}/content`, { token: admin, body: { certified: true, hasTest: true, qcm: [{ q: "2 + 2 ?", options: ["3", "4"], correct: 1 }] } });
  check("l'admin remplit le test", r.status === 200);
  r = await call("GET", `/catalog/courses/${cslug}/qcm`, { token: fille });
  check("le test s'affiche sans les bonnes réponses", r.status === 200 && r.data.length === 1 && r.data[0].correct === undefined);

  // 10. Compte partenaire (sans photo) : propose une formation sans source ; centres de santé gérés par l'admin
  r = await call("POST", "/admin/users", { token: admin, body: { email: "asso@test.org", fullName: "Association Test", role: "PARTENAIRE" } });
  check("l'admin crée un compte partenaire sans photo", r.status === 201 && !!r.data.temporaryPassword, JSON.stringify(r.data));
  r = await call("POST", "/auth/login", { body: { email: "asso@test.org", password: r.data.temporaryPassword } });
  const asso = r.data && r.data.token;
  check("le partenaire se connecte", !!asso);
  r = await call("POST", "/pro/submit/courses", { token: asso, body: { title: "Formation du partenaire", summary: "Une formation proposée par un partenaire.", outlineMd: "Programme de la formation proposée par le partenaire", durationMin: 120, format: "VIDEOS", certified: true, hasTest: false } });
  check("le partenaire propose une formation sans source", r.status === 201, JSON.stringify(r.data));
  const partnerCourseId = r.data.id;
  r = await call("POST", "/pro/submit/articles", { token: asso, body: { titleFr: "Article interdit", categorySlug: "cycle-menstruel", bodyFr: "x".repeat(60), sources: [] } });
  check("le partenaire ne peut proposer que des formations", r.status === 403);
  r = await call("POST", `/admin/review/courses/${partnerCourseId}`, { token: admin, body: { decision: "approve" } });
  check("l'admin publie la formation sans source", r.status === 200, JSON.stringify(r.data));
  r = await call("POST", "/admin/health-centers", { token: admin, body: { name: "Centre test", kind: "Clinique", city: "Bangui", lat: 4.36, lng: 18.55 } });
  check("l'admin ajoute un centre de santé avec position", r.status === 201, JSON.stringify(r.data));
  r = await call("GET", "/catalog/health-centers", { token: fille });
  check("les centres de santé sont visibles côté appli avec leur position", r.status === 200 && r.data.some((c) => c.name === "Centre test" && c.lat === 4.36) && r.data.length >= 10, JSON.stringify(r.data).slice(0, 150));

  console.log(failures ? `\n${failures} vérification(s) en échec` : "\nToutes les vérifications passent.");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
