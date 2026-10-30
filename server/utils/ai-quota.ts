import { and, eq, sql, sum } from 'drizzle-orm'

/** Scans par utilisateur et par jour. */
export const AI_USER_DAILY_LIMIT = 20
/** Plafond global, sous le quota gratuit de Gemini (≈ 500 / jour) pour garder une marge. */
export const AI_GLOBAL_DAILY_LIMIT = 450

/** Jour du quota Gemini : il se remet à zéro à minuit, heure de Californie. */
export function quotaDay(date = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Los_Angeles' }).format(date)
}

export async function scanQuota(userId: string) {
  const db = await useDb()
  const day = quotaDay()
  const [mine] = await db.select({ count: schema.aiUsage.count })
    .from(schema.aiUsage)
    .where(and(eq(schema.aiUsage.userId, userId), eq(schema.aiUsage.day, day)))
  const [all] = await db.select({ total: sum(schema.aiUsage.count) })
    .from(schema.aiUsage)
    .where(eq(schema.aiUsage.day, day))

  const used = mine?.count ?? 0
  const globalUsed = Number(all?.total ?? 0)
  return {
    used,
    remaining: Math.max(0, Math.min(AI_USER_DAILY_LIMIT - used, AI_GLOBAL_DAILY_LIMIT - globalUsed)),
    userLimitReached: used >= AI_USER_DAILY_LIMIT,
    globalLimitReached: globalUsed >= AI_GLOBAL_DAILY_LIMIT,
  }
}

/**
 * Réserve un scan avant l'appel à l'IA (refus si un plafond est atteint).
 * Compté même si l'appel échoue ensuite : le fournisseur le compte aussi.
 */
export async function reserveScan(userId: string) {
  const quota = await scanQuota(userId)
  if (quota.userLimitReached) {
    throw createError({ statusCode: 429, statusMessage: `Tu as utilisé tes ${AI_USER_DAILY_LIMIT} scans du jour, réessaie demain` })
  }
  if (quota.globalLimitReached) {
    throw createError({ statusCode: 429, statusMessage: 'Le quota de scans du jour est atteint, réessaie demain' })
  }

  const db = await useDb()
  await db.insert(schema.aiUsage)
    .values({ userId, day: quotaDay(), count: 1 })
    .onConflictDoUpdate({
      target: [schema.aiUsage.userId, schema.aiUsage.day],
      set: { count: sql`${schema.aiUsage.count} + 1` },
    })
}
