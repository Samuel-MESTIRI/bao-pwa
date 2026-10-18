<script setup lang="ts">
defineProps<{ icon: string, title: string, text?: string }>()
</script>

<template>
  <div class="flex flex-col items-center px-6 py-14 text-center">
    <div class="mb-5 flex size-20 items-center justify-center rounded-full bg-primary-soft text-primary">
      <AppIcon :name="icon" :size="38" />
    </div>
    <h2 class="mb-1 text-xl font-bold">
      {{ title }}
    </h2>
    <p v-if="text" class="mb-6 max-w-xs text-ink-2">
      {{ text }}
    </p>
    <div class="w-full max-w-xs">
      <slot />
    </div>
  </div>
</template>
