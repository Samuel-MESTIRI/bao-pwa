import type { RecipeInput } from '#shared/utils/schemas'
import { and, asc, eq, inArray } from 'drizzle-orm'
import type { Db } from './db'

type Tx = Parameters<Parameters<Db['transaction']>[0]>[0]

/** Recette complète (ingrédients, étapes, catégories), ou null si elle n'appartient pas à l'utilisateur. */
export async function findRecipe(db: Db, userId: string, id: number) {
  const recipe = await db.query.recipes.findFirst({
    where: and(eq(schema.recipes.id, id), eq(schema.recipes.userId, userId)),
    columns: { userId: false },
    with: {
      ingredients: { orderBy: asc(schema.ingredients.position), columns: { name: true, quantity: true, unit: true } },
      steps: { orderBy: asc(schema.steps.position), columns: { description: true } },
      recipeCategories: { columns: { categoryId: true } },
    },
  })
  if (!recipe) return null

  const { recipeCategories, steps, ...rest } = recipe
  return {
    ...rest,
    steps: steps.map(s => s.description),
    categoryIds: recipeCategories.map(rc => rc.categoryId),
  }
}

/** Remplace ingrédients, étapes et catégories d'une recette (dans la transaction donnée). */
export async function writeRecipeChildren(tx: Tx, userId: string, recipeId: number, input: RecipeInput) {
  await tx.delete(schema.ingredients).where(eq(schema.ingredients.recipeId, recipeId))
  await tx.delete(schema.steps).where(eq(schema.steps.recipeId, recipeId))
  await tx.delete(schema.recipeCategories).where(eq(schema.recipeCategories.recipeId, recipeId))

  if (input.ingredients.length) {
    await tx.insert(schema.ingredients).values(
      input.ingredients.map((ing, position) => ({ ...ing, recipeId, position })),
    )
  }
  if (input.steps.length) {
    await tx.insert(schema.steps).values(
      input.steps.map((description, position) => ({ description, recipeId, position })),
    )
  }

  const categoryIds = [...new Set(input.categoryIds)]
  if (categoryIds.length) {
    // On ne relie que les catégories de l'utilisateur
    const owned = await tx.select({ id: schema.categories.id })
      .from(schema.categories)
      .where(and(eq(schema.categories.userId, userId), inArray(schema.categories.id, categoryIds)))
    if (owned.length) {
      await tx.insert(schema.recipeCategories).values(owned.map(c => ({ recipeId, categoryId: c.id })))
    }
  }
}

export function recipeColumns(input: RecipeInput) {
  return {
    name: input.name,
    image: input.image,
    prepTime: input.prepTime,
    cookTime: input.cookTime,
    difficulty: input.difficulty,
    servings: input.servings,
  }
}
