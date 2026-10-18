import { asc, eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await useDb()
  return db.select({
    id: schema.shopItems.id,
    name: schema.shopItems.name,
    quantity: schema.shopItems.quantity,
    unit: schema.shopItems.unit,
    checked: schema.shopItems.checked,
    generated: schema.shopItems.generated,
  })
    .from(schema.shopItems)
    .where(eq(schema.shopItems.userId, user.id))
    .orderBy(asc(schema.shopItems.createdAt), asc(schema.shopItems.id))
})
