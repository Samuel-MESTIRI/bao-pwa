/** Retour arrière si on vient de l'app, sinon vers `fallback` (lien ouvert directement, app relancée). */
export function goBack(fallback = '/') {
  if (import.meta.client && window.history.state?.back) useRouter().back()
  else navigateTo(fallback, { replace: true })
}
