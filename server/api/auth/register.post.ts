import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  rateLimit(`register:${getRequestIP(event, { xForwardedFor: true })}`, 10, 60 * 60_000)
  const { name, email, password } = await readValid(event, registerSchema)
  const db = await useDb()

  const existing = await db.query.users.findFirst({ where: eq(schema.users.email, email), columns: { id: true } })
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: 'Un compte existe déjà avec cette adresse' })
  }

  const passwordHash = await hashPassword(password)
  const user = await db.transaction(async (tx) => {
    const [created] = await tx.insert(schema.users).values({ name, email, passwordHash }).returning()
    await tx.insert(schema.categories).values(
      DEFAULT_CATEGORIES.map((c, position) => ({ ...c, position, userId: created!.id })),
    )
    return created!
  })

  await setUserSession(event, { user: { id: user.id, email: user.email, name: user.name } })
  return { id: user.id, email: user.email, name: user.name, theme: user.theme }
})
