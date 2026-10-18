import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  pgTable,
  primaryKey,
  real,
  serial,
  smallint,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

const createdAt = () => timestamp('created_at', { withTimezone: true }).notNull().defaultNow()

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull(),
  name: text('name').notNull(),
  passwordHash: text('password_hash').notNull(),
  theme: text('theme').notNull().default('system'),
  createdAt: createdAt(),
}, t => [uniqueIndex('users_email_idx').on(t.email)])

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  icon: text('icon').notNull().default('tag'),
  position: integer('position').notNull().default(0),
}, t => [index('categories_user_idx').on(t.userId)])

export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  /** Identifiant de la photo : fichiers `<image>.webp` et `<image>-thumb.webp` dans UPLOAD_DIR. */
  image: text('image'),
  prepTime: integer('prep_time'),
  cookTime: integer('cook_time'),
  /** 1 facile, 2 moyen, 3 difficile */
  difficulty: smallint('difficulty'),
  servings: integer('servings').notNull().default(4),
  createdAt: createdAt(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, t => [index('recipes_user_idx').on(t.userId, t.createdAt)])

export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  name: text('name').notNull(),
  quantity: real('quantity'),
  unit: text('unit'),
}, t => [index('ingredients_recipe_idx').on(t.recipeId)])

export const steps = pgTable('steps', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  position: integer('position').notNull(),
  description: text('description').notNull(),
}, t => [index('steps_recipe_idx').on(t.recipeId)])

export const recipeCategories = pgTable('recipe_categories', {
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  categoryId: integer('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),
}, t => [primaryKey({ columns: [t.recipeId, t.categoryId] })])

/** Recettes mises de côté pour générer la liste de courses. */
export const selections = pgTable('selections', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipeId: integer('recipe_id').notNull().references(() => recipes.id, { onDelete: 'cascade' }),
  servings: integer('servings').notNull(),
  createdAt: createdAt(),
}, t => [uniqueIndex('selections_user_recipe_idx').on(t.userId, t.recipeId)])

export const shopItems = pgTable('shop_items', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  quantity: real('quantity'),
  unit: text('unit'),
  checked: boolean('checked').notNull().default(false),
  /** Un article généré est remplacé à la prochaine génération, un article manuel est conservé. */
  generated: boolean('generated').notNull().default(false),
  createdAt: createdAt(),
}, t => [index('shop_items_user_idx').on(t.userId)])

export const recipesRelations = relations(recipes, ({ many }) => ({
  ingredients: many(ingredients),
  steps: many(steps),
  recipeCategories: many(recipeCategories),
}))

export const ingredientsRelations = relations(ingredients, ({ one }) => ({
  recipe: one(recipes, { fields: [ingredients.recipeId], references: [recipes.id] }),
}))

export const stepsRelations = relations(steps, ({ one }) => ({
  recipe: one(recipes, { fields: [steps.recipeId], references: [recipes.id] }),
}))

export const recipeCategoriesRelations = relations(recipeCategories, ({ one }) => ({
  recipe: one(recipes, { fields: [recipeCategories.recipeId], references: [recipes.id] }),
  category: one(categories, { fields: [recipeCategories.categoryId], references: [categories.id] }),
}))

export const selectionsRelations = relations(selections, ({ one }) => ({
  recipe: one(recipes, { fields: [selections.recipeId], references: [recipes.id] }),
}))
