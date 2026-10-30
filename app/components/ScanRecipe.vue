<script setup lang="ts">
import type { RecipeFormValue } from './RecipeForm.vue'

// Scan magique : photo d'une page de recette → formulaire pré-rempli.
// La photo part au serveur qui la fait lire par l'IA, puis l'oublie.
const emit = defineEmits<{ imported: [recipe: RecipeFormValue & { source: string }] }>()

const toast = useToast()
const fileInput = ref<HTMLInputElement>()
const scanning = ref(false)
const error = ref('')
let controller: AbortController | null = null

// Le bouton n'apparaît que si le scan est configuré sur le serveur
const { data: status, refresh: refreshStatus } = await useFetch('/api/import/photo-status', { key: 'photo-status' })

// Messages qui défilent pendant l'analyse (quelques secondes)
const STEPS = ['Lecture de la page…', 'Repérage des ingrédients…', 'Mise en forme des étapes…', 'Encore un instant…']
const step = ref(0)
let timer: ReturnType<typeof setInterval> | undefined

function open() {
  error.value = ''
  if (status.value && status.value.remaining <= 0) {
    toast.show('Plus de scan disponible aujourd\'hui, réessaie demain', 'info')
    return
  }
  fileInput.value?.click()
}

async function onPhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (fileInput.value) fileInput.value.value = ''
  if (!file) return

  scanning.value = true
  step.value = 0
  timer = setInterval(() => (step.value = Math.min(step.value + 1, STEPS.length - 1)), 2500)
  controller = new AbortController()
  try {
    const body = new FormData()
    body.append('image', await resizeImage(file, 1600, 0.85), 'page.jpg')
    const recipe = await $fetch('/api/import/photo', { method: 'POST', body, signal: controller.signal })
    emit('imported', recipe as RecipeFormValue & { source: string })
    await refreshStatus()
    const left = status.value?.remaining
    toast.show(left != null ? `Recette scannée · ${plural(left, 'scan')} restant${left > 1 ? 's' : ''} aujourd'hui` : 'Recette scannée')
  }
  catch (e) {
    if (controller?.signal.aborted) return
    error.value = errorMessage(e, 'Le scan a échoué')
    refreshStatus()
  }
  finally {
    scanning.value = false
    clearInterval(timer)
    controller = null
  }
}

function cancel() {
  controller?.abort()
  scanning.value = false
}

onBeforeUnmount(() => {
  clearInterval(timer)
  controller?.abort()
})
</script>

<template>
  <!-- « contents » : le bouton et le message d'erreur se placent dans la rangée du parent -->
  <div v-if="status?.enabled" class="contents">
    <!-- Sans attribut capture : iOS propose « Prendre une photo » ou « Photothèque » -->
    <input ref="fileInput" type="file" accept="image/*" class="sr-only" tabindex="-1" @change="onPhoto">
    <button
      type="button"
      class="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-accent px-3.5 text-[15px] font-bold text-on-accent transition active:scale-95"
      @click="open"
    >
      <AppIcon name="magic" :size="20" />
      Scan magique
    </button>

    <p v-if="error" class="order-last basis-full rounded-md bg-danger-surface px-4 py-3 text-[15px] font-medium text-danger" role="alert">
      {{ error }}
    </p>

    <!-- Écran d'attente pendant l'analyse -->
    <Teleport to="body">
      <Transition enter-from-class="opacity-0" leave-to-class="opacity-0" enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-200">
        <div
          v-if="scanning"
          class="fixed inset-0 z-50 flex flex-col items-center justify-center gap-6 bg-bg/90 px-8 text-center backdrop-blur-md"
          role="status"
          aria-live="polite"
        >
          <div class="scan-orb flex size-24 items-center justify-center rounded-full bg-accent text-on-accent">
            <AppIcon name="magic" :size="44" />
          </div>
          <div>
            <p class="text-xl font-bold">
              Scan magique
            </p>
            <Transition mode="out-in" enter-from-class="opacity-0 translate-y-1" leave-to-class="opacity-0 -translate-y-1" enter-active-class="transition duration-200" leave-active-class="transition duration-150">
              <p :key="step" class="mt-1 text-ink-2">
                {{ STEPS[step] }}
              </p>
            </Transition>
          </div>
          <button type="button" class="min-h-11 px-4 font-medium text-ink-2" @click="cancel">
            Annuler
          </button>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.scan-orb {
  animation: scan-pulse 1.6s ease-in-out infinite;
  box-shadow: 0 0 0 0 color-mix(in srgb, var(--c-accent) 45%, transparent);
}
@keyframes scan-pulse {
  0% { transform: scale(1); box-shadow: 0 0 0 0 color-mix(in srgb, var(--c-accent) 45%, transparent); }
  50% { transform: scale(1.06) rotate(4deg); }
  100% { transform: scale(1); box-shadow: 0 0 0 28px transparent; }
}
</style>
