import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await useDb()
  await db.delete(schema.selections).where(eq(schema.selections.userId, user.id))
  return { ok: true }
})
