import type { ParsedIngredient } from '#shared/utils/ingredient-parser'

/**
 * Lecture d'une recette depuis une page web.
 *
 * Marmiton, Journal des Femmes, 750g, Cuisine AZ… publient dans leurs pages
 * une fiche structurée (schema.org/Recipe en JSON-LD) destinée aux moteurs de
 * recherche : on la lit plutôt que de deviner à partir du HTML.
 */

export interface ImportedRecipe {
  name: string
  imageUrl: string | null
  prepTime: number | null
  cookTime: number | null
  servings: number | null
  ingredients: ParsedIngredient[]
  steps: string[]
  keywords: string[]
  source: string
}

type Json = Record<string, unknown>

const asArray = <T>(v: T | T[] | undefined | null): T[] => (v == null ? [] : Array.isArray(v) ? v : [v])

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: '\'', nbsp: ' ', eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', ocirc: 'ô', ecirc: 'ê', rsquo: '’', oelig: 'œ' }

/** Texte brut : sans balises HTML ni entités, espaces normalisés. */
export function plainText(value: unknown): string {
  if (typeof value !== 'string') return ''
  return value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(Number.parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, name) => ENTITIES[name.toLowerCase()] ?? m)
    .replace(/[ \t ]+/g, ' ')
    .replace(/\s*\n\s*/g, '\n')
    .trim()
}

/** Durée ISO 8601 (« PT1H30M », « P0DT0H20M ») en minutes. */
export function isoDurationToMinutes(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const m = value.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/i)
  if (!m) return null
  const minutes = Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0) + Math.round(Number(m[4] ?? 0) / 60)
  return minutes > 0 ? minutes : null
}

function parseServings(value: unknown): number | null {
  for (const v of asArray(value as unknown)) {
    const n = Number(String(v).match(/\d+/)?.[0])
    if (n > 0) return Math.min(n, MAX_SERVINGS)
  }
  return null
}

function parseImage(value: unknown): string | null {
  for (const v of asArray(value as unknown)) {
    if (typeof v === 'string' && v) return v
    if (v && typeof v === 'object') {
      const url = (v as Json).url ?? (v as Json).contentUrl
      if (typeof url === 'string' && url) return url
    }
  }
  return null
}

/** Étapes : texte simple, liste de HowToStep, ou sections HowToSection. */
function parseSteps(value: unknown): string[] {
  const steps: string[] = []
  const visit = (node: unknown) => {
    if (typeof node === 'string') {
      // Un seul bloc de texte : une étape par ligne
      steps.push(...plainText(node).split('\n'))
      return
    }
    if (!node || typeof node !== 'object') return
    const obj = node as Json
    if (obj.itemListElement) {
      asArray(obj.itemListElement).forEach(visit)
      return
    }
    steps.push(plainText(obj.text ?? obj.name))
  }
  asArray(value).forEach(visit)
  return steps.map(s => s.trim()).filter(s => s.length > 1)
}

function isRecipe(node: Json) {
  return asArray(node['@type'] as string | string[]).some(t => typeof t === 'string' && t.toLowerCase() === 'recipe')
}

/** Cherche le premier objet Recipe dans un JSON-LD (tableau, @graph, mainEntity…). */
function findRecipe(node: unknown, depth = 0): Json | null {
  if (!node || typeof node !== 'object' || depth > 6) return null
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findRecipe(item, depth + 1)
      if (found) return found
    }
    return null
  }
  const obj = node as Json
  if (isRecipe(obj)) return obj
  for (const key of ['@graph', 'mainEntity', 'mainEntityOfPage', 'itemListElement']) {
    const found = findRecipe(obj[key], depth + 1)
    if (found) return found
  }
  return null
}

export function extractRecipe(html: string, pageUrl: URL): ImportedRecipe | null {
  const scripts = html.matchAll(/<script[^>]*type=["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)
  for (const [, content] of scripts) {
    let data: unknown
    try {
      data = JSON.parse(content!.trim())
    }
    catch {
      continue
    }
    const recipe = findRecipe(data)
    if (!recipe) continue

    const imageUrl = parseImage(recipe.image)
    const keywords = [
      ...asArray(recipe.recipeCategory as string | string[]),
      ...asArray(recipe.recipeCuisine as string | string[]),
      ...asArray(recipe.keywords as string | string[]).flatMap(k => String(k).split(',')),
    ].map(k => plainText(String(k))).filter(Boolean)

    const prepTime = isoDurationToMinutes(recipe.prepTime)
    const cookTime = isoDurationToMinutes(recipe.cookTime)
    const totalTime = isoDurationToMinutes(recipe.totalTime)

    return {
      // « Gâteau au chocolat : la meilleure recette » → « Gâteau au chocolat »
      name: plainText(recipe.name).replace(/\s*[:|–—-]\s*(?:la\s+)?(?:meilleure\s+|vraie\s+|recette\s+(?:facile|rapide)\b).*$/i, '').slice(0, 120),
      imageUrl: imageUrl ? new URL(imageUrl, pageUrl).toString() : null,
      prepTime: prepTime ?? (cookTime == null ? totalTime : null),
      cookTime,
      servings: parseServings(recipe.recipeYield),
      ingredients: asArray(recipe.recipeIngredient as string | string[])
        .map(line => parseIngredient(plainText(String(line))))
        .filter(i => i.name)
        .slice(0, 100),
      steps: parseSteps(recipe.recipeInstructions).slice(0, 60).map(s => s.slice(0, 2000)),
      keywords,
      source: pageUrl.toString(),
    }
  }
  return null
}
