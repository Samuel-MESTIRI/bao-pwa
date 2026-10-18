<script setup lang="ts">
import type { RecipeInput } from '#shared/utils/schemas'

definePageMeta({ layout: 'bare' })

const id = Number(useRoute().params.id)
const toast = useToast()
const saving = ref(false)

// Données fraîches pour l'édition : pas de cache ici
const { data: recipe, error } = await useFetch(`/api/recipes/${id}`)
if (error.value) throw createError({ statusCode: 404, statusMessage: 'Recette introuvable', fatal: true })

useHead({ title: () => `Modifier ${recipe.value?.name ?? ''} · BAO` })

async function save(input: RecipeInput) {
  saving.value = true
  try {
    const updated = await $fetch(`/api/recipes/${id}`, { method: 'PUT', body: input })
    toast.show('Recette mise à jour')
    useNuxtData(`recipe-${id}`).data.value = updated
    await refreshNuxtData('recipes')
    goBack(`/recipes/${id}`)
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
    <PageHeader title="Modifier la recette" :back="`/recipes/${id}`" />
    <RecipeForm v-if="recipe" :initial="recipe" submit-label="Enregistrer" :saving="saving" @submit="save" />
  </div>
</template>
