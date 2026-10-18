<script setup lang="ts">
const { isDark, systemDark } = useTheme()

onMounted(() => {
  const query = matchMedia('(prefers-color-scheme: dark)')
  systemDark.value = query.matches
  query.addEventListener('change', e => (systemDark.value = e.matches))
})

useHead({
  htmlAttrs: { 'data-theme': () => (isDark.value ? 'dark' : 'light') },
  script: [{ innerHTML: THEME_BOOT_SCRIPT, tagPosition: 'head' }],
})
</script>

<template>
  <NuxtPwaManifest />
  <NuxtLoadingIndicator color="var(--c-accent)" :height="3" />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
  <AppToast />
  <ConfirmSheet />
</template>
