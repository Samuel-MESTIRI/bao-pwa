import type { H3Event } from 'h3'
import type { ZodType } from 'zod'

/** Utilisateur connecté, ou 401. */
export async function requireUser(event: H3Event) {
  const { user } = await requireUserSession(event)
  return user
}

/** Corps de requête validé par un schéma Zod, ou 400 avec le premier message d'erreur. */
export async function readValid<T>(event: H3Event, schema: ZodType<T>): Promise<T> {
  const result = schema.safeParse(await readBody(event))
  if (!result.success) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Données invalides',
      message: result.error.issues[0]?.message ?? 'Données invalides',
      data: result.error.issues,
    })
  }
  return result.data
}

/** Paramètre de route numérique (`/api/recipes/12`), ou 400. */
export function intParam(event: H3Event, name = 'id'): number {
  const value = Number(getRouterParam(event, name))
  if (!Number.isInteger(value) || value <= 0) {
    throw createError({ statusCode: 400, statusMessage: 'Identifiant invalide' })
  }
  return value
}

export function notFound(what = 'Élément'): never {
  throw createError({ statusCode: 404, statusMessage: `${what} introuvable` })
}

// Limiteur en mémoire : suffisant pour une seule instance, protège la connexion du brute force.
const attempts = new Map<string, { count: number, resetAt: number }>()

export function rateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now()
  const entry = attempts.get(key)
  if (!entry || entry.resetAt < now) {
    attempts.set(key, { count: 1, resetAt: now + windowMs })
    if (attempts.size > 5000) {
      for (const [k, v] of attempts) if (v.resetAt < now) attempts.delete(k)
    }
    return
  }
  entry.count++
  if (entry.count > max) {
    throw createError({ statusCode: 429, statusMessage: 'Trop de tentatives, réessaie dans quelques minutes' })
  }
}
