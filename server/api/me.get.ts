import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { id } = await requireUser(event)
  const db = await useDb()
  const user = await db.query.users.findFirst({
    where: eq(schema.users.id, id),
    columns: { id: true, email: true, name: true, theme: true },
  })
  if (!user) {
    // Compte supprimé alors que la session courait encore
    await clearUserSession(event)
    throw createError({ statusCode: 401, statusMessage: 'Session expirée' })
  }
  return user
})
