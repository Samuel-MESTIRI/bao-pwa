import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { email, password } = await readValid(event, loginSchema)
  rateLimit(`login:${getRequestIP(event, { xForwardedFor: true })}:${email}`, 8, 15 * 60_000)

  const db = await useDb()
  const user = await db.query.users.findFirst({ where: eq(schema.users.email, email) })

  if (!user || !(await verifyPassword(user.passwordHash, password))) {
    throw createError({ statusCode: 401, statusMessage: 'E-mail ou mot de passe incorrect' })
  }

  await setUserSession(event, { user: { id: user.id, email: user.email, name: user.name } })
  return { id: user.id, email: user.email, name: user.name, theme: user.theme }
})
