<script setup lang="ts">
definePageMeta({ layout: 'bare' })
useHead({ title: 'Connexion · BAO' })

const { fetch: refreshSession } = useUserSession()
const { mode } = useTheme()

const form = reactive({ email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  loading.value = true
  try {
    const user = await $fetch('/api/auth/login', { method: 'POST', body: form })
    mode.value = user.theme as ThemeMode
    await refreshSession()
    await navigateTo('/', { replace: true })
  }
  catch (e) {
    error.value = errorMessage(e, 'Connexion impossible')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell title="Bon retour !" subtitle="Connecte-toi pour retrouver tes recettes.">
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label for="email" class="label">E-mail</label>
        <input id="email" v-model="form.email" class="field" type="email" autocomplete="email" autocapitalize="none" inputmode="email" required>
      </div>
      <div>
        <label for="password" class="label">Mot de passe</label>
        <input id="password" v-model="form.password" class="field" type="password" autocomplete="current-password" required>
      </div>
      <p v-if="error" class="rounded-md bg-danger-surface px-4 py-3 text-[15px] font-medium text-danger" role="alert">
        {{ error }}
      </p>
      <AppButton type="submit" :loading="loading" class="mt-2">
        Se connecter
      </AppButton>
    </form>
    <p class="mt-6 text-center text-ink-2">
      Pas encore de compte ?
      <NuxtLink to="/register" class="inline-block min-h-11 py-2 font-bold text-primary">
        Créer un compte
      </NuxtLink>
    </p>
  </AuthShell>
</template>
