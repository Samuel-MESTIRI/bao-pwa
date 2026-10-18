import type { Unit } from './constants'

export interface ShoppingInput {
  name: string
  quantity: number | null
  unit: string | null
}

export interface ShoppingLine {
  name: string
  quantity: number | null
  unit: Unit | null
}

// Unités convertibles entre elles : on additionne dans l'unité de base.
const CONVERSIONS: Record<string, { base: 'g' | 'ml', factor: number }> = {
  g: { base: 'g', factor: 1 },
  kg: { base: 'g', factor: 1000 },
  ml: { base: 'ml', factor: 1 },
  L: { base: 'ml', factor: 1000 },
}

/** Clé de regroupement d'un nom : « Tomates » et « tomate » vont ensemble. */
export function normalizeName(name: string) {
  return name
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/(?<=\w{3})(s|x)$/, '')
}

export const roundQuantity = (q: number) => Math.round(q * 100) / 100

/**
 * Fusionne les ingrédients identiques et additionne les quantités compatibles
 * (g + kg, ml + L, ou même unité). Les ingrédients sans quantité ne sont listés
 * qu'une fois, et seulement si aucune ligne chiffrée n'existe pour eux.
 */
export function buildShoppingList(items: ShoppingInput[]): ShoppingLine[] {
  const groups = new Map<string, { name: string, quantity: number | null, unit: string | null }>()
  const order: string[] = []

  for (const item of items) {
    const name = item.name.trim()
    if (!name) continue
    const key = normalizeName(name)
    const conversion = item.unit ? CONVERSIONS[item.unit] : undefined
    const unit = conversion?.base ?? item.unit
    const quantity = item.quantity == null ? null : item.quantity * (conversion?.factor ?? 1)
    const groupKey = `${key}|${quantity == null ? '∅' : unit ?? ''}`

    const group = groups.get(groupKey)
    if (group) {
      if (quantity != null) group.quantity = (group.quantity ?? 0) + quantity
    }
    else {
      groups.set(groupKey, { name, quantity, unit: quantity == null ? null : unit })
      order.push(groupKey)
    }
  }

  const quantified = new Set(order.filter(k => !k.endsWith('|∅')).map(k => k.split('|')[0]))

  return order
    .filter(k => !(k.endsWith('|∅') && quantified.has(k.split('|')[0])))
    .map((k) => {
      const { name, quantity, unit } = groups.get(k)!
      if (quantity != null && (unit === 'g' || unit === 'ml') && quantity >= 1000) {
        return { name, quantity: roundQuantity(quantity / 1000), unit: unit === 'g' ? 'kg' : 'L' }
      }
      return { name, quantity: quantity == null ? null : roundQuantity(quantity), unit: unit as Unit | null }
    })
}

/** Quantité d'un ingrédient ajustée au nombre de parts choisi. */
export function scaleQuantity(quantity: number | null, base: number, target: number) {
  if (quantity == null) return null
  return roundQuantity((quantity * target) / (base || 1))
}

/** « 1,5 » plutôt que « 1.5 », sans zéros inutiles. */
export function formatQuantity(quantity: number | null) {
  if (quantity == null) return ''
  return roundQuantity(quantity).toLocaleString('fr-FR', { maximumFractionDigits: 2 })
}

/** « 250 g », « 1,5 kg », « 6 » (l'unité « unité » n'est pas affichée). */
export function formatAmount(quantity: number | null, unit: string | null) {
  if (quantity == null) return ''
  // Arrondi « cuisine » : 333 g plutôt que 333,33 g, 1,3 cuillère plutôt que 1,33
  const digits = (unit === 'g' || unit === 'ml') && quantity >= 10 ? 0 : unit === 'kg' || unit === 'L' ? 2 : 1
  const value = quantity.toLocaleString('fr-FR', { maximumFractionDigits: digits })
  return [value, unit === 'unité' ? null : unit].filter(Boolean).join(' ')
}
