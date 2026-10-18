import type { NuxtApp } from '#app'

/**
 * Cache « stale-while-revalidate » pour useFetch : en revenant sur une page,
 * les données déjà chargées s'affichent tout de suite, puis `revalidate()`
 * les rafraîchit en arrière-plan. Usage :
 *
 *   const { data, refresh } = await useFetch('/api/recipes', { key: 'recipes', ...swr })
 *   revalidate(refresh)
 */
export const swr = {
  getCachedData: (key: string, app: NuxtApp, ctx: { cause: string }) =>
    ctx.cause === 'refresh:manual' || ctx.cause === 'watch' ? undefined : app.payload.data[key],
}

export function revalidate(refresh: () => Promise<unknown>) {
  const nuxtApp = useNuxtApp()
  // Juste après le rendu serveur les données sont fraîches : inutile de recharger.
  if (import.meta.client && !nuxtApp.isHydrating) onMounted(() => refresh())
}
