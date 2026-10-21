/**
 * Fichier SVG (assets/icons) d'une icône de catégorie. Les 6 premières viennent
 * de l'app d'origine ; les autres sont des Material Symbols nommés `cat-<id>`.
 */
const LEGACY_ICON_FILE: Record<string, string> = {
  plat: 'category-plat',
  dessert: 'category-dessert',
  healthy: 'category-healthy',
  rapide: 'timer',
  asiatique: 'asia',
  tag: 'chef-hat',
}

const KNOWN_ICONS = new Set<string>(CATEGORY_ICONS)

export function categoryIcon(icon: string | null | undefined) {
  const id = icon && KNOWN_ICONS.has(icon) ? icon : 'tag'
  return LEGACY_ICON_FILE[id] ?? `cat-${id}`
}

export const imageUrl = (image: string | null | undefined, variant: 'full' | 'thumb' = 'full') =>
  image ? `/images/${image}${variant === 'thumb' ? '-thumb' : ''}.webp` : null

export function formatDuration(minutes: number | null | undefined) {
  if (!minutes) return null
  if (minutes < 60) return `${minutes} min`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h} h ${m.toString().padStart(2, '0')}` : `${h} h`
}

export const totalTime = (r: { prepTime: number | null, cookTime: number | null }) =>
  (r.prepTime ?? 0) + (r.cookTime ?? 0) || null

export const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`

/** Message d'erreur lisible depuis une erreur $fetch. */
export function errorMessage(error: unknown, fallback = 'Une erreur est survenue') {
  const e = error as { data?: { message?: string, statusMessage?: string }, statusMessage?: string }
  return e?.data?.message || e?.data?.statusMessage || e?.statusMessage || fallback
}
