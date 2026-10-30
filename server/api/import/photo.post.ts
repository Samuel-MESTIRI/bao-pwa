import { eq } from 'drizzle-orm'

const MAX_SIZE = 12 * 1024 * 1024

/**
 * Scan magique : photo d'une page de recette → données prêtes à pré-remplir le
 * formulaire. La photo est analysée en mémoire puis oubliée : rien n'est
 * enregistré, ni la photo ni la recette (l'utilisateur valide le formulaire).
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  if (!scanEnabled()) throw createError({ statusCode: 503, statusMessage: 'Le scan n\'est pas disponible' })

  const parts = await readMultipartFormData(event)
  const file = parts?.find(p => p.name === 'image' && p.data?.length)
  if (!file) throw createError({ statusCode: 400, statusMessage: 'Aucune photo reçue' })
  if (file.data.length > MAX_SIZE) throw createError({ statusCode: 413, statusMessage: 'Photo trop lourde (12 Mo max)' })

  const db = await useDb()
  const categories = await db.select({ id: schema.categories.id, name: schema.categories.name })
    .from(schema.categories)
    .where(eq(schema.categories.userId, user.id))

  await reserveScan(user.id)
  const scanned = await scanRecipe(file.data, categories.map(c => c.name))

  const ingredients = scanned.ingredients
    .filter(i => i.name)
    .map(i => ({ name: i.name, quantity: i.quantity ?? null, unit: i.quantity == null ? null : i.unit ?? 'unité' }))
  const steps = scanned.steps.filter(Boolean)

  if (!scanned.found || !scanned.title || (!ingredients.length && !steps.length)) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Aucune recette lisible',
      message: 'Je n\'ai pas trouvé de recette lisible sur cette photo. Réessaie avec plus de lumière, la page bien à plat et entière dans le cadre.',
    })
  }

  const wanted = new Set(scanned.categories)
  return {
    name: scanned.title.slice(0, 120),
    image: null,
    prepTime: scanned.prepTime ?? null,
    cookTime: scanned.cookTime ?? null,
    difficulty: difficultyValue(scanned.difficulty),
    servings: scanned.servings ?? 4,
    ingredients,
    steps,
    categoryIds: categories.filter(c => wanted.has(c.name)).map(c => c.id),
    source: 'photo',
  }
})
