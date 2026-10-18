<script setup lang="ts">
useHead({ title: 'Mes recettes · BAO' })

const { user } = useUserSession()
const toast = useToast()
const selectionCount = useSelectionCount()

const [{ data: recipes, refresh: refreshRecipes, status }, { data: categories }, { data: selection, refresh: refreshSelection }] = await Promise.all([
  useFetch('/api/recipes', { key: 'recipes', ...swr }),
  useFetch('/api/categories', { key: 'categories', ...swr }),
  useFetch('/api/selection', { key: 'selection', ...swr }),
])
revalidate(refreshRecipes)
revalidate(refreshSelection)

const search = ref('')
const activeCategories = ref<number[]>([])

// Calculé sur le téléphone : l'heure du serveur (UTC, au Canada) ne dit rien de l'heure locale
const greeting = ref('Bonjour')
onMounted(() => {
  const h = new Date().getHours()
  greeting.value = h < 11 ? 'Bon matin' : h < 14 ? 'C\'est l\'heure de manger' : h < 18 ? 'Bon après-midi' : 'Bonsoir'
})

const normalize = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

const filtered = computed(() => {
  const q = normalize(search.value.trim())
  return (recipes.value ?? []).filter(r =>
    (!q || normalize(r.name).includes(q))
    && activeCategories.value.every(id => r.categoryIds.includes(id)),
  )
})

const selectedIds = computed(() => new Set((selection.value ?? []).map(s => s.recipeId)))

function toggleCategory(id: number) {
  activeCategories.value = activeCategories.value.includes(id)
    ? activeCategories.value.filter(c => c !== id)
    : [...activeCategories.value, id]
}

function resetFilters() {
  search.value = ''
  activeCategories.value = []
}

async function addToSelection(recipe: { id: number, name: string, servings: number }) {
  if (selectedIds.value.has(recipe.id)) {
    toast.show(`${recipe.name} est déjà dans ta sélection`, 'info')
    return
  }
  try {
    await $fetch('/api/selection', { method: 'POST', body: { recipeId: recipe.id, servings: recipe.servings } })
    toast.show(`${recipe.name} ajoutée à ta sélection`)
    await refreshSelection()
    selectionCount.count.value = selection.value?.length ?? null
  }
  catch (e) {
    toast.error(errorMessage(e))
  }
}
</script>

<template>
  <div>
    <header class="mb-5 flex items-start justify-between gap-3 pt-2">
      <div class="min-w-0">
        <p class="text-ink-2">
          {{ greeting }}{{ user?.name ? `, ${user.name}` : '' }}
        </p>
        <h1 class="text-[28px] leading-tight font-bold text-primary">
          Mes recettes
        </h1>
      </div>
      <IconButton icon="plus" label="Ajouter une recette" variant="solid" to="/recipes/new" :size="26" />
    </header>

    <label class="relative mb-4 block">
      <span class="sr-only">Rechercher une recette</span>
      <AppIcon name="search" :size="22" class="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-muted" />
      <input v-model="search" type="search" class="field rounded-full! pl-12" placeholder="Rechercher une recette…" enterkeyhint="search">
    </label>

    <div v-if="categories?.length" class="no-scrollbar -mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1">
      <CategoryChip
        v-for="c in categories"
        :key="c.id"
        :label="c.name"
        :icon="c.icon"
        :active="activeCategories.includes(c.id)"
        @click="toggleCategory(c.id)"
      />
    </div>

    <div v-if="filtered.length" class="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <RecipeCard
        v-for="r in filtered"
        :key="r.id"
        :recipe="r"
        :selected="selectedIds.has(r.id)"
        @select="addToSelection(r)"
      />
    </div>

    <EmptyState
      v-else-if="recipes?.length"
      icon="search"
      title="Rien ne correspond"
      text="Essaie un autre mot ou retire un filtre."
    >
      <AppButton variant="secondary" @click="resetFilters">
        Tout afficher
      </AppButton>
    </EmptyState>

    <EmptyState
      v-else-if="status !== 'pending'"
      icon="chef-hat"
      title="Ton carnet est encore vide"
      text="Ajoute ta première recette pour commencer."
    >
      <AppButton to="/recipes/new" icon="plus">
        Ajouter une recette
      </AppButton>
    </EmptyState>
  </div>
</template>
