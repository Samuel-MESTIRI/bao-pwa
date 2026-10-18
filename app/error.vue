<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()
const notFound = computed(() => props.error.statusCode === 404)
useHead({ title: notFound.value ? 'Introuvable · BAO' : 'Oups · BAO' })
</script>

<template>
  <div class="safe-top safe-x mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center text-center">
    <BrandLogo :width="140" class="mb-8 text-primary" />
    <h1 class="mb-2 text-2xl font-bold">
      {{ notFound ? 'Page introuvable' : 'Oups, quelque chose a raté' }}
    </h1>
    <p class="mb-8 text-ink-2">
      {{ notFound ? (error.statusMessage || 'Cette page n\'existe pas ou plus.') : 'Réessaie dans un instant.' }}
    </p>
    <AppButton class="max-w-xs" @click="clearError({ redirect: '/' })">
      Retour à mes recettes
    </AppButton>
  </div>
</template>
