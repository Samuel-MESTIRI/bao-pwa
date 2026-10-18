// Filet de sécurité pour Safari iOS : bloque le geste de pincement (événements
// propriétaires gesture*), que touch-action ne couvre pas dans tous les cas.
export default defineNuxtPlugin(() => {
  const prevent = (e: Event) => e.preventDefault()
  for (const type of ['gesturestart', 'gesturechange', 'gestureend']) {
    document.addEventListener(type, prevent, { passive: false })
  }
})
