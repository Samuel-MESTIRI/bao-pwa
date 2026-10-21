<script setup lang="ts">
import type { CategoryIcon } from '#shared/utils/constants'

useHead({ title: 'Réglages · BAO' })

const { user, clear } = useUserSession()
const { mode, setMode } = useTheme()
const toast = useToast()
const { confirm } = useConfirm()

const { data: categories, refresh } = await useFetch('/api/categories', { key: 'categories', ...swr })
revalidate(refresh)

const THEME_LABELS: Record<ThemeMode, string> = { system: 'Système', light: 'Clair', dark: 'Sombre' }

const ICON_LABELS = new Map<string, string>(CATEGORY_ICON_GROUPS.flatMap(g => g.icons.map(i => [i.id, i.label] as const)))
const iconLabel = (id: string) => ICON_LABELS.get(id) ?? ''

const editing = ref<{ id: number | null, name: string, icon: CategoryIcon } | null>(null)
const saving = ref(false)

function openNew() {
  editing.value = { id: null, name: '', icon: 'tag' }
}

function openEdit(c: { id: number, name: string, icon: string }) {
  editing.value = { id: c.id, name: c.name, icon: c.icon as CategoryIcon }
}

async function saveCategory() {
  if (!editing.value) return
  const { id, name, icon } = editing.value
  if (!name.trim()) {
    toast.error('Donne un nom à la catégorie')
    return
  }
  saving.value = true
  try {
    await $fetch(id ? `/api/categories/${id}` : '/api/categories', { method: id ? 'PATCH' : 'POST', body: { name, icon } })
    editing.value = null
    await refresh()
  }
  catch (e) {
    toast.error(errorMessage(e))
  }
  finally {
    saving.value = false
  }
}

async function removeCategory() {
  if (!editing.value?.id) return
  const { id, name } = editing.value
  const ok = await confirm({
    title: `Supprimer « ${name} » ?`,
    message: 'Les recettes de cette catégorie sont conservées.',
    confirmLabel: 'Supprimer',
    danger: true,
  })
  if (!ok) return
  editing.value = null
  await $fetch(`/api/categories/${id}`, { method: 'DELETE' })
  await Promise.all([refresh(), refreshNuxtData('recipes')])
}

async function logout() {
  await clear()
  clearNuxtData()
  useSelectionCount().count.value = null
  await navigateTo('/login', { replace: true })
}
</script>

<template>
  <div class="space-y-8">
    <PageHeader title="Réglages" />

    <section class="card flex items-center gap-4 p-4">
      <div class="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-bold text-on-primary">
        {{ user?.name?.[0]?.toUpperCase() }}
      </div>
      <div class="min-w-0">
        <p class="truncate font-bold">
          {{ user?.name }}
        </p>
        <p class="truncate text-[15px] text-ink-2">
          {{ user?.email }}
        </p>
      </div>
    </section>

    <section>
      <h2 class="section-label mb-3">
        Apparence
      </h2>
      <div class="grid grid-cols-3 gap-1 rounded-full bg-surface-alt p-1">
        <button
          v-for="m in THEME_MODES"
          :key="m"
          type="button"
          class="min-h-12 rounded-full font-medium transition"
          :class="mode === m ? 'bg-primary text-on-primary shadow-(--shadow-card)' : 'text-ink-2'"
          :aria-pressed="mode === m"
          @click="setMode(m)"
        >
          {{ THEME_LABELS[m] }}
        </button>
      </div>
    </section>

    <section>
      <div class="mb-3 flex items-center justify-between">
        <h2 class="section-label">
          Mes catégories
        </h2>
        <button type="button" class="flex min-h-11 items-center gap-1 px-2 font-bold text-primary" @click="openNew">
          <AppIcon name="plus" :size="20" /> Ajouter
        </button>
      </div>
      <ul class="card divide-y divide-line overflow-hidden">
        <li v-for="c in categories" :key="c.id">
          <button type="button" class="flex min-h-14 w-full items-center gap-3 px-4 text-left active:bg-surface-alt" @click="openEdit(c)">
            <span class="flex size-9 items-center justify-center rounded-full bg-accent-surface text-accent-strong dark:text-accent">
              <AppIcon :name="categoryIcon(c.icon)" :size="20" />
            </span>
            <span class="flex-1 font-medium">{{ c.name }}</span>
            <AppIcon name="chevron-right" :size="20" class="text-muted" />
          </button>
        </li>
        <li v-if="!categories?.length" class="p-4 text-center text-ink-2">
          Aucune catégorie
        </li>
      </ul>
    </section>

    <section>
      <AppButton variant="secondary" @click="logout">
        Se déconnecter
      </AppButton>
    </section>

    <BottomSheet :model-value="!!editing" :title="editing?.id ? 'Modifier la catégorie' : 'Nouvelle catégorie'" @update:model-value="editing = null">
      <form v-if="editing" class="space-y-5" @submit.prevent="saveCategory">
        <div>
          <label for="cat-name" class="label">Nom</label>
          <input id="cat-name" v-model="editing.name" class="field" maxlength="40" placeholder="Soupes, apéro…">
        </div>
        <fieldset>
          <legend class="label">
            Icône <span class="font-normal text-ink-2">· {{ iconLabel(editing.icon) }}</span>
          </legend>
          <div v-for="group in CATEGORY_ICON_GROUPS" :key="group.label" class="mb-4">
            <h3 class="section-label mb-2">
              {{ group.label }}
            </h3>
            <div class="grid grid-cols-6 gap-2">
              <button
                v-for="icon in group.icons"
                :key="icon.id"
                type="button"
                class="flex aspect-square items-center justify-center rounded-md border-2 transition active:scale-90"
                :class="editing.icon === icon.id ? 'border-primary bg-primary-soft text-primary' : 'border-transparent bg-surface-alt text-ink-2'"
                :aria-label="icon.label"
                :title="icon.label"
                :aria-pressed="editing.icon === icon.id"
                @click="editing.icon = icon.id"
              >
                <AppIcon :name="categoryIcon(icon.id)" :size="26" />
              </button>
            </div>
          </div>
        </fieldset>
        <!-- Reste visible pendant qu'on fait défiler les icônes -->
        <div class="sticky bottom-0 -mx-5 space-y-1 bg-bg px-5 pt-3" style="padding-bottom: env(safe-area-inset-bottom)">
          <AppButton type="submit" :loading="saving">
            Enregistrer
          </AppButton>
          <AppButton v-if="editing.id" variant="ghost" icon="trash" class="text-danger!" @click="removeCategory">
            Supprimer la catégorie
          </AppButton>
        </div>
      </form>
    </BottomSheet>
  </div>
</template>
