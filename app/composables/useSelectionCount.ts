/** Nombre de recettes dans la sélection, pour le badge de la barre d'onglets. */
export function useSelectionCount() {
  const count = useState<number | null>('selection-count', () => null)

  async function refresh() {
    try {
      const items = await $fetch('/api/selection', { headers: useRequestHeaders(['cookie']) })
      count.value = items.length
    }
    catch {
      count.value = null
    }
  }

  return { count, refresh }
}
