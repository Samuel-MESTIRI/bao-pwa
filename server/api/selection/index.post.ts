import { and, eq } from 'drizzle-orm'

/** Ajoute une recette à la sélection, ou met à jour son nombre de parts si elle y est déjà. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const { recipeId, servings } = await readValid(event, selectionSchema)
  const db = await useDb()

  const owned = await db.query.recipes.findFirst({
    where: and(eq(schema.recipes.id, recipeId), eq(schema.recipes.userId, user.id)),
    columns: { id: true },
  })
  if (!owned) notFound('Recette')

  const existing = await db.query.selections.findFirst({
    where: and(eq(schema.selections.userId, user.id), eq(schema.selections.recipeId, recipeId)),
    columns: { id: true },
  })

  if (existing) {
    await db.update(schema.selections).set({ servings }).where(eq(schema.selections.id, existing.id))
    return { status: 'updated' as const }
  }
  await db.insert(schema.selections).values({ userId: user.id, recipeId, servings })
  return { status: 'added' as const }
})
