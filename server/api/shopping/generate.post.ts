import { and, asc, eq, inArray } from 'drizzle-orm'

/**
 * Génère la liste de courses à partir de la sélection.
 * Les articles générés précédemment sont remplacés ; ceux ajoutés à la main restent.
 */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await useDb()

  const selected = await db.select({
    recipeId: schema.selections.recipeId,
    servings: schema.selections.servings,
    baseServings: schema.recipes.servings,
  })
    .from(schema.selections)
    .innerJoin(schema.recipes, eq(schema.recipes.id, schema.selections.recipeId))
    .where(eq(schema.selections.userId, user.id))
    .orderBy(asc(schema.selections.createdAt))

  if (!selected.length) throw createError({ statusCode: 400, statusMessage: 'Ta sélection est vide' })

  const rows = await db.select()
    .from(schema.ingredients)
    .where(inArray(schema.ingredients.recipeId, selected.map(s => s.recipeId)))
    .orderBy(asc(schema.ingredients.recipeId), asc(schema.ingredients.position))

  const byRecipe = new Map(selected.map(s => [s.recipeId, s]))
  const lines = buildShoppingList(selected.flatMap(s =>
    rows.filter(r => r.recipeId === s.recipeId).map(r => ({
      name: r.name,
      unit: r.unit,
      quantity: scaleQuantity(r.quantity, byRecipe.get(r.recipeId)!.baseServings, s.servings),
    })),
  ))

  await db.transaction(async (tx) => {
    await tx.delete(schema.shopItems)
      .where(and(eq(schema.shopItems.userId, user.id), eq(schema.shopItems.generated, true)))
    if (lines.length) {
      await tx.insert(schema.shopItems).values(lines.map(l => ({ ...l, userId: user.id, generated: true })))
    }
  })

  return { count: lines.length }
})
