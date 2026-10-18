<script setup lang="ts">
useHead({ title: 'Sélection · BAO' })

const toast = useToast()
const { confirm } = useConfirm()
const selectionCount = useSelectionCount()

const { data: selection, refresh } = await useFetch('/api/selection', { key: 'selection', ...swr })
revalidate(refresh)

watch(selection, value => (selectionCount.count.value = value?.length ?? null), { immediate: true })

const editing = ref<{ id: number, recipeId: number, name: string, servings: number } | null>(null)
const generating = ref(false)

async function remove(item: { id: number, name: string }) {
  selection.value = selection.value?.filter(s => s.id !== item.id) ?? []
  try {
    await $fetch(`/api/selection/${item.id}`, { method: 'DELETE' })
    toast.show(`${item.name} retirée`)
  }
  catch (e) {
    toast.error(errorMessage(e))
    await refresh()
  }
}

async function clearAll() {
  const ok = await confirm({ title: 'Vider la sélection ?', message: 'Toutes les recettes seront retirées de ta sélection.', confirmLabel: 'Vider', danger: true })
  if (!ok) return
  await $fetch('/api/selection', { method: 'DELETE' })
  await refresh()
}

async function saveServings() {
  if (!editing.value) return
  const { recipeId, servings } = editing.value
  editing.value = null
  await $fetch('/api/selection', { method: 'POST', body: { recipeId, servings } })
  await refresh()
}

async function generate() {
  generating.value = true
  try {
    const { count } = await $fetch('/api/shopping/generate', { method: 'POST' })
    toast.show(`Liste de courses prête · ${plural(count, 'article')}`)
    await refreshNuxtData('shopping')
    await navigateTo('/courses')
  }
  catch (e) {
    toast.error(errorMessage(e))
  }
  finally {
    generating.value = false
  }
}
</script>

<template>
  <div>
    <PageHeader title="Ma sélection">
      <template v-if="selection?.length" #actions>
        <IconButton icon="trash" label="Vider la sélection" @click="clearAll" />
      </template>
    </PageHeader>

    <template v-if="selection?.length">
      <p class="mb-4 text-ink-2">
        Les recettes que tu prévois de cuisiner. Ajuste les parts, puis crée ta liste de courses.
      </p>
      <ul class="space-y-3">
        <li v-for="item in selection" :key="item.id" class="card flex items-center gap-3 p-2 pr-1">
          <NuxtLink :to="`/recipes/${item.recipeId}`" class="flex min-w-0 flex-1 items-center gap-3">
            <div class="size-18 shrink-0 overflow-hidden rounded-sm bg-placeholder">
              <img v-if="item.image" :src="imageUrl(item.image, 'thumb')!" alt="" class="size-full object-cover" loading="lazy">
              <div v-else class="flex size-full items-center justify-center text-line-strong">
                <AppIcon name="chef-hat" :size="30" />
              </div>
            </div>
            <span class="line-clamp-2 font-bold">{{ item.name }}</span>
          </NuxtLink>
          <button
            type="button"
            class="min-h-11 shrink-0 rounded-full bg-primary-soft px-3.5 font-bold text-primary"
            :aria-label="`${item.servings} personnes, modifier`"
            @click="editing = { ...item }"
          >
            {{ item.servings }} pers.
          </button>
          <IconButton icon="close" :label="`Retirer ${item.name}`" @click="remove(item)" />
        </li>
      </ul>
      <div class="h-20" />

      <div class="fixed inset-x-0 z-20 px-4" style="bottom: calc(5.5rem + env(safe-area-inset-bottom))">
        <div class="mx-auto max-w-2xl">
          <AppButton variant="accent" icon="list" class="shadow-(--shadow-float)" :loading="generating" @click="generate">
            Créer ma liste de courses
          </AppButton>
        </div>
      </div>
    </template>

    <EmptyState
      v-else
      icon="shopping-cart"
      title="Ta sélection est vide"
      text="Ajoute des recettes depuis ton carnet pour préparer ta liste de courses."
    >
      <AppButton to="/" variant="secondary">
        Parcourir mes recettes
      </AppButton>
    </EmptyState>

    <BottomSheet :model-value="!!editing" :title="editing?.name" @update:model-value="editing = null">
      <div v-if="editing" class="flex flex-col items-center gap-6">
        <ServingsStepper v-model="editing.servings" class="scale-125" />
        <AppButton class="mt-2" @click="saveServings">
          Valider
        </AppButton>
      </div>
    </BottomSheet>
  </div>
</template>
