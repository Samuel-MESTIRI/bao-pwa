import { eq } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const patch = await readValid(event, profileSchema)
  const db = await useDb()

  const [user] = await db.update(schema.users)
    .set(patch)
    .where(eq(schema.users.id, session.user.id))
    .returning({ id: schema.users.id, email: schema.users.email, name: schema.users.name, theme: schema.users.theme })

  if (patch.name) {
    await setUserSession(event, { user: { ...session.user, name: patch.name } })
  }
  return user
})
