<script setup lang="ts">
import type { Unit } from '#shared/utils/constants'
import type { RecipeInput } from '#shared/utils/schemas'

interface IngredientRow { key: number, name: string, quantity: string, unit: Unit | '' }
interface StepRow { key: number, text: string }

export interface RecipeFormValue {
  name: string
  image: string | null
  prepTime: number | null
  cookTime: number | null
  difficulty: number | null
  servings: number
  ingredients: { name: string, quantity: number | null, unit: string | null }[]
  steps: string[]
  categoryIds: number[]
}

const props = defineProps<{ initial?: RecipeFormValue, submitLabel: string, saving?: boolean }>()
const emit = defineEmits<{ submit: [value: RecipeInput] }>()

const toast = useToast()
const { data: categories } = await useFetch('/api/categories', { key: 'categories', ...swr })

let nextKey = 0
const ingredientRow = (i?: RecipeFormValue['ingredients'][number]): IngredientRow => ({
  key: nextKey++,
  name: i?.name ?? '',
  quantity: i?.quantity != null ? String(i.quantity).replace('.', ',') : '',
  unit: (i?.unit as Unit) ?? 'g',
})

const form = reactive({
  name: props.initial?.name ?? '',
  image: props.initial?.image ?? null as string | null,
  prepTime: props.initial?.prepTime?.toString() ?? '',
  cookTime: props.initial?.cookTime?.toString() ?? '',
  difficulty: props.initial?.difficulty ?? null as number | null,
  servings: props.initial?.servings ?? 4,
  categoryIds: [...(props.initial?.categoryIds ?? [])],
  ingredients: props.initial?.ingredients.length ? props.initial.ingredients.map(ingredientRow) : [ingredientRow()],
  steps: (props.initial?.steps.length ? props.initial.steps : ['']).map(text => ({ key: nextKey++, text })) as StepRow[],
})

const uploading = ref(false)
const fileInput = ref<HTMLInputElement>()
const previewUrl = ref<string | null>(null)
const photo = computed(() => previewUrl.value ?? imageUrl(form.image))

async function onPhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  uploading.value = true
  previewUrl.value = URL.createObjectURL(file)
  try {
    const body = new FormData()
    body.append('image', await resizeImage(file), 'photo.jpg')
    const { image } = await $fetch('/api/uploads', { method: 'POST', body })
    form.image = image
  }
  catch (e) {
    previewUrl.value = null
    toast.error(errorMessage(e, 'Impossible d\'envoyer la photo'))
  }
  finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

function removePhoto() {
  form.image = null
  previewUrl.value = null
}

function toggleCategory(id: number) {
  const i = form.categoryIds.indexOf(id)
  if (i === -1) form.categoryIds.push(id)
  else form.categoryIds.splice(i, 1)
}

async function addIngredient() {
  form.ingredients.push(ingredientRow())
  await nextTick()
  document.querySelector<HTMLInputElement>(`[data-ingredient="${form.ingredients.at(-1)!.key}"]`)?.focus()
}

async function addStep() {
  form.steps.push({ key: nextKey++, text: '' })
  await nextTick()
  document.querySelector<HTMLTextAreaElement>(`[data-step="${form.steps.at(-1)!.key}"]`)?.focus()
}

function moveStep(index: number, delta: number) {
  const [step] = form.steps.splice(index, 1)
  form.steps.splice(index + delta, 0, step!)
}

function submit() {
  const result = recipeSchema.safeParse({
    name: form.name,
    image: form.image,
    prepTime: form.prepTime,
    cookTime: form.cookTime,
    difficulty: form.difficulty,
    servings: form.servings,
    categoryIds: form.categoryIds,
    ingredients: form.ingredients
      .filter(i => i.name.trim())
      .map(i => ({ name: i.name, quantity: i.quantity, unit: i.quantity.trim() ? i.unit || null : null })),
    steps: form.steps.map(s => s.text.trim()).filter(Boolean),
  })
  if (!result.success) {
    toast.error(result.error.issues[0]?.message ?? 'Vérifie le formulaire')
    return
  }
  if (uploading.value) {
    toast.show('La photo est encore en cours d\'envoi…', 'info')
    return
  }
  emit('submit', result.data)
}
</script>

<template>
  <form class="space-y-7" novalidate @submit.prevent="submit">
    <!-- Photo -->
    <div>
      <input ref="fileInput" type="file" accept="image/*" class="sr-only" tabindex="-1" @change="onPhoto">
      <button
        type="button"
        class="relative flex aspect-[16/9] w-full items-center justify-center overflow-hidden rounded-lg transition active:scale-[0.99]"
        :class="photo ? 'bg-placeholder' : 'border-2 border-dashed border-line-strong bg-surface-alt'"
        :aria-label="photo ? 'Changer la photo' : 'Ajouter une photo'"
        @click="fileInput?.click()"
      >
        <img v-if="photo" :src="photo" alt="" class="size-full object-cover">
        <span v-else class="flex flex-col items-center gap-2 font-bold text-ink-2">
          <AppIcon name="camera" :size="36" />
          Ajouter une photo
        </span>
        <span v-if="photo" class="absolute right-3 bottom-3 inline-flex items-center gap-1.5 rounded-full bg-scrim px-3 py-1.5 text-[13px] font-bold text-white">
          <AppIcon name="camera" :size="16" /> Changer
        </span>
        <span v-if="uploading" class="absolute inset-0 flex items-center justify-center bg-black/30">
          <span class="size-10 animate-spin rounded-full border-4 border-white border-t-transparent" />
        </span>
      </button>
      <button v-if="photo && !uploading" type="button" class="mt-2 min-h-11 text-[15px] font-medium text-danger" @click="removePhoto">
        Retirer la photo
      </button>
    </div>

    <div>
      <label for="name" class="label">Nom de la recette</label>
      <input id="name" v-model="form.name" class="field" placeholder="Tarte aux pommes…" maxlength="120" autocapitalize="sentences" enterkeyhint="next">
    </div>

    <div class="grid grid-cols-2 gap-3">
      <div>
        <label for="prep" class="label">Préparation <span class="font-normal text-muted">(min)</span></label>
        <input id="prep" v-model="form.prepTime" class="field" inputmode="numeric" pattern="[0-9]*" placeholder="15">
      </div>
      <div>
        <label for="cook" class="label">Cuisson <span class="font-normal text-muted">(min)</span></label>
        <input id="cook" v-model="form.cookTime" class="field" inputmode="numeric" pattern="[0-9]*" placeholder="30">
      </div>
    </div>

    <fieldset>
      <legend class="label">
        Difficulté
      </legend>
      <div class="grid grid-cols-3 gap-1 rounded-full bg-surface-alt p-1">
        <button
          v-for="d in DIFFICULTIES"
          :key="d.value"
          type="button"
          class="min-h-12 rounded-full font-medium transition"
          :class="form.difficulty === d.value ? 'bg-primary text-on-primary shadow-(--shadow-card)' : 'text-ink-2'"
          :aria-pressed="form.difficulty === d.value"
          @click="form.difficulty = form.difficulty === d.value ? null : d.value"
        >
          {{ d.label }}
        </button>
      </div>
    </fieldset>

    <div class="flex items-center justify-between gap-3">
      <span class="label mb-0!">Personnes</span>
      <ServingsStepper v-model="form.servings" />
    </div>

    <fieldset v-if="categories?.length">
      <legend class="label">
        Catégories
      </legend>
      <div class="flex flex-wrap gap-2">
        <CategoryChip
          v-for="c in categories"
          :key="c.id"
          :label="c.name"
          :icon="c.icon"
          :active="form.categoryIds.includes(c.id)"
          @click="toggleCategory(c.id)"
        />
      </div>
    </fieldset>

    <!-- Ingrédients -->
    <section>
      <h2 class="mb-1 text-xl font-bold">
        Ingrédients
      </h2>
      <p class="mb-3 text-[15px] text-ink-2">
        Pour {{ form.servings }} personne{{ form.servings > 1 ? 's' : '' }}
      </p>
      <ul class="space-y-3">
        <li v-for="(ing, i) in form.ingredients" :key="ing.key" class="card space-y-2 p-3">
          <input
            v-model="ing.name"
            :data-ingredient="ing.key"
            class="field"
            placeholder="Farine, pommes…"
            :aria-label="`Ingrédient ${i + 1}`"
            maxlength="120"
            enterkeyhint="next"
            @keydown.enter.prevent="addIngredient"
          >
          <div class="flex gap-2">
            <input v-model="ing.quantity" class="field w-28!" inputmode="decimal" placeholder="Qté" :aria-label="`Quantité de l'ingrédient ${i + 1}`">
            <select v-model="ing.unit" class="field flex-1 appearance-none" :aria-label="`Unité de l'ingrédient ${i + 1}`">
              <option v-for="u in UNITS" :key="u" :value="u">
                {{ u }}
              </option>
            </select>
            <IconButton icon="trash" :label="`Supprimer l'ingrédient ${i + 1}`" class="text-danger!" @click="form.ingredients.splice(i, 1)" />
          </div>
        </li>
      </ul>
      <AppButton variant="secondary" icon="plus" class="mt-3" @click="addIngredient">
        Ajouter un ingrédient
      </AppButton>
    </section>

    <!-- Étapes -->
    <section>
      <h2 class="mb-3 text-xl font-bold">
        Étapes de préparation
      </h2>
      <ol class="space-y-3">
        <li v-for="(step, i) in form.steps" :key="step.key" class="card p-3">
          <div class="mb-2 flex items-center gap-1">
            <span class="mr-auto flex size-9 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">{{ i + 1 }}</span>
            <IconButton v-if="i > 0" icon="chevron-right" :label="`Monter l'étape ${i + 1}`" class="-rotate-90" @click="moveStep(i, -1)" />
            <IconButton icon="trash" :label="`Supprimer l'étape ${i + 1}`" class="text-danger!" @click="form.steps.splice(i, 1)" />
          </div>
          <textarea
            v-model="step.text"
            :data-step="step.key"
            class="field min-h-24 resize-y"
            placeholder="Couper les pommes en quartiers…"
            :aria-label="`Étape ${i + 1}`"
            maxlength="2000"
            rows="3"
          />
        </li>
      </ol>
      <AppButton variant="secondary" icon="plus" class="mt-3" @click="addStep">
        Ajouter une étape
      </AppButton>
    </section>

    <div class="sticky bottom-0 -mx-4 border-t border-line bg-bg/95 px-4 pt-3 backdrop-blur-lg" style="padding-bottom: max(env(safe-area-inset-bottom), 12px)">
      <AppButton type="submit" :loading="props.saving" icon="check">
        {{ submitLabel }}
      </AppButton>
    </div>
  </form>
</template>
