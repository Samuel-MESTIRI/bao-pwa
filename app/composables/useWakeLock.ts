/**
 * Garde l'écran allumé tant que le composant est affiché (mode cuisine).
 * iOS relâche le verrou quand l'app passe en arrière-plan : on le reprend au retour.
 * Pris en charge par Safari depuis iOS 16.4, et en mode écran d'accueil depuis iOS 18.4.
 */
export function useWakeLock() {
  const supported = ref(false)
  const active = ref(false)
  let sentinel: WakeLockSentinel | null = null

  async function request() {
    if (!('wakeLock' in navigator) || document.visibilityState !== 'visible') return
    try {
      sentinel = await navigator.wakeLock.request('screen')
      active.value = true
      sentinel.addEventListener('release', () => (active.value = false))
    }
    catch {
      active.value = false
    }
  }

  const onVisibility = () => {
    if (document.visibilityState === 'visible' && !active.value) request()
  }

  onMounted(() => {
    supported.value = 'wakeLock' in navigator
    request()
    document.addEventListener('visibilitychange', onVisibility)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('visibilitychange', onVisibility)
    sentinel?.release().catch(() => {})
    sentinel = null
  })

  return { supported, active }
}
