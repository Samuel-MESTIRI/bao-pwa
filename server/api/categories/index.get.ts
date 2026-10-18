import { asc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await useDb()
  return db.select({ id: schema.categories.id, name: schema.categories.name, icon: schema.categories.icon })
    .from(schema.categories)
    .where(eq(schema.categories.userId, user.id))
    .orderBy(asc(schema.categories.position), asc(schema.categories.id))
})
