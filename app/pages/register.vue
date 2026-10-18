<script setup lang="ts">
definePageMeta({ layout: 'bare' })
useHead({ title: 'Créer un compte · BAO' })

const { fetch: refreshSession } = useUserSession()
const { mode } = useTheme()

const form = reactive({ name: '', email: '', password: '' })
const error = ref('')
const loading = ref(false)

async function submit() {
  error.value = ''
  const result = registerSchema.safeParse(form)
  if (!result.success) {
    error.value = result.error.issues[0]?.message ?? 'Vérifie le formulaire'
    return
  }
  loading.value = true
  try {
    await $fetch('/api/auth/register', { method: 'POST', body: result.data })
    // Le thème choisi avant l'inscription est gardé dans le nouveau profil
    await $fetch('/api/me', { method: 'PATCH', body: { theme: mode.value } }).catch(() => {})
    await refreshSession()
    await navigateTo('/', { replace: true })
  }
  catch (e) {
    error.value = errorMessage(e, 'Inscription impossible')
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <AuthShell title="Bienvenue !" subtitle="Crée ton compte pour commencer ton carnet de recettes.">
    <form class="space-y-4" novalidate @submit.prevent="submit">
      <div>
        <label for="name" class="label">Prénom</label>
        <input id="name" v-model="form.name" class="field" autocomplete="given-name" maxlength="60" required>
      </div>
      <div>
        <label for="email" class="label">E-mail</label>
        <input id="email" v-model="form.email" class="field" type="email" autocomplete="email" autocapitalize="none" inputmode="email" required>
      </div>
      <div>
        <label for="password" class="label">Mot de passe <span class="font-normal text-muted">(8 caractères min.)</span></label>
        <input id="password" v-model="form.password" class="field" type="password" autocomplete="new-password" minlength="8" required>
      </div>
      <p v-if="error" class="rounded-md bg-danger-surface px-4 py-3 text-[15px] font-medium text-danger" role="alert">
        {{ error }}
      </p>
      <AppButton type="submit" :loading="loading" class="mt-2">
        Créer mon compte
      </AppButton>
    </form>
    <p class="mt-6 text-center text-ink-2">
      Déjà un compte ?
      <NuxtLink to="/login" class="inline-block min-h-11 py-2 font-bold text-primary">
        Se connecter
      </NuxtLink>
    </p>
  </AuthShell>
</template>
