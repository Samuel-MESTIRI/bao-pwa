import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await useDb()
  await db.delete(schema.shopItems)
    .where(and(eq(schema.shopItems.id, intParam(event)), eq(schema.shopItems.userId, user.id)))
  return { ok: true }
})
