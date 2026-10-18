export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const db = await useDb()
  return (await findRecipe(db, user.id, intParam(event))) ?? notFound('Recette')
})
