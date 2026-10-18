import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = intParam(event)
  const input = await readValid(event, recipeSchema)
  const db = await useDb()

  const previous = await db.query.recipes.findFirst({
    where: and(eq(schema.recipes.id, id), eq(schema.recipes.userId, user.id)),
    columns: { image: true },
  })
  if (!previous) notFound('Recette')

  await db.transaction(async (tx) => {
    await tx.update(schema.recipes)
      .set({ ...recipeColumns(input), updatedAt: new Date() })
      .where(eq(schema.recipes.id, id))
    await writeRecipeChildren(tx, user.id, id, input)
  })

  // Photo remplacée ou retirée : l'ancienne ne sert plus
  if (previous.image && previous.image !== input.image) await deleteImage(previous.image)

  return findRecipe(db, user.id, id)
})
