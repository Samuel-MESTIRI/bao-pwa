<script setup lang="ts">
import type { RecipeInput } from '#shared/utils/schemas'
import type { RecipeFormValue } from '~/components/RecipeForm.vue'

definePageMeta({ layout: 'bare' })
useHead({ title: 'Nouvelle recette · BAO' })

const route = useRoute()
const toast = useToast()
const saving = ref(false)

// Recette importée depuis un site : le formulaire est recréé avec ces valeurs
const importOpen = ref(false)
const imported = ref<RecipeFormValue>()
const importedFrom = ref<string | null>(null)
const formKey = ref(0)
const initialUrl = typeof route.query.url === 'string' ? route.query.url : undefined

function onImported(recipe: RecipeFormValue & { source: string }) {
  imported.value = recipe
  importedFrom.value = new URL(recipe.source).hostname.replace(/^www\./, '')
  formKey.value++
}

async function create(input: RecipeInput) {
  saving.value = true
  try {
    const recipe = await $fetch('/api/recipes', { method: 'POST', body: input })
    toast.show('Recette ajoutée')
    await refreshNuxtData('recipes')
    await navigateTo(`/recipes/${recipe!.id}`, { replace: true })
  }
  catch (e) {
    toast.error(errorMessage(e))
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="safe-top safe-x mx-auto max-w-2xl">
    <PageHeader title="Nouvelle recette" back="/" />

    <button
      type="button"
      class="-mt-2 mb-5 inline-flex min-h-11 items-center gap-2 rounded-full bg-primary-soft px-4 text-[15px] font-bold text-primary transition active:scale-95"
      @click="importOpen = true"
    >
      <AppIcon name="download" :size="20" />
      Importer depuis un lien
    </button>

    <p v-if="importedFrom" class="mb-5 flex items-center gap-2 rounded-md bg-primary-soft px-4 py-3 text-[15px] text-ink-2">
      <AppIcon name="check" :size="20" class="shrink-0 text-primary" />
      <span>Importée depuis <strong class="text-ink">{{ importedFrom }}</strong> : vérifie la fiche, puis enregistre.</span>
    </p>

    <RecipeForm :key="formKey" :initial="imported" submit-label="Enregistrer la recette" :saving="saving" @submit="create" />
    <ImportFromUrl v-model="importOpen" :initial-url="initialUrl" @imported="onImported" />
  </div>
</template>
