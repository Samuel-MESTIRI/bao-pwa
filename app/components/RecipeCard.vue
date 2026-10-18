<script setup lang="ts">
const props = defineProps<{
  recipe: { id: number, name: string, image: string | null, prepTime: number | null, cookTime: number | null, difficulty: number | null }
  selected: boolean
}>()
defineEmits<{ select: [] }>()

const time = computed(() => formatDuration(totalTime(props.recipe)))
const difficulty = computed(() => difficultyLabel(props.recipe.difficulty))
</script>

<template>
  <article class="card relative overflow-hidden">
    <NuxtLink :to="`/recipes/${recipe.id}`" class="block" :aria-label="recipe.name">
      <div class="relative aspect-[4/3] bg-placeholder">
        <img
          v-if="recipe.image"
          :src="imageUrl(recipe.image, 'thumb')!"
          :alt="''"
          class="size-full object-cover"
          loading="lazy"
          decoding="async"
          width="480"
          height="360"
        >
        <div v-else class="flex size-full items-center justify-center text-line-strong">
          <AppIcon name="chef-hat" :size="56" />
        </div>
        <div class="absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-black/55 to-transparent" />
        <div v-if="time || difficulty" class="absolute bottom-2.5 left-3 flex items-center gap-2 text-[13px] font-medium text-white">
          <span v-if="time" class="flex items-center gap-1"><AppIcon name="timer" :size="15" />{{ time }}</span>
          <span v-if="time && difficulty" aria-hidden="true">·</span>
          <span v-if="difficulty">{{ difficulty }}</span>
        </div>
      </div>
      <!-- Le padding est sur le parent : avec line-clamp, il laisserait voir le début de la 3e ligne -->
      <div class="px-3 pt-2.5 pb-3">
        <h3 class="line-clamp-2 min-h-[2.75em] text-[16px] leading-[1.375] font-bold">
          {{ recipe.name }}
        </h3>
      </div>
    </NuxtLink>
    <button
      type="button"
      class="absolute top-2 right-2 flex size-12 items-center justify-center rounded-full shadow-(--shadow-float) transition active:scale-90"
      :class="selected ? 'bg-primary text-on-primary' : 'bg-surface/90 text-primary backdrop-blur-sm'"
      :aria-label="selected ? `${recipe.name} est dans ta sélection` : `Ajouter ${recipe.name} à ta sélection`"
      :aria-pressed="selected"
      @click="$emit('select')"
    >
      <AppIcon :name="selected ? 'check' : 'add-shopping-cart'" :size="22" />
    </button>
  </article>
</template>
