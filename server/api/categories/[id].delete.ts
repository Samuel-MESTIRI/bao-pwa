import { and, eq } from 'drizzle-orm'

// Les liens recette ↔ catégorie partent en cascade ; les recettes restent.
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = intParam(event)
  const db = await useDb()
  const deleted = await db.delete(schema.categories)
    .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, user.id)))
    .returning({ id: schema.categories.id })
  if (!deleted.length) notFound('Catégorie')
  return { ok: true }
})
