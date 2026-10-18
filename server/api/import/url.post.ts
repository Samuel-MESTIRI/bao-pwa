import { eq } from 'drizzle-orm'
import { z } from 'zod'

const bodySchema = z.object({ url: z.string().trim().url('Adresse invalide').max(2000) })

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

/**
 * Lit une recette sur une page web et la renvoie prête à pré-remplir le
 * formulaire. Rien n'est enregistré ici, sauf la photo (supprimée au bout de
 * 24 h si la recette n'est finalement pas créée).
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  rateLimit(`import:${user.id}`, 60, 60 * 60_000)
  const { url } = await readValid(event, bodySchema)

  const page = await safeFetch(url, { accept: 'text/html,application/xhtml+xml', maxBytes: 5 * 1024 * 1024 })
  const recipe = extractRecipe(page.body.toString('utf8'), page.url)
  if (!recipe || !recipe.name) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Aucune recette trouvée sur cette page',
      message: 'Ce site ne fournit pas de fiche recette lisible. Essaie avec la page de la recette elle-même.',
    })
  }

  // Photo : téléchargée puis compressée comme une photo envoyée depuis l'app
  let image: string | null = null
  if (recipe.imageUrl) {
    try {
      const file = await safeFetch(recipe.imageUrl, { accept: 'image/*', maxBytes: 12 * 1024 * 1024 })
      image = await saveImage(file.body)
    }
    catch {
      // Recette importée sans photo plutôt que pas du tout
    }
  }

  // Catégories de l'utilisateur évoquées par la fiche (« Dessert », « Asiatique »…)
  const db = await useDb()
  const categories = await db.select({ id: schema.categories.id, name: schema.categories.name })
    .from(schema.categories)
    .where(eq(schema.categories.userId, user.id))
  const keywords = recipe.keywords.map(normalize)
  const categoryIds = categories
    .filter(c => keywords.some(k => k.includes(normalize(c.name))))
    .map(c => c.id)

  return {
    name: recipe.name,
    image,
    prepTime: recipe.prepTime,
    cookTime: recipe.cookTime,
    difficulty: null,
    servings: recipe.servings ?? 4,
    ingredients: recipe.ingredients,
    steps: recipe.steps,
    categoryIds,
    source: recipe.source,
  }
})
