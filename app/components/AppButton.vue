<script setup lang="ts">
import { NuxtLink } from '#components'

withDefaults(defineProps<{
  variant?: 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger'
  type?: 'button' | 'submit'
  loading?: boolean
  disabled?: boolean
  icon?: string
  to?: string
}>(), { variant: 'primary', type: 'button' })
</script>

<template>
  <component
    :is="to ? NuxtLink : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="disabled || loading"
    class="inline-flex min-h-14 w-full items-center justify-center gap-2 rounded-full px-6 text-[17px] font-bold transition active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
    :class="{
      'bg-primary text-on-primary': variant === 'primary',
      'bg-accent text-on-accent': variant === 'accent',
      'bg-primary-soft text-primary': variant === 'secondary',
      'text-ink-2': variant === 'ghost',
      'bg-danger-solid text-white': variant === 'danger',
    }"
  >
    <span v-if="loading" class="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
    <AppIcon v-else-if="icon" :name="icon" :size="22" />
    <slot />
  </component>
</template>
