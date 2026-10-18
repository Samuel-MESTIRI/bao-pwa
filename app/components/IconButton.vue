<script setup lang="ts">
withDefaults(defineProps<{
  icon: string
  label: string
  variant?: 'plain' | 'soft' | 'solid' | 'scrim'
  size?: number
  to?: string
}>(), { variant: 'plain', size: 24 })
</script>

<template>
  <component
    :is="to ? resolveComponent('NuxtLink') : 'button'"
    :to="to"
    :type="to ? undefined : 'button'"
    :aria-label="label"
    :title="label"
    class="inline-flex size-12 shrink-0 items-center justify-center rounded-full transition active:scale-90"
    :class="{
      'text-ink-2': variant === 'plain',
      'bg-surface-alt text-ink': variant === 'soft',
      'bg-primary text-on-primary': variant === 'solid',
      'bg-scrim text-white backdrop-blur-sm': variant === 'scrim',
    }"
  >
    <AppIcon :name="icon" :size="size" />
  </component>
</template>
