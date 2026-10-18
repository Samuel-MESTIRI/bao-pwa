<script setup lang="ts">
const props = defineProps<{
  ingredients: { name: string, quantity: number | null, unit: string | null }[]
  baseServings: number
  servings: number
}>()

const lines = computed(() => props.ingredients.map(i => ({
  name: i.name,
  amount: formatAmount(scaleQuantity(i.quantity, props.baseServings, props.servings), i.unit),
})))
</script>

<template>
  <ul class="divide-y divide-line">
    <li v-for="(line, i) in lines" :key="i" class="flex items-baseline gap-4 py-3">
      <span class="w-24 shrink-0 text-right font-bold text-primary tabular-nums">{{ line.amount }}</span>
      <span class="min-w-0 flex-1">{{ line.name }}</span>
    </li>
  </ul>
</template>
