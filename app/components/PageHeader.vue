<script setup lang="ts">
defineProps<{ title: string, back?: string | boolean }>()
</script>

<template>
  <header class="mb-5 flex min-h-12 items-center gap-2">
    <IconButton
      v-if="back"
      icon="back"
      label="Retour"
      class="-ml-3 text-primary!"
      @click="goBack(typeof back === 'string' ? back : '/')"
    />
    <h1 class="min-w-0 flex-1 truncate text-[26px] leading-tight font-bold">
      {{ title }}
    </h1>
    <slot name="actions" />
  </header>
</template>
