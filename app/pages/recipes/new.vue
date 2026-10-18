<script setup lang="ts">
import type { RecipeInput } from '#shared/utils/schemas'
import type { RecipeFormValue } from '~/components/RecipeForm.vue'

definePageMeta({ layout: 'bare' })
useHead({ title: 'Nouvelle recette · BAO' })

const route = useRoute()
const toast = useToast()
const saving = ref(false)

// Recette importée depuis un site : le formulaire est recréé avec ces valeurs
const imported = ref<RecipeFormValue>()
const formKey = ref(0)

function onImported(recipe: RecipeFormValue) {
  imported.value = recipe
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
    <ImportFromUrl :initial-url="typeof route.query.url === 'string' ? route.query.url : undefined" @imported="onImported" />
    <RecipeForm :key="formKey" :initial="imported" submit-label="Enregistrer la recette" :saving="saving" @submit="create" />
  </div>
</template>
