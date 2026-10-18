<script setup lang="ts">
defineProps<{ title: string, subtitle: string }>()
</script>

<template>
  <div class="safe-top safe-x mx-auto flex min-h-full max-w-md flex-col justify-center pb-10">
    <div class="mb-8 flex flex-col items-center text-center">
      <BrandLogo :width="180" class="mb-6 text-primary" />
      <h1 class="text-[28px] font-bold text-primary">
        {{ title }}
      </h1>
      <p class="text-ink-2">
        {{ subtitle }}
      </p>
    </div>
    <slot />
  </div>
</template>
