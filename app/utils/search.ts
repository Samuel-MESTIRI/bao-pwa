/**
 * Recherche de recettes par nom et par ingrédient, faite sur le téléphone.
 *
 * Tolérante : sans accents ni majuscules (« creme » → « Crème »), singulier et
 * pluriel confondus (« tomate » → « Tomates »). Plusieurs mots : chacun doit
 * être trouvé, dans le nom ou dans un ingrédient.
 */

/** « Crème Fraîche » → « creme fraiche » */
export const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae')

/** Mot ramené au singulier approximatif : « tomates » → « tomate », « gâteaux » → « gateau ». */
const stem = (word: string) => word.replace(/(?<=[a-z]{3})(s|x)$/, '')

/** Texte prêt à la comparaison : sans accents, chaque mot au singulier. */
const searchKey = (s: string) => fold(s).split(/[^a-z0-9]+/).filter(Boolean).map(stem).join(' ')

export interface SearchableRecipe {
  name: string
  ingredientNames: string[]
}

export interface SearchResult<T> {
  recipe: T
  /** Ingrédient qui a fait remonter la recette, quand le nom seul ne suffit pas. */
  matchedIngredient: string | null
}

export function searchRecipes<T extends SearchableRecipe>(recipes: T[], query: string): SearchResult<T>[] {
  const terms = searchKey(query).split(' ').filter(Boolean)
  if (!terms.length) return recipes.map(recipe => ({ recipe, matchedIngredient: null }))

  const byName: SearchResult<T>[] = []
  const byIngredient: SearchResult<T>[] = []

  for (const recipe of recipes) {
    const name = searchKey(recipe.name)
    const ingredients = recipe.ingredientNames.map(original => ({ original, key: searchKey(original) }))

    let matchedIngredient: string | null = null
    const everyTermFound = terms.every((term) => {
      if (name.includes(term)) return true
      const ingredient = ingredients.find(i => i.key.includes(term))
      if (ingredient) matchedIngredient ??= ingredient.original
      return !!ingredient
    })
    if (!everyTermFound) continue

    // Recettes trouvées par leur nom d'abord, puis celles trouvées par un ingrédient
    if (matchedIngredient) byIngredient.push({ recipe, matchedIngredient })
    else byName.push({ recipe, matchedIngredient: null })
  }

  return [...byName, ...byIngredient]
}
