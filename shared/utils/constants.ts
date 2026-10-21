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

/**
 * Icônes proposées pour une catégorie, classées par thème pour le sélecteur.
 * `tag` (toque) sert de défaut. L'identifiant est enregistré en base : ne pas
 * renommer un identifiant existant.
 */
export const CATEGORY_ICON_GROUPS = [
  {
    label: 'Plats',
    icons: [
      { id: 'plat', label: 'Plat' },
      { id: 'soupe', label: 'Soupe' },
      { id: 'pates', label: 'Pâtes' },
      { id: 'ramen', label: 'Ramen' },
      { id: 'pizza', label: 'Pizza' },
      { id: 'burger', label: 'Burger' },
      { id: 'poisson', label: 'Poisson' },
      { id: 'viande', label: 'Viande, brochettes' },
      { id: 'oeuf', label: 'Œufs' },
      { id: 'riz', label: 'Riz' },
      { id: 'poele', label: 'À la poêle' },
      { id: 'mijote', label: 'Mijoté' },
      { id: 'streetfood', label: 'Street food' },
      { id: 'asiatique', label: 'Asiatique' },
      { id: 'tag', label: 'Toque' },
    ],
  },
  {
    label: 'Desserts & boulangerie',
    icons: [
      { id: 'dessert', label: 'Dessert' },
      { id: 'gateau', label: 'Gâteau' },
      { id: 'cookie', label: 'Cookie' },
      { id: 'glace', label: 'Glace' },
      { id: 'viennoiserie', label: 'Viennoiserie' },
      { id: 'pain', label: 'Pain' },
      { id: 'gourmandise', label: 'Gourmandise' },
    ],
  },
  {
    label: 'Boissons',
    icons: [
      { id: 'cafe', label: 'Café' },
      { id: 'the', label: 'Thé' },
      { id: 'vin', label: 'Vin' },
      { id: 'cocktail', label: 'Cocktail' },
      { id: 'smoothie', label: 'Smoothie, jus' },
    ],
  },
  {
    label: 'Régimes & santé',
    icons: [
      { id: 'healthy', label: 'Healthy' },
      { id: 'vege', label: 'Végé' },
      { id: 'fruits', label: 'Fruits' },
      { id: 'legumes', label: 'Légumes, marché' },
      { id: 'cereales', label: 'Céréales, sans gluten' },
      { id: 'proteine', label: 'Protéiné' },
    ],
  },
  {
    label: 'Moments & occasions',
    icons: [
      { id: 'rapide', label: 'Rapide' },
      { id: 'brunch', label: 'Petit-déjeuner, brunch' },
      { id: 'apero', label: 'Apéro' },
      { id: 'barbecue', label: 'Barbecue' },
      { id: 'fete', label: 'Fête' },
      { id: 'enfants', label: 'Enfants' },
      { id: 'favori', label: 'Coup de cœur' },
      { id: 'monde', label: 'Cuisine du monde' },
    ],
  },
] as const

export type CategoryIcon = (typeof CATEGORY_ICON_GROUPS)[number]['icons'][number]['id']

export const CATEGORY_ICONS = CATEGORY_ICON_GROUPS.flatMap(g => g.icons.map(i => i.id)) as [CategoryIcon, ...CategoryIcon[]]

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
