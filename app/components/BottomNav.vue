<script setup lang="ts">
const route = useRoute()
const { count, refresh } = useSelectionCount()
// Badge rendu seulement côté navigateur : son compteur peut changer pendant le rendu serveur
const mounted = ref(false)
onMounted(() => {
  mounted.value = true
  if (count.value === null) refresh()
})

const tabs = [
  { to: '/', label: 'Recettes', icon: 'chef-hat' },
  { to: '/selection', label: 'Sélection', icon: 'shopping-cart' },
  { to: '/courses', label: 'Courses', icon: 'list' },
  { to: '/settings', label: 'Réglages', icon: 'setting' },
]

const isActive = (to: string) => (to === '/' ? route.path === '/' || route.path.startsWith('/recipes') : route.path.startsWith(to))
</script>

<template>
  <nav
    class="fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/90 backdrop-blur-lg"
    style="padding-bottom: env(safe-area-inset-bottom)"
    aria-label="Navigation principale"
  >
    <ul class="mx-auto flex max-w-2xl">
      <li v-for="tab in tabs" :key="tab.to" class="flex-1">
        <NuxtLink
          :to="tab.to"
          class="relative flex min-h-16 flex-col items-center justify-center gap-0.5 text-[12px] font-medium transition-colors"
          :class="isActive(tab.to) ? 'text-primary' : 'text-muted'"
          :aria-current="isActive(tab.to) ? 'page' : undefined"
        >
          <span class="relative">
            <AppIcon :name="tab.icon" :size="26" />
            <span
              v-if="mounted && tab.to === '/selection' && count"
              class="absolute -top-1.5 -right-3 min-w-5 rounded-full bg-accent px-1.5 text-center text-[11px] leading-5 font-bold text-on-accent"
            >{{ count > 99 ? '99+' : count }}</span>
          </span>
          {{ tab.label }}
        </NuxtLink>
      </li>
    </ul>
  </nav>
</template>
