<script setup lang="ts">
import type { Unit } from '#shared/utils/constants'

useHead({ title: 'Liste de courses · BAO' })

const toast = useToast()
const { confirm } = useConfirm()

const { data: items, refresh } = await useFetch('/api/shopping', { key: 'shopping', ...swr })
revalidate(refresh)

type Item = NonNullable<typeof items.value>[number]

const todo = computed(() => (items.value ?? []).filter(i => !i.checked))
const done = computed(() => (items.value ?? []).filter(i => i.checked))

const newName = ref('')
const adding = ref(false)
const editing = ref<{ id: number, name: string, quantity: string, unit: Unit | '' } | null>(null)

const amount = (i: Item) => formatAmount(i.quantity, i.unit)

async function add() {
  const name = newName.value.trim()
  if (!name || adding.value) return
  adding.value = true
  try {
    const item = await $fetch('/api/shopping', { method: 'POST', body: { name } })
    items.value = [...(items.value ?? []), item!]
    newName.value = ''
  }
  catch (e) {
    toast.error(errorMessage(e))
  }
  finally {
    adding.value = false
  }
}

async function patch(id: number, body: Record<string, unknown>) {
  try {
    await $fetch(`/api/shopping/${id}`, { method: 'PATCH', body })
  }
  catch (e) {
    toast.error(errorMessage(e))
    await refresh()
  }
}

function toggle(item: Item) {
  // Mise à jour immédiate, sans attendre le serveur. `data` de useFetch n'est pas
  // réactif en profondeur : on remplace le tableau plutôt que de muter l'article.
  const checked = !item.checked
  items.value = (items.value ?? []).map(i => (i.id === item.id ? { ...i, checked } : i))
  if ('vibrate' in navigator) navigator.vibrate?.(10)
  patch(item.id, { checked })
}

function openEdit(item: Item) {
  editing.value = {
    id: item.id,
    name: item.name,
    quantity: item.quantity != null ? String(item.quantity).replace('.', ',') : '',
    unit: (item.unit as Unit) ?? '',
  }
}

async function saveEdit() {
  if (!editing.value) return
  const result = shopItemPatchSchema.safeParse({
    name: editing.value.name,
    quantity: editing.value.quantity,
    unit: editing.value.quantity.trim() ? editing.value.unit || null : null,
  })
  if (!result.success) {
    toast.error(result.error.issues[0]?.message ?? 'Vérifie les champs')
    return
  }
  const id = editing.value.id
  editing.value = null
  await patch(id, result.data)
  await refresh()
}

async function removeItem(id: number) {
  editing.value = null
  items.value = items.value?.filter(i => i.id !== id) ?? []
  await $fetch(`/api/shopping/${id}`, { method: 'DELETE' }).catch(() => refresh())
}

async function clearChecked() {
  items.value = items.value?.filter(i => !i.checked) ?? []
  await $fetch('/api/shopping', { method: 'DELETE', query: { checked: 1 } }).catch(() => refresh())
}

async function clearAll() {
  const ok = await confirm({ title: 'Vider la liste ?', message: 'Tous les articles seront supprimés.', confirmLabel: 'Vider la liste', danger: true })
  if (!ok) return
  items.value = []
  await $fetch('/api/shopping', { method: 'DELETE' }).catch(() => refresh())
}
</script>

<template>
  <div>
    <PageHeader title="Liste de courses">
      <template v-if="items?.length" #actions>
        <IconButton icon="trash" label="Vider la liste" @click="clearAll" />
      </template>
    </PageHeader>

    <form class="mb-6 flex gap-2" @submit.prevent="add">
      <label class="sr-only" for="new-item">Ajouter un article</label>
      <input id="new-item" v-model="newName" class="field rounded-full!" placeholder="Ajouter un article…" maxlength="120" enterkeyhint="done" autocomplete="off">
      <button type="submit" class="flex size-13 shrink-0 items-center justify-center rounded-full bg-primary text-on-primary transition active:scale-90 disabled:opacity-40" :disabled="!newName.trim() || adding" aria-label="Ajouter cet article">
        <AppIcon name="plus" :size="26" />
      </button>
    </form>

    <template v-if="items?.length">
      <ul v-if="todo.length" class="card divide-y divide-line overflow-hidden">
        <li v-for="item in todo" :key="item.id" class="flex items-center">
          <button type="button" class="flex min-h-15 min-w-0 flex-1 items-center gap-4 px-4 py-2 text-left active:bg-surface-alt" role="checkbox" :aria-checked="false" @click="toggle(item)">
            <span class="size-7 shrink-0 rounded-full border-2 border-line-strong" />
            <span class="min-w-0 flex-1">{{ item.name }}</span>
            <span v-if="amount(item)" class="shrink-0 font-bold text-primary tabular-nums">{{ amount(item) }}</span>
          </button>
          <IconButton icon="edit" :label="`Modifier ${item.name}`" :size="20" class="mr-1" @click="openEdit(item)" />
        </li>
      </ul>
      <p v-else class="card p-5 text-center font-medium text-primary">
        Tout est dans le panier 🎉
      </p>

      <section v-if="done.length" class="mt-7">
        <div class="mb-2 flex items-center justify-between">
          <h2 class="overline">
            Dans le panier · {{ done.length }}
          </h2>
          <button type="button" class="min-h-11 px-2 text-[15px] font-medium text-ink-2" @click="clearChecked">
            Retirer
          </button>
        </div>
        <ul class="divide-y divide-line overflow-hidden rounded-md bg-surface-muted/60">
          <li v-for="item in done" :key="item.id">
            <button type="button" class="flex min-h-14 w-full items-center gap-4 px-4 py-2 text-left text-muted" role="checkbox" :aria-checked="true" @click="toggle(item)">
              <span class="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-light text-white">
                <AppIcon name="check" :size="18" />
              </span>
              <span class="min-w-0 flex-1 line-through">{{ item.name }}</span>
              <span v-if="amount(item)" class="shrink-0 tabular-nums">{{ amount(item) }}</span>
            </button>
          </li>
        </ul>
      </section>
    </template>

    <EmptyState
      v-else
      icon="list"
      title="Rien à acheter pour l'instant"
      text="Ajoute un article ci-dessus, ou génère une liste depuis ta sélection de recettes."
    >
      <AppButton to="/selection" variant="secondary">
        Voir ma sélection
      </AppButton>
    </EmptyState>

    <BottomSheet :model-value="!!editing" title="Modifier l'article" @update:model-value="editing = null">
      <form v-if="editing" class="space-y-4" @submit.prevent="saveEdit">
        <div>
          <label for="edit-name" class="label">Article</label>
          <input id="edit-name" v-model="editing.name" class="field" maxlength="120">
        </div>
        <div class="flex gap-2">
          <div class="w-32">
            <label for="edit-qty" class="label">Quantité</label>
            <input id="edit-qty" v-model="editing.quantity" class="field" inputmode="decimal" placeholder="—">
          </div>
          <div class="flex-1">
            <label for="edit-unit" class="label">Unité</label>
            <select id="edit-unit" v-model="editing.unit" class="field appearance-none">
              <option value="">
                —
              </option>
              <option v-for="u in UNITS" :key="u" :value="u">
                {{ u }}
              </option>
            </select>
          </div>
        </div>
        <AppButton type="submit">
          Enregistrer
        </AppButton>
        <AppButton variant="ghost" class="text-danger!" icon="trash" @click="removeItem(editing.id)">
          Supprimer l'article
        </AppButton>
      </form>
    </BottomSheet>
  </div>
</template>
