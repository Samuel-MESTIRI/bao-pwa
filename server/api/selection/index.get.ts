import { asc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await useDb()
  return db.select({
    id: schema.selections.id,
    recipeId: schema.selections.recipeId,
    servings: schema.selections.servings,
    name: schema.recipes.name,
    image: schema.recipes.image,
    baseServings: schema.recipes.servings,
  })
    .from(schema.selections)
    .innerJoin(schema.recipes, eq(schema.recipes.id, schema.selections.recipeId))
    .where(eq(schema.selections.userId, user.id))
    .orderBy(asc(schema.selections.createdAt))
})
