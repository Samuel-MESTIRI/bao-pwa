/**
 * Position de défilement de `.app-scroller` à chaque navigation :
 * en haut sur une nouvelle page, restaurée au retour arrière.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const positions = new Map<string, number>()
  const scroller = () => document.querySelector<HTMLElement>('.app-scroller')

  let fromHistory = false
  addEventListener('popstate', () => (fromHistory = true))

  let target = 0
  router.beforeEach((to, from) => {
    const el = scroller()
    if (el) positions.set(from.fullPath, el.scrollTop)
    target = fromHistory ? positions.get(to.fullPath) ?? 0 : 0
    fromHistory = false
  })

  nuxtApp.hook('page:finish', () => {
    requestAnimationFrame(() => scroller()?.scrollTo({ top: target }))
  })
})
