<script setup lang="ts">
import type { RecipeInput } from '#shared/utils/schemas'

definePageMeta({ layout: 'bare' })
useHead({ title: 'Nouvelle recette · BAO' })

const toast = useToast()
const saving = ref(false)

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
    <RecipeForm submit-label="Enregistrer la recette" :saving="saving" @submit="create" />
  </div>
</template>
