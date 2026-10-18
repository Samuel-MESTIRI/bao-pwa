import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = intParam(event)
  const data = await readValid(event, categorySchema)
  const db = await useDb()

  const [category] = await db.update(schema.categories)
    .set(data)
    .where(and(eq(schema.categories.id, id), eq(schema.categories.userId, user.id)))
    .returning({ id: schema.categories.id, name: schema.categories.name, icon: schema.categories.icon })
  return category ?? notFound('Catégorie')
})
