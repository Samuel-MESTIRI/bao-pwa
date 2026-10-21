import { asc, desc, eq, inArray } from 'drizzle-orm'

// Liste légère pour l'accueil : pas d'étapes ni de quantités, seulement les
// noms d'ingrédients (pour la recherche par ingrédient, faite sur le téléphone).
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await useDb()

  const rows = await db.select({
    id: schema.recipes.id,
    name: schema.recipes.name,
    image: schema.recipes.image,
    prepTime: schema.recipes.prepTime,
    cookTime: schema.recipes.cookTime,
    difficulty: schema.recipes.difficulty,
    servings: schema.recipes.servings,
  })
    .from(schema.recipes)
    .where(eq(schema.recipes.userId, user.id))
    .orderBy(desc(schema.recipes.createdAt))

  const ids = rows.map(r => r.id)
  const [links, ingredients] = ids.length
    ? await Promise.all([
        db.select().from(schema.recipeCategories).where(inArray(schema.recipeCategories.recipeId, ids)),
        db.select({ recipeId: schema.ingredients.recipeId, name: schema.ingredients.name })
          .from(schema.ingredients)
          .where(inArray(schema.ingredients.recipeId, ids))
          .orderBy(asc(schema.ingredients.position)),
      ])
    : [[], []]

  const categoriesByRecipe = new Map<number, number[]>()
  for (const l of links) categoriesByRecipe.set(l.recipeId, [...(categoriesByRecipe.get(l.recipeId) ?? []), l.categoryId])
  const ingredientsByRecipe = new Map<number, string[]>()
  for (const i of ingredients) ingredientsByRecipe.set(i.recipeId, [...(ingredientsByRecipe.get(i.recipeId) ?? []), i.name])

  return rows.map(r => ({
    ...r,
    categoryIds: categoriesByRecipe.get(r.id) ?? [],
    ingredientNames: ingredientsByRecipe.get(r.id) ?? [],
  }))
})
