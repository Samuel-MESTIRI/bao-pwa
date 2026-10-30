// Le scan est-il disponible (clé configurée) et combien en reste-t-il aujourd'hui ?
export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  if (!scanEnabled()) return { enabled: false, remaining: 0, limit: AI_USER_DAILY_LIMIT }
  const { remaining } = await scanQuota(user.id)
  return { enabled: true, remaining, limit: AI_USER_DAILY_LIMIT }
})
