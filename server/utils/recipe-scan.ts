import sharp from 'sharp'
import { z } from 'zod'

/**
 * Lecture d'une recette sur une photo (page de livre) par une IA qui lit les images.
 *
 * Tout ce qui dépend du fournisseur (Gemini) est dans ce fichier : pour en
 * changer, seule `callGemini` est à réécrire.
 */

const DIFFICULTY_VALUES = { facile: 1, moyen: 2, difficile: 3 } as const

export function scanConfig() {
  const config = useRuntimeConfig()
  return {
    apiKey: process.env.GEMINI_API_KEY || config.geminiApiKey,
    // Alias tenu à jour par Google ; remplaçable sans toucher au code (GEMINI_MODEL)
    model: process.env.GEMINI_MODEL || config.geminiModel || 'gemini-flash-lite-latest',
  }
}

export const scanEnabled = () => !!scanConfig().apiKey

const PROMPT = `Tu lis la photo d'une page de livre de recettes (ou d'une fiche recette) pour remplir une application de cuisine.

Règles :
- Utilise uniquement ce qui est écrit sur la page. N'invente rien : pas d'ingrédient, de quantité ou d'étape absents.
- Ignore les icônes, pictogrammes, numéros de page, en-têtes, publicités, notes de bas de page et le texte d'autres recettes.
- Si la page est en anglais ou dans une autre langue, traduis tout en français (titre, ingrédients, étapes).
- S'il n'y a pas de recette lisible sur la photo, réponds avec found = false et laisse le reste vide.

Champs :
- title : le titre de la recette, sans mention publicitaire.
- servings : nombre de personnes (entier), null si absent.
- prepTime / cookTime : temps de préparation / de cuisson en minutes (entiers), null si absents. Si seul un temps total est indiqué, mets-le dans prepTime.
- difficulty : "facile", "moyen" ou "difficile" seulement si c'est écrit ou indiqué par un pictogramme de difficulté, sinon null.
- ingredients : un élément par ingrédient, dans l'ordre de la page. quantity est un nombre (0.5 pour ½, 1.5 pour 1 ½), null si absent. unit est l'une des unités autorisées : « cuillère à soupe » → "CàS", « cuillère à café » → "CàC", cl → convertis en ml (×10), dl → ml (×100), un nombre de pièces (œufs, citrons…) → "unité". name est le nom de l'ingrédient sans la quantité ni l'unité, avec sa précision éventuelle (« beurre mou », « oignons émincés »).
- steps : les étapes de préparation dans l'ordre, une étape par élément, en phrases complètes. Ne numérote pas.
- categories : parmi la liste fournie uniquement, celles qui correspondent clairement à la recette (souvent aucune ou une seule).`

function responseSchema(categoryNames: string[]) {
  return {
    type: 'OBJECT',
    properties: {
      found: { type: 'BOOLEAN' },
      title: { type: 'STRING', nullable: true },
      servings: { type: 'INTEGER', nullable: true },
      prepTime: { type: 'INTEGER', nullable: true },
      cookTime: { type: 'INTEGER', nullable: true },
      difficulty: { type: 'STRING', enum: Object.keys(DIFFICULTY_VALUES), nullable: true },
      ingredients: {
        type: 'ARRAY',
        items: {
          type: 'OBJECT',
          properties: {
            quantity: { type: 'NUMBER', nullable: true },
            unit: { type: 'STRING', enum: [...UNITS], nullable: true },
            name: { type: 'STRING' },
          },
          required: ['name'],
        },
      },
      steps: { type: 'ARRAY', items: { type: 'STRING' } },
      categories: categoryNames.length
        ? { type: 'ARRAY', items: { type: 'STRING', enum: categoryNames } }
        : { type: 'ARRAY', items: { type: 'STRING' } },
    },
    required: ['found', 'ingredients', 'steps'],
    propertyOrdering: ['found', 'title', 'servings', 'prepTime', 'cookTime', 'difficulty', 'ingredients', 'steps', 'categories'],
  }
}

// La réponse de l'IA est revérifiée : on ne fait jamais confiance au format annoncé
const scannedSchema = z.object({
  found: z.boolean(),
  title: z.string().trim().max(200).nullish(),
  servings: z.number().int().min(1).max(MAX_SERVINGS).nullish().catch(null),
  prepTime: z.number().int().min(0).max(24 * 60).nullish().catch(null),
  cookTime: z.number().int().min(0).max(24 * 60).nullish().catch(null),
  difficulty: z.enum(['facile', 'moyen', 'difficile']).nullish().catch(null),
  ingredients: z.array(z.object({
    quantity: z.number().min(0).max(100000).nullish().catch(null),
    unit: z.enum(UNITS).nullish().catch(null),
    name: z.string().trim().max(120),
  })).max(100).default([]),
  steps: z.array(z.string().trim().max(2000)).max(60).default([]),
  categories: z.array(z.string()).max(30).default([]),
})

export type ScannedRecipe = z.infer<typeof scannedSchema>

/** Photo réduite : assez nette pour lire le texte, assez légère pour l'envoi. */
async function prepareImage(input: Buffer) {
  return sharp(input, { limitInputPixels: 60_000_000 })
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 82 })
    .toBuffer()
}

async function callGemini(image: Buffer, categoryNames: string[]): Promise<unknown> {
  const { apiKey, model } = scanConfig()
  const prompt = `${PROMPT}\n\nCatégories disponibles : ${categoryNames.length ? categoryNames.join(', ') : '(aucune)'}.`

  const request = (withThinkingConfig: boolean) => fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    signal: AbortSignal.timeout(45_000),
    headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inline_data: { mime_type: 'image/jpeg', data: image.toString('base64') } },
        ],
      }],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
        responseSchema: responseSchema(categoryNames),
        // Lire une page ne demande pas de « réflexion » : 2 à 3 fois plus rapide
        ...(withThinkingConfig && { thinkingConfig: { thinkingLevel: 'minimal' } }),
      },
    }),
  }).catch((error: Error) => {
    throw createError({
      statusCode: 504,
      statusMessage: error.name === 'TimeoutError' ? 'L\'analyse a pris trop de temps, réessaie' : 'Service d\'analyse injoignable',
    })
  })

  let response = await request(true)
  // Un modèle qui ne connaît pas ce réglage répond 400 : on réessaie sans
  if (response.status === 400) response = await request(false)

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    console.error(`[bao] Gemini ${response.status} : ${detail.slice(0, 500)}`)
    if (response.status === 429) {
      throw createError({ statusCode: 429, statusMessage: 'Le quota de scans du jour est atteint, réessaie demain' })
    }
    throw createError({ statusCode: 502, statusMessage: 'L\'analyse de la photo a échoué, réessaie' })
  }

  const data = await response.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
  const text = data.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('') ?? ''
  try {
    return JSON.parse(text)
  }
  catch {
    console.error('[bao] Gemini : réponse illisible', text.slice(0, 300))
    throw createError({ statusCode: 502, statusMessage: 'L\'analyse de la photo a échoué, réessaie' })
  }
}

/** Photo → recette structurée. La photo n'est jamais écrite sur le disque. */
export async function scanRecipe(photo: Buffer, categoryNames: string[]): Promise<ScannedRecipe> {
  let image: Buffer
  try {
    image = await prepareImage(photo)
  }
  catch {
    throw createError({ statusCode: 415, statusMessage: 'Format d\'image non pris en charge' })
  }

  const parsed = scannedSchema.safeParse(await callGemini(image, categoryNames))
  if (!parsed.success) {
    console.error('[bao] Gemini : réponse hors format', parsed.error.issues.slice(0, 3))
    throw createError({ statusCode: 502, statusMessage: 'L\'analyse de la photo a échoué, réessaie' })
  }
  return parsed.data
}

export const difficultyValue = (d: ScannedRecipe['difficulty']) => (d ? DIFFICULTY_VALUES[d] : null)
