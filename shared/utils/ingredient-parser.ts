import type { Unit } from './constants'

export interface ParsedIngredient {
  name: string
  quantity: number | null
  unit: Unit | null
}

// Unités écrites en toutes lettres ou abrégées → unité de l'app (et facteur de conversion)
const UNIT_ALIASES: { pattern: RegExp, unit: Unit, factor?: number }[] = [
  { pattern: /^(?:kg|kilos?|kilogrammes?)$/, unit: 'kg' },
  { pattern: /^(?:g|gr|grs|grammes?)$/, unit: 'g' },
  { pattern: /^(?:mg|milligrammes?)$/, unit: 'g', factor: 0.001 },
  { pattern: /^(?:l|litres?)$/, unit: 'L' },
  { pattern: /^(?:dl|décilitres?|decilitres?)$/, unit: 'ml', factor: 100 },
  { pattern: /^(?:cl|centilitres?)$/, unit: 'ml', factor: 10 },
  { pattern: /^(?:ml|millilitres?)$/, unit: 'ml' },
  { pattern: /^(?:pincées?)$/, unit: 'pincée' },
  { pattern: /^(?:verres?)$/, unit: 'verre' },
  { pattern: /^(?:tasses?|mugs?)$/, unit: 'tasse' },
  { pattern: /^(?:unités?|pièces?|pcs?)$/, unit: 'unité' },
]

// Cuillères : formes longues et abréviations courantes (c. à s., càs, cs, cuil. à soupe…)
const SPOON = /^(?:cuill?(?:è|e)re?s?|cuill?\.?|c\.?)\s*(?:à|a)?\s*(soupe|café|cafe|s\.?|c\.?)(?=\s|$)|^(?:càs|cas|cs|c\.à\.s\.?)(?=\s|$)|^(?:càc|cac|cc|c\.à\.c\.?)(?=\s|$)/i

const UNICODE_FRACTIONS: Record<string, number> = { '½': 0.5, '¼': 0.25, '¾': 0.75, '⅓': 1 / 3, '⅔': 2 / 3, '⅛': 0.125 }

/** « 1 », « 1,5 », « 1/2 », « 1 1/2 », « ½ », « 1½ ». Retourne la valeur et la longueur lue. */
function readQuantity(text: string): { value: number, length: number } | null {
  let m = text.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)/) // « 1 1/2 »
  let value = m ? Number(m[1]) + Number(m[2]) / Number(m[3]) : 0
  if (!m) {
    m = text.match(/^(\d+)\s*\/\s*(\d+)/) // « 1/2 »
    if (m) value = Number(m[1]) / Number(m[2])
  }
  if (!m) {
    m = text.match(/^(\d+(?:[.,]\d+)?)?\s*([½¼¾⅓⅔⅛])?/) // « 1,5 », « ½ », « 1½ »
    if (!m || !m[0].trim()) return null
    value = (m[1] ? Number(m[1].replace(',', '.')) : 0) + (m[2] ? UNICODE_FRACTIONS[m[2]]! : 0)
  }
  if (!Number.isFinite(value) || value <= 0) return null
  return { value, length: m[0].length }
}

/** Retire « de », « d' », « des » en tête du nom : « de farine » → « farine ». */
const stripPartitive = (s: string) => s.replace(/^(?:de\s+la\s+|de\s+l['’]\s*|des\s+|du\s+|de\s+|d['’]\s*)/i, '')

const clean = (s: string) => s.replace(/\s+/g, ' ').replace(/^[\s,;:–—-]+|[\s,;:]+$/g, '').trim()

const upperFirst = (s: string) => (s ? s[0]!.toUpperCase() + s.slice(1) : s)

/**
 * Découpe une ligne d'ingrédient en quantité, unité et nom :
 * « 200 g de farine » → 200 / g / Farine
 * « 3 cuillères à soupe d'huile d'olive » → 3 / CàS / Huile d'olive
 * « 20 cl de lait » → 200 / ml / Lait
 * « 2 oeufs » → 2 / unité / Oeufs
 * « Sel, poivre » → – / – / Sel, poivre
 */
export function parseIngredient(line: string): ParsedIngredient {
  let text = clean(line.replace(/ /g, ' '))
  if (!text) return { name: '', quantity: null, unit: null }

  const quantity = readQuantity(text)
  if (!quantity) return { name: upperFirst(text), quantity: null, unit: null }

  let value = quantity.value
  text = text.slice(quantity.length).trim()

  // Plage « 2 à 3 », « 2-3 » : on garde la borne haute pour ne pas en manquer
  const range = text.match(/^(?:à|a|-|–)\s*(\d+(?:[.,]\d+)?)\s*/)
  if (range) {
    value = Math.max(value, Number(range[1]!.replace(',', '.')))
    text = text.slice(range[0].length)
  }

  let unit: Unit | null = null

  const spoon = text.match(SPOON)
  if (spoon) {
    const kind = (spoon[1] ?? spoon[0]).toLowerCase()
    unit = /^(?:s|soupe|càs|cas|cs|c\.à\.s)/.test(kind.replace(/\.$/, '')) ? 'CàS' : 'CàC'
    text = text.slice(spoon[0].length)
  }
  else {
    const word = text.match(/^([a-zA-Zàâçéèêëîïôûùüÿ.]+)(?=\s|$|\))/)
    const candidate = word?.[1]?.replace(/\.$/, '').toLowerCase()
    const alias = candidate ? UNIT_ALIASES.find(a => a.pattern.test(candidate)) : undefined
    if (alias) {
      unit = alias.unit
      value *= alias.factor ?? 1
      text = text.slice(word![0].length).trim()
      // « 1 kg 500 de bœuf » : les grammes après les kilos
      const grams = unit === 'kg' ? text.match(/^(\d{1,3})(?=\s)/) : null
      if (grams) {
        value += Number(grams[1]) / 1000
        text = text.slice(grams[0].length)
      }
    }
  }

  const name = upperFirst(clean(stripPartitive(clean(text))))
  return {
    name: name || upperFirst(clean(line)),
    quantity: Math.round(value * 100) / 100,
    unit: unit ?? 'unité',
  }
}
