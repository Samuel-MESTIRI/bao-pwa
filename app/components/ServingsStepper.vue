<script setup lang="ts">
const value = defineModel<number>({ required: true })
</script>

<template>
  <div class="inline-flex items-center gap-1 rounded-full bg-surface-alt p-1">
    <button
      type="button"
      class="flex size-11 items-center justify-center rounded-full bg-surface text-2xl font-bold text-primary shadow-(--shadow-card) transition active:scale-90 disabled:opacity-30"
      :disabled="value <= 1"
      aria-label="Retirer une personne"
      @click="value = Math.max(1, value - 1)"
    >
      −
    </button>
    <span class="min-w-20 text-center font-bold tabular-nums" aria-live="polite">
      {{ value }} pers.
    </span>
    <button
      type="button"
      class="flex size-11 items-center justify-center rounded-full bg-surface text-2xl font-bold text-primary shadow-(--shadow-card) transition active:scale-90 disabled:opacity-30"
      :disabled="value >= MAX_SERVINGS"
      aria-label="Ajouter une personne"
      @click="value = Math.min(MAX_SERVINGS, value + 1)"
    >
      +
    </button>
  </div>
</template>
