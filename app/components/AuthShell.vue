<script setup lang="ts">
defineProps<{ title: string, subtitle: string }>()
</script>

<template>
  <div class="safe-top safe-x mx-auto flex min-h-dvh max-w-md flex-col justify-center pb-10">
    <div class="mb-8 flex flex-col items-center text-center">
      <img src="/logo-light.webp" alt="BAO" width="140" height="140" class="mb-4 size-36 object-contain dark:hidden">
      <img src="/logo-dark.webp" alt="BAO" width="140" height="140" class="mb-4 hidden size-36 object-contain dark:block">
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
