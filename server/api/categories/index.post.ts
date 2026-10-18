import { eq, max } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const data = await readValid(event, categorySchema)
  const db = await useDb()

  const [last] = await db.select({ value: max(schema.categories.position) })
    .from(schema.categories)
    .where(eq(schema.categories.userId, user.id))

  const [category] = await db.insert(schema.categories)
    .values({ ...data, userId: user.id, position: (last?.value ?? -1) + 1 })
    .returning({ id: schema.categories.id, name: schema.categories.name, icon: schema.categories.icon })
  return category
})
