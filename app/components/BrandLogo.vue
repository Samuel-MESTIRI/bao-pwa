<script setup lang="ts">
// Logo « BAO » (fruit dans le O). L'image sert de masque : la couleur suit
// le texte courant (text-primary…), donc le logo s'adapte au thème.
withDefaults(defineProps<{ width?: number }>(), { width: 160 })
</script>

<template>
  <span
    role="img"
    aria-label="BAO"
    class="inline-block bg-current"
    :style="{
      width: `${width}px`,
      aspectRatio: '480 / 217',
      maskImage: 'url(/logo-mask.png)',
      WebkitMaskImage: 'url(/logo-mask.png)',
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
    }"
  />
</template>
