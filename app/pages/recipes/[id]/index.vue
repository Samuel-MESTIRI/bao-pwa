<script setup lang="ts">
definePageMeta({ layout: 'bare' })

const route = useRoute()
const id = Number(route.params.id)
const toast = useToast()
const { confirm } = useConfirm()
const selectionCount = useSelectionCount()

const [{ data: recipe, error, refresh }, { data: categories }, { data: selection }] = await Promise.all([
  useFetch(`/api/recipes/${id}`, { key: `recipe-${id}`, ...swr }),
  useFetch('/api/categories', { key: 'categories', ...swr }),
  useFetch('/api/selection', { key: 'selection', ...swr }),
])
revalidate(refresh)

if (error.value?.statusCode === 404) {
  throw createError({ statusCode: 404, statusMessage: 'Recette introuvable', fatal: true })
}

useHead({ title: () => `${recipe.value?.name ?? 'Recette'} · BAO` })

const inSelection = computed(() => selection.value?.find(s => s.recipeId === id))
const servings = ref(inSelection.value?.servings ?? recipe.value?.servings ?? 4)
watch(() => recipe.value?.servings, (value) => {
  if (value && !inSelection.value) servings.value = value
})

const recipeCategories = computed(() =>
  (categories.value ?? []).filter(c => recipe.value?.categoryIds.includes(c.id)))

const menuOpen = ref(false)
const adding = ref(false)

async function addToSelection() {
  if (!recipe.value) return
  adding.value = true
  try {
    const { status } = await $fetch('/api/selection', { method: 'POST', body: { recipeId: id, servings: servings.value } })
    toast.show(status === 'updated'
      ? `Sélection mise à jour · ${servings.value} pers.`
      : `Ajoutée à ta sélection · ${servings.value} pers.`)
    await refreshNuxtData('selection')
    selectionCount.refresh()
  }
  catch (e) {
    toast.error(errorMessage(e))
  }
  finally {
    adding.value = false
  }
}

async function remove() {
  menuOpen.value = false
  const ok = await confirm({
    title: 'Supprimer cette recette ?',
    message: `« ${recipe.value?.name} » sera définitivement supprimée.`,
    confirmLabel: 'Supprimer',
    danger: true,
  })
  if (!ok) return
  try {
    await $fetch(`/api/recipes/${id}`, { method: 'DELETE' })
    toast.show('Recette supprimée')
    clearNuxtData(`recipe-${id}`)
    await Promise.all([refreshNuxtData('recipes'), selectionCount.refresh()])
    await navigateTo('/', { replace: true })
  }
  catch (e) {
    toast.error(errorMessage(e))
  }
}
</script>

<template>
  <div v-if="recipe" class="mx-auto max-w-2xl pb-[calc(7rem+env(safe-area-inset-bottom))]">
    <!-- Photo -->
    <div class="relative aspect-[4/3] max-h-[52dvh] w-full bg-placeholder sm:rounded-b-lg sm:overflow-hidden">
      <img
        v-if="recipe.image"
        :src="imageUrl(recipe.image)!"
        alt=""
        class="size-full object-cover"
        fetchpriority="high"
      >
      <div v-else class="flex size-full items-center justify-center text-line-strong">
        <AppIcon name="chef-hat" :size="96" />
      </div>
      <div class="absolute inset-x-0 top-0 h-28 bg-linear-to-b from-black/40 to-transparent" />
      <div class="safe-top safe-x absolute inset-x-0 top-0 flex justify-between">
        <IconButton icon="back" label="Retour" variant="scrim" @click="goBack('/')" />
        <IconButton icon="vertical-dots" label="Plus d'options" variant="scrim" @click="menuOpen = true" />
      </div>
    </div>

    <div class="safe-x relative -mt-6 rounded-t-lg bg-bg pt-6">
      <div v-if="recipeCategories.length" class="mb-2 flex flex-wrap gap-2">
        <span
          v-for="c in recipeCategories"
          :key="c.id"
          class="inline-flex items-center gap-1.5 rounded-full bg-accent-surface px-3 py-1 text-[13px] font-medium text-accent-strong dark:text-accent"
        >
          <AppIcon :name="categoryIcon(c.icon)" :size="15" />{{ c.name }}
        </span>
      </div>

      <h1 class="mb-4 text-[28px] leading-tight font-bold">
        {{ recipe.name }}
      </h1>

      <dl class="mb-6 grid grid-cols-3 gap-2 text-center">
        <div class="rounded-md bg-surface-alt px-2 py-3">
          <dt class="text-[13px] text-ink-2">
            Préparation
          </dt>
          <dd class="font-bold">
            {{ formatDuration(recipe.prepTime) ?? '—' }}
          </dd>
        </div>
        <div class="rounded-md bg-surface-alt px-2 py-3">
          <dt class="text-[13px] text-ink-2">
            Cuisson
          </dt>
          <dd class="font-bold">
            {{ formatDuration(recipe.cookTime) ?? '—' }}
          </dd>
        </div>
        <div class="rounded-md bg-surface-alt px-2 py-3">
          <dt class="text-[13px] text-ink-2">
            Difficulté
          </dt>
          <dd class="font-bold">
            {{ difficultyLabel(recipe.difficulty) ?? '—' }}
          </dd>
        </div>
      </dl>

      <section v-if="recipe.ingredients.length" class="mb-8">
        <div class="mb-2 flex flex-wrap items-center justify-between gap-3">
          <h2 class="text-xl font-bold">
            Ingrédients
          </h2>
          <ServingsStepper v-model="servings" />
        </div>
        <IngredientList :ingredients="recipe.ingredients" :base-servings="recipe.servings" :servings="servings" />
      </section>

      <section v-if="recipe.steps.length" class="mb-8">
        <h2 class="mb-3 text-xl font-bold">
          Préparation
        </h2>
        <ol class="space-y-4">
          <li v-for="(step, i) in recipe.steps" :key="i" class="flex gap-4">
            <span class="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary">{{ i + 1 }}</span>
            <p class="pt-1 whitespace-pre-line">
              {{ nbsp(step) }}
            </p>
          </li>
        </ol>
      </section>
    </div>

    <!-- Actions -->
    <div
      class="safe-x fixed inset-x-0 bottom-0 z-20 border-t border-line bg-bg/95 pt-3 backdrop-blur-lg"
      style="padding-bottom: max(env(safe-area-inset-bottom), 12px)"
    >
      <div class="mx-auto flex max-w-2xl gap-3">
        <AppButton variant="secondary" icon="add-shopping-cart" class="flex-1" :loading="adding" @click="addToSelection">
          {{ inSelection ? 'Mettre à jour' : 'Sélection' }}
        </AppButton>
        <AppButton v-if="recipe.steps.length" icon="knife" class="flex-1" :to="`/recipes/${id}/cook?servings=${servings}`">
          Cuisiner
        </AppButton>
      </div>
    </div>

    <BottomSheet v-model="menuOpen" title="Options">
      <div class="flex flex-col gap-2">
        <NuxtLink :to="`/recipes/${id}/edit`" class="flex min-h-14 items-center gap-3 rounded-md px-3 font-medium active:bg-surface-alt">
          <AppIcon name="edit" :size="24" class="text-primary" /> Modifier la recette
        </NuxtLink>
        <button type="button" class="flex min-h-14 items-center gap-3 rounded-md px-3 font-medium text-danger active:bg-surface-alt" @click="remove">
          <AppIcon name="trash" :size="24" /> Supprimer la recette
        </button>
      </div>
    </BottomSheet>
  </div>
</template>
