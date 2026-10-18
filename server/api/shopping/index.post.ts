export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const data = await readValid(event, shopItemSchema)
  const db = await useDb()
  const [item] = await db.insert(schema.shopItems)
    .values({ ...data, userId: user.id })
    .returning({
      id: schema.shopItems.id,
      name: schema.shopItems.name,
      quantity: schema.shopItems.quantity,
      unit: schema.shopItems.unit,
      checked: schema.shopItems.checked,
      generated: schema.shopItems.generated,
    })
  setResponseStatus(event, 201)
  return item
})
