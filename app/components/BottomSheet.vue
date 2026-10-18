<script setup lang="ts">
const open = defineModel<boolean>({ default: false })
// `stacked` : feuille qui s'ouvre par-dessus une autre (confirmation)
const props = defineProps<{ title?: string, stacked?: boolean }>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}

// Plusieurs feuilles peuvent être ouvertes en même temps : le défilement de la
// page n'est rétabli que quand la dernière se ferme.
let locked = false
function lock(value: boolean) {
  if (!import.meta.client || value === locked) return
  locked = value
  openSheets += value ? 1 : -1
  // C'est .app-scroller qui défile, pas le document (voir main.css)
  document.querySelectorAll<HTMLElement>('.app-scroller').forEach((el) => {
    el.style.overflow = openSheets > 0 ? 'hidden' : ''
  })
  if (value) addEventListener('keydown', onKey)
  else removeEventListener('keydown', onKey)
}

watch(open, lock)
const mounted = ref(false)
onMounted(() => (mounted.value = true))
onBeforeUnmount(() => lock(false))

const z = computed(() => (props.stacked ? 'z-[45]' : 'z-40'))
</script>

<script lang="ts">
let openSheets = 0
</script>

<template>
  <!-- Créé après le chargement : un Teleport vers autre chose que body ne se réhydrate pas -->
  <Teleport v-if="mounted" to="#app-overlays" defer>
    <Transition enter-from-class="opacity-0" leave-to-class="opacity-0" enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-200">
      <div v-if="open" class="fixed inset-0 bg-black/40" :class="z" @click="open = false" />
    </Transition>
    <Transition enter-from-class="translate-y-full" leave-to-class="translate-y-full" enter-active-class="transition-transform duration-250 ease-out" leave-active-class="transition-transform duration-200 ease-in">
      <div
        v-if="open"
        class="fixed inset-x-0 bottom-0 mx-auto max-h-[85dvh] max-w-2xl overflow-y-auto rounded-t-lg bg-bg px-5 pt-3 shadow-(--shadow-float)"
        :class="z"
        style="padding-bottom: max(env(safe-area-inset-bottom), 20px)"
        role="dialog"
        aria-modal="true"
        :aria-label="title"
      >
        <div class="mx-auto mb-4 h-1.5 w-10 rounded-full bg-line-strong" />
        <h2 v-if="title" class="mb-4 text-xl font-bold">
          {{ title }}
        </h2>
        <slot />
      </div>
    </Transition>
  </Teleport>
</template>
