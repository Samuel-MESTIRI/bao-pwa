<script setup lang="ts">
const { toasts } = useToast()
</script>

<template>
  <div
    class="pointer-events-none fixed inset-x-0 z-50 flex flex-col items-center gap-2 px-4"
    style="top: max(env(safe-area-inset-top), 12px)"
    aria-live="polite"
  >
    <TransitionGroup
      enter-from-class="opacity-0 -translate-y-3"
      leave-to-class="opacity-0 -translate-y-3"
      enter-active-class="transition duration-200"
      leave-active-class="transition duration-200"
    >
      <div
        v-for="t in toasts"
        :key="t.id"
        class="flex max-w-md items-center gap-2 rounded-full px-5 py-3 text-[15px] font-medium shadow-(--shadow-float)"
        :class="{
          'bg-primary text-on-primary': t.variant === 'success',
          'bg-surface text-ink border border-line': t.variant === 'info',
          'bg-danger-solid text-white': t.variant === 'error',
        }"
        role="status"
      >
        <AppIcon v-if="t.variant === 'success'" name="check" :size="18" />
        {{ t.message }}
      </div>
    </TransitionGroup>
  </div>
</template>
