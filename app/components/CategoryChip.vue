<script setup lang="ts">
defineProps<{ label: string, icon?: string | null, active?: boolean }>()
</script>

<template>
  <button
    type="button"
    class="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-[15px] font-medium whitespace-nowrap transition active:scale-95"
    :class="active ? 'border-primary bg-primary text-on-primary' : 'border-line bg-surface text-ink'"
    :aria-pressed="active"
  >
    <AppIcon :name="categoryIcon(icon)" :size="18" />
    {{ label }}
  </button>
</template>
