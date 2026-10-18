import { and, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = intParam(event)
  const patch = await readValid(event, shopItemPatchSchema)
  const db = await useDb()
  const [item] = await db.update(schema.shopItems)
    .set(patch)
    .where(and(eq(schema.shopItems.id, id), eq(schema.shopItems.userId, user.id)))
    .returning({ id: schema.shopItems.id })
  return item ?? notFound('Article')
})
