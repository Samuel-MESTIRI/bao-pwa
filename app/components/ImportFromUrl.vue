<script setup lang="ts">
import type { RecipeFormValue } from './RecipeForm.vue'

// Feuille d'import : on colle le lien d'une recette, la fiche est lue par le
// serveur puis renvoyée à la page pour pré-remplir le formulaire.
const open = defineModel<boolean>({ default: false })
const props = defineProps<{ initialUrl?: string }>()
const emit = defineEmits<{ imported: [recipe: RecipeFormValue & { source: string }] }>()

const toast = useToast()
const url = ref(props.initialUrl ?? '')
const loading = ref(false)
const error = ref('')
const input = ref<HTMLInputElement>()

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
    input.value?.focus()
  }
}

async function run() {
  const value = url.value.trim()
  if (!value || loading.value) return
  error.value = ''
  loading.value = true
  try {
    const recipe = await $fetch('/api/import/url', { method: 'POST', body: { url: value } })
    emit('imported', recipe as RecipeFormValue & { source: string })
    open.value = false
    url.value = ''
    toast.show('Recette importée : vérifie puis enregistre')
  }
  catch (e) {
    error.value = errorMessage(e, 'Import impossible')
  }
  finally {
    loading.value = false
  }
}

watch(open, (value) => {
  if (!value) error.value = ''
})

onMounted(() => {
  canPaste.value = !!navigator.clipboard?.readText
  if (props.initialUrl) {
    open.value = true
    run()
  }
})
</script>

<template>
  <BottomSheet v-model="open" title="Importer une recette">
    <p class="mb-4 text-ink-2">
      Colle le lien d'une recette (Marmiton, Journal des Femmes, 750g…) : la fiche se remplit toute seule, tu n'as plus qu'à vérifier.
    </p>

    <form class="space-y-3" @submit.prevent="run">
      <label class="sr-only" for="import-url">Lien de la recette</label>
      <input
        id="import-url"
        ref="input"
        v-model="url"
        class="field"
        type="url"
        inputmode="url"
        placeholder="https://www.marmiton.org/…"
        autocomplete="off"
        autocapitalize="none"
        enterkeyhint="go"
      >

      <p v-if="error" class="rounded-md bg-danger-surface px-4 py-3 text-[15px] font-medium text-danger" role="alert">
        {{ error }}
      </p>

      <AppButton v-if="canPaste && !url.trim()" icon="list" variant="secondary" :loading="loading" @click="paste">
        Coller le lien
      </AppButton>
      <AppButton v-else type="submit" icon="download" :loading="loading" :disabled="!url.trim()">
        {{ loading ? 'Lecture de la recette…' : 'Importer' }}
      </AppButton>
    </form>
  </BottomSheet>
</template>
