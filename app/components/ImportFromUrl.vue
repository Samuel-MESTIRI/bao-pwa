<script setup lang="ts">
import type { RecipeFormValue } from './RecipeForm.vue'

const props = defineProps<{ initialUrl?: string }>()
const emit = defineEmits<{ imported: [recipe: RecipeFormValue & { source: string }] }>()

const toast = useToast()
const url = ref(props.initialUrl ?? '')
const loading = ref(false)
const error = ref('')
const done = ref<string | null>(null) // site d'où vient la dernière recette importée

// Connu seulement dans le navigateur : calculé après le chargement pour un rendu serveur identique
const canPaste = ref(false)

async function paste() {
  try {
    const text = (await navigator.clipboard.readText()).trim()
    const found = text.match(/https?:\/\/\S+/)?.[0]
    if (found) {
      url.value = found
      await run()
    }
    else {
      toast.show('Aucun lien dans le presse-papiers', 'info')
    }
  }
  catch {
    // Accès au presse-papiers refusé : l'utilisateur peut coller à la main
  }
}

async function run() {
  const value = url.value.trim()
  if (!value || loading.value) return
  error.value = ''
  loading.value = true
  try {
    const recipe = await $fetch('/api/import/url', { method: 'POST', body: { url: value } })
    done.value = new URL(recipe.source).hostname.replace(/^www\./, '')
    emit('imported', recipe as RecipeFormValue & { source: string })
    toast.show('Recette importée : vérifie puis enregistre')
  }
  catch (e) {
    error.value = errorMessage(e, 'Import impossible')
  }
  finally {
    loading.value = false
  }
}

onMounted(() => {
  canPaste.value = !!navigator.clipboard?.readText
  if (props.initialUrl) run()
})
</script>

<template>
  <section class="mb-7 rounded-lg bg-primary-soft p-4">
    <div class="mb-3 flex items-center gap-2 font-bold text-primary">
      <AppIcon name="search" :size="22" />
      Importer depuis un site
    </div>
    <p v-if="done" class="mb-3 text-[15px] text-ink-2">
      Importée depuis <strong class="text-ink">{{ done }}</strong>. Vérifie la fiche ci-dessous, puis enregistre.
    </p>
    <p v-else class="mb-3 text-[15px] text-ink-2">
      Colle le lien d'une recette (Marmiton, Journal des Femmes, 750g…) : la fiche se remplit toute seule.
    </p>

    <form class="flex gap-2" @submit.prevent="run">
      <label class="sr-only" for="import-url">Lien de la recette</label>
      <input
        id="import-url"
        v-model="url"
        class="field min-w-0 bg-surface! rounded-full!"
        type="url"
        inputmode="url"
        placeholder="https://www.marmiton.org/…"
        autocomplete="off"
        autocapitalize="none"
        enterkeyhint="go"
      >
      <button
        v-if="canPaste && !url"
        type="button"
        class="min-h-13 shrink-0 rounded-full bg-surface px-4 font-bold text-primary transition active:scale-95"
        @click="paste"
      >
        Coller
      </button>
      <button
        v-else
        type="submit"
        class="flex size-13 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition active:scale-90 disabled:opacity-50"
        :disabled="!url.trim() || loading"
        aria-label="Importer la recette"
      >
        <span v-if="loading" class="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
        <AppIcon v-else name="check" :size="24" />
      </button>
    </form>

    <p v-if="loading" class="mt-3 text-[15px] text-ink-2">
      Lecture de la recette…
    </p>
    <p v-if="error" class="mt-3 rounded-md bg-danger-surface px-4 py-3 text-[15px] font-medium text-danger" role="alert">
      {{ error }}
    </p>
  </section>
</template>
