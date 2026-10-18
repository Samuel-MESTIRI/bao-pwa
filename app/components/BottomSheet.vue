<script setup lang="ts">
const open = defineModel<boolean>({ default: false })
defineProps<{ title?: string }>()

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') open.value = false
}
watch(open, (value) => {
  if (!import.meta.client) return
  document.documentElement.style.overflow = value ? 'hidden' : ''
  if (value) addEventListener('keydown', onKey)
  else removeEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  document.documentElement.style.overflow = ''
  removeEventListener('keydown', onKey)
})
</script>

<template>
  <Teleport to="body">
    <Transition enter-from-class="opacity-0" leave-to-class="opacity-0" enter-active-class="transition-opacity duration-200" leave-active-class="transition-opacity duration-200">
      <div v-if="open" class="fixed inset-0 z-40 bg-black/40" @click="open = false" />
    </Transition>
    <Transition enter-from-class="translate-y-full" leave-to-class="translate-y-full" enter-active-class="transition-transform duration-250 ease-out" leave-active-class="transition-transform duration-200 ease-in">
      <div
        v-if="open"
        class="fixed inset-x-0 bottom-0 z-40 mx-auto max-h-[85dvh] max-w-2xl overflow-y-auto rounded-t-lg bg-bg px-5 pt-3 shadow-(--shadow-float)"
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
