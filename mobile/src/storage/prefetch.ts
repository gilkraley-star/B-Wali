import { apiRequest } from "../api/client";

// Télécharge en arrière-plan (quand il y a internet) les fiches, formations, idées de revenus et
// professionnelles, pour qu'elles s'ouvrent ensuite SANS connexion. Rien n'est affiché si ça échoue.
export async function prefetchOffline(): Promise<void> {
  const q = { silent: true } as const;
  try {
    await apiRequest("/content/categories", q);
    const articles = await apiRequest<{ slug: string }[]>("/content/articles", q);
    await Promise.all([
      apiRequest("/catalog/courses", q),
      apiRequest("/catalog/income", q),
      apiRequest("/catalog/professionals", q),
    ]);
    for (const a of articles) await apiRequest(`/content/articles/${a.slug}`, q);
  } catch {
    /* pas grave : on réessaiera au prochain lancement */
  }
}
