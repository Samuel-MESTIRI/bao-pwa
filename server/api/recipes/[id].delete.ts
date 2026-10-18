import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await useDb()
  const [deleted] = await db.delete(schema.recipes)
    .where(and(eq(schema.recipes.id, intParam(event)), eq(schema.recipes.userId, user.id)))
    .returning({ image: schema.recipes.image })
  if (!deleted) notFound('Recette')
  await deleteImage(deleted.image)
  return { ok: true }
})
