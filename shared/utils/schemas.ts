import { z } from 'zod'
import { CATEGORY_ICONS, MAX_SERVINGS, THEME_MODES, UNITS } from './constants'

/** Accepte "12", 12 ou "" (→ null) : les champs numériques d'un formulaire arrivent en texte. */
const optionalInt = (max: number) =>
  z.preprocess(
    v => (v === '' || v === undefined ? null : v),
    z.coerce.number().int().min(0).max(max).nullable(),
  )

const optionalQuantity = z.preprocess(
  v => (v === '' || v === undefined ? null : typeof v === 'string' ? v.replace(',', '.') : v),
  z.coerce.number().min(0).max(100000).nullable(),
)

export const emailSchema = z.string().trim().toLowerCase().email('Adresse e-mail invalide').max(254)

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Indique ton prénom').max(60),
  email: emailSchema,
  password: z.string().min(8, '8 caractères minimum').max(200),
})

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Mot de passe requis').max(200),
})

export const profileSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  theme: z.enum(THEME_MODES).optional(),
})

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(40),
  icon: z.enum(CATEGORY_ICONS).default('tag'),
})

export const ingredientSchema = z.object({
  name: z.string().trim().min(1).max(120),
  quantity: optionalQuantity,
  unit: z.enum(UNITS).nullable().default(null),
})

export const recipeSchema = z.object({
  name: z.string().trim().min(1, 'Donne un nom à ta recette').max(120),
  image: z.string().regex(/^[a-f0-9-]{36}$/).nullable().default(null),
  prepTime: optionalInt(24 * 60),
  cookTime: optionalInt(24 * 60),
  difficulty: z.preprocess(v => (v === '' ? null : v), z.coerce.number().int().min(1).max(3).nullable()).default(null),
  servings: z.coerce.number().int().min(1).max(MAX_SERVINGS).default(4),
  ingredients: z.array(ingredientSchema).max(100).default([]),
  steps: z.array(z.string().trim().min(1).max(2000)).max(60).default([]),
  categoryIds: z.array(z.number().int().positive()).max(30).default([]),
})

export const selectionSchema = z.object({
  recipeId: z.number().int().positive(),
  servings: z.number().int().min(1).max(MAX_SERVINGS),
})

export const shopItemSchema = z.object({
  name: z.string().trim().min(1, 'Nom requis').max(120),
  quantity: optionalQuantity.default(null),
  unit: z.enum(UNITS).nullable().default(null),
})

export const shopItemPatchSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  quantity: optionalQuantity.optional(),
  unit: z.enum(UNITS).nullable().optional(),
  checked: z.boolean().optional(),
})

export type RecipeInput = z.infer<typeof recipeSchema>
