<script setup lang="ts">
definePageMeta({ layout: 'bare' })

const route = useRoute()
const id = Number(route.params.id)

const { data: recipe, error } = await useFetch(`/api/recipes/${id}`, { key: `recipe-${id}`, ...swr })
if (error.value || !recipe.value) throw createError({ statusCode: 404, statusMessage: 'Recette introuvable', fatal: true })

useHead({ title: () => `En cuisine · ${recipe.value?.name ?? ''}` })

const { supported: wakeLockSupported, active: screenOn } = useWakeLock()

const servings = computed(() => Number(route.query.servings) || recipe.value!.servings)
const steps = computed(() => recipe.value?.steps ?? [])
const index = ref(0)
const isLast = computed(() => index.value >= steps.value.length - 1)
const showIngredients = ref(false)

// Taille du texte des étapes, mémorisée sur l'appareil
const SIZES = [24, 28, 34, 40]
const sizeIndex = ref(1)
onMounted(() => {
  try {
    const saved = Number(localStorage.getItem('bao-cook-size'))
    if (saved >= 0 && saved < SIZES.length) sizeIndex.value = saved
  }
  catch {}
})
function changeSize(delta: number) {
  sizeIndex.value = Math.min(SIZES.length - 1, Math.max(0, sizeIndex.value + delta))
  try {
    localStorage.setItem('bao-cook-size', String(sizeIndex.value))
  }
  catch {}
}

function go(delta: number) {
  const next = index.value + delta
  if (next >= 0 && next < steps.value.length) index.value = next
}

function finish() {
  goBack(`/recipes/${id}`)
}

// Balayage gauche/droite entre les étapes (mains pas toujours propres : pas besoin de viser un bouton)
let startX = 0
let startY = 0
function onTouchStart(e: TouchEvent) {
  startX = e.touches[0]!.clientX
  startY = e.touches[0]!.clientY
}
function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0]!.clientX - startX
  const dy = e.changedTouches[0]!.clientY - startY
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1)
}

function onKey(e: KeyboardEvent) {
  if (e.key === 'ArrowRight') go(1)
  if (e.key === 'ArrowLeft') go(-1)
}
onMounted(() => addEventListener('keydown', onKey))
onBeforeUnmount(() => removeEventListener('keydown', onKey))
</script>

<template>
  <div v-if="recipe" class="safe-x flex h-dvh flex-col bg-bg" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
    <!-- En-tête -->
    <header class="safe-top flex items-center gap-2">
      <IconButton icon="close" label="Quitter le mode cuisine" variant="soft" @click="finish" />
      <div class="min-w-0 flex-1 text-center">
        <p class="truncate font-bold">
          {{ recipe.name }}
        </p>
        <p class="text-[14px] text-ink-2">
          Étape {{ index + 1 }} sur {{ steps.length }}
        </p>
      </div>
      <IconButton icon="list" label="Voir les ingrédients" variant="soft" @click="showIngredients = true" />
    </header>

    <!-- Progression -->
    <div class="mt-3 flex gap-1" aria-hidden="true">
      <span
        v-for="(_, i) in steps"
        :key="i"
        class="h-1.5 flex-1 rounded-full transition-colors"
        :class="i <= index ? 'bg-primary' : 'bg-surface-muted'"
      />
    </div>

    <!-- Étape -->
    <main class="flex min-h-0 flex-1 flex-col overflow-y-auto py-6">
      <span class="mb-4 flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-2xl font-bold text-on-primary">
        {{ index + 1 }}
      </span>
      <Transition mode="out-in" enter-from-class="opacity-0 translate-x-4" leave-to-class="opacity-0 -translate-x-4" enter-active-class="transition duration-150" leave-active-class="transition duration-100">
        <p
          :key="index"
          class="leading-snug font-medium whitespace-pre-line"
          :style="{ fontSize: `${SIZES[sizeIndex]}px` }"
          aria-live="polite"
        >
          {{ nbsp(steps[index] ?? "") }}
        </p>
      </Transition>
    </main>

    <!-- Réglages et navigation -->
    <div class="flex items-center justify-between pb-3 text-[14px] text-ink-2">
      <span v-if="wakeLockSupported" class="flex items-center gap-1.5">
        <span class="size-2 rounded-full" :class="screenOn ? 'bg-primary-light' : 'bg-line-strong'" />
        {{ screenOn ? 'Écran maintenu allumé' : 'Mise en veille possible' }}
      </span>
      <span v-else />
      <div class="flex items-center gap-1">
        <button type="button" class="flex size-11 items-center justify-center rounded-full bg-surface-alt text-[15px] font-bold disabled:opacity-40" :disabled="sizeIndex === 0" aria-label="Réduire le texte" @click="changeSize(-1)">
          A−
        </button>
        <button type="button" class="flex size-11 items-center justify-center rounded-full bg-surface-alt text-[19px] font-bold disabled:opacity-40" :disabled="sizeIndex === SIZES.length - 1" aria-label="Agrandir le texte" @click="changeSize(1)">
          A+
        </button>
      </div>
    </div>

    <nav class="grid grid-cols-[auto_1fr] gap-3" style="padding-bottom: max(env(safe-area-inset-bottom), 16px)">
      <button
        type="button"
        class="flex min-h-18 min-w-18 items-center justify-center rounded-full bg-surface-alt text-primary transition active:scale-95 disabled:opacity-30"
        :disabled="index === 0"
        aria-label="Étape précédente"
        @click="go(-1)"
      >
        <AppIcon name="back" :size="30" />
      </button>
      <button
        v-if="!isLast"
        type="button"
        class="flex min-h-18 items-center justify-center gap-2 rounded-full bg-primary text-xl font-bold text-on-primary transition active:scale-[0.97]"
        @click="go(1)"
      >
        Étape suivante
        <AppIcon name="back" :size="28" class="rotate-180" />
      </button>
      <button
        v-else
        type="button"
        class="flex min-h-18 items-center justify-center gap-2 rounded-full bg-accent text-xl font-bold text-on-accent transition active:scale-[0.97]"
        @click="finish"
      >
        <AppIcon name="check" :size="28" />
        C'est prêt !
      </button>
    </nav>

    <BottomSheet v-model="showIngredients" :title="`Ingrédients · ${servings} pers.`">
      <IngredientList :ingredients="recipe.ingredients" :base-servings="recipe.servings" :servings="servings" class="text-[19px]" />
    </BottomSheet>
  </div>
</template>
