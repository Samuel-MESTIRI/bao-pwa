import { isNotNull } from 'drizzle-orm'

// Ouvre la base et applique les migrations dès le démarrage plutôt qu'à la première requête,
// puis nettoie une fois par jour les photos jamais rattachées à une recette.
export default defineNitroPlugin(() => {
  const cleanup = async () => {
    try {
      const db = await useDb()
      const rows = await db.select({ image: schema.recipes.image }).from(schema.recipes).where(isNotNull(schema.recipes.image))
      const removed = await cleanupOrphanImages(new Set(rows.map(r => r.image!)))
      if (removed) console.info(`[bao] ${removed} photo(s) orpheline(s) supprimée(s)`)
    }
    catch (error) {
      console.error('[bao] nettoyage des photos impossible', error)
    }
  }

  useDb()
    .then(() => {
      console.info('[bao] base de données prête')
      cleanup()
      setInterval(cleanup, 24 * 60 * 60_000).unref()
    })
    .catch(error => console.error('[bao] impossible d\'ouvrir la base de données', error))
})
