/** Unités proposées pour les ingrédients (reprises de l'app d'origine). */
export const UNITS = ['g', 'kg', 'ml', 'L', 'CàC', 'CàS', 'tasse', 'pincée', 'verre', 'unité'] as const
export type Unit = (typeof UNITS)[number]

export const DIFFICULTIES = [
  { value: 1, label: 'Facile' },
  { value: 2, label: 'Moyen' },
  { value: 3, label: 'Difficile' },
] as const

export const difficultyLabel = (value: number | null | undefined) =>
  DIFFICULTIES.find(d => d.value === value)?.label ?? null

/** Icônes disponibles pour une catégorie. `tag` sert de défaut. */
export const CATEGORY_ICONS = ['plat', 'dessert', 'healthy', 'rapide', 'asiatique', 'tag'] as const
export type CategoryIcon = (typeof CATEGORY_ICONS)[number]

/** Catégories créées pour chaque nouveau compte. */
export const DEFAULT_CATEGORIES: { name: string, icon: CategoryIcon }[] = [
  { name: 'Plat', icon: 'plat' },
  { name: 'Dessert', icon: 'dessert' },
  { name: 'Healthy', icon: 'healthy' },
  { name: 'Rapide', icon: 'rapide' },
  { name: 'Asiatique', icon: 'asiatique' },
]

export const THEME_MODES = ['system', 'light', 'dark'] as const
export type ThemeMode = (typeof THEME_MODES)[number]

export const THEME_COOKIE = 'bao-theme'

export const MAX_SERVINGS = 30
