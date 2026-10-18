import { sql } from 'drizzle-orm'

// Sonde de santé pour Docker / Coolify : l'app répond et la base aussi.
export default defineEventHandler(async () => {
  const db = await useDb()
  await db.execute(sql`select 1`)
  return { ok: true }
})
