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
  check("inscription à une formation", r.status === 201);
  r = await call("GET", `/catalog/courses/${slug}/qcm`, { token: fille });
  check("test verrouillé tant que la fille n'a pas suivi le direct jusqu'au bout", r.status === 403);

  console.log(failures ? `\n${failures} vérification(s) en échec` : "\nToutes les vérifications passent.");
  process.exit(failures ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
