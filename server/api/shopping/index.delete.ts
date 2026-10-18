import { and, eq } from 'drizzle-orm'

/** Vide la liste ; `?checked=1` ne retire que les articles cochés. */
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const onlyChecked = getQuery(event).checked === '1'
  const db = await useDb()
  await db.delete(schema.shopItems).where(and(
    eq(schema.shopItems.userId, user.id),
    onlyChecked ? eq(schema.shopItems.checked, true) : undefined,
  ))
  return { ok: true }
})
