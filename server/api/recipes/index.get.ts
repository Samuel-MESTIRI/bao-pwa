import { desc, eq, inArray } from 'drizzle-orm'

// Liste légère pour l'accueil : pas d'ingrédients ni d'étapes.
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

  const links = rows.length
    ? await db.select().from(schema.recipeCategories).where(inArray(schema.recipeCategories.recipeId, rows.map(r => r.id)))
    : []

  return rows.map(r => ({
    ...r,
    categoryIds: links.filter(l => l.recipeId === r.id).map(l => l.categoryId),
  }))
})
