export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const input = await readValid(event, recipeSchema)
  const db = await useDb()

  const id = await db.transaction(async (tx) => {
    const [recipe] = await tx.insert(schema.recipes)
      .values({ ...recipeColumns(input), userId: user.id })
      .returning({ id: schema.recipes.id })
    await writeRecipeChildren(tx, user.id, recipe!.id, input)
    return recipe!.id
  })

  setResponseStatus(event, 201)
  return findRecipe(db, user.id, id)
})
