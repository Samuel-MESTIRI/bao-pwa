<script setup lang="ts">
const { state, answer } = useConfirm()
const open = computed({
  get: () => !!state.value,
  set: (value) => { if (!value) answer(false) },
})
</script>

<template>
  <BottomSheet v-model="open" :title="state?.title">
    <p v-if="state?.message" class="mb-6 text-ink-2">
      {{ state.message }}
    </p>
    <div class="flex flex-col gap-3">
      <AppButton :variant="state?.danger ? 'danger' : 'primary'" @click="answer(true)">
        {{ state?.confirmLabel ?? 'Confirmer' }}
      </AppButton>
      <AppButton variant="ghost" @click="answer(false)">
        Annuler
      </AppButton>
    </div>
  </BottomSheet>
</template>
