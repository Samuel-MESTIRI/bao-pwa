<script setup lang="ts">
// Icônes SVG de l'app d'origine, injectées en ligne pour hériter de la couleur du texte.
const icons = import.meta.glob('~/assets/icons/*.svg', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const byName = Object.fromEntries(
  Object.entries(icons).map(([path, svg]) => [path.split('/').pop()!.replace('.svg', ''), svg]),
)

const props = withDefaults(defineProps<{ name: string, size?: number | string }>(), { size: 24 })
const svg = computed(() => byName[props.name] ?? byName['category-plat'])
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center [&>svg]:h-full [&>svg]:w-full"
    :style="{ width: `${size}px`, height: `${size}px` }"
    aria-hidden="true"
    v-html="svg"
  />
</template>
