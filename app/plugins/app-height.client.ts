/**
 * Hauteur de l'app sur iPhone en mode écran d'accueil.
 *
 * Avec la barre d'état translucide, iOS calcule la zone d'affichage sans la
 * barre d'état alors que le contenu commence tout en haut de l'écran : l'app
 * s'arrêtait ~50 points avant le bas (barre d'onglets relevée, bande vide).
 * On impose donc la hauteur réelle de l'écran à `.app-root` via --app-height.
 * Ailleurs (navigateur, Android), la valeur par défaut (100 %) reste en place.
 */
export default defineNuxtPlugin(() => {
  const iosStandalone = (navigator as Navigator & { standalone?: boolean }).standalone === true
  if (!iosStandalone) return

  const root = document.documentElement
  const update = () => {
    const portrait = matchMedia('(orientation: portrait)').matches
    const long = Math.max(screen.width, screen.height)
    const short = Math.min(screen.width, screen.height)
    root.style.setProperty('--app-height', `${portrait ? long : short}px`)
  }

  update()
  addEventListener('resize', update)
  addEventListener('orientationchange', update)
})
