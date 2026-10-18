/**
 * Thème Système / Clair / Sombre.
 *
 * Le choix est gardé dans un cookie (lu au rendu serveur, donc pas de flash)
 * et dans le profil. `system` est résolu côté navigateur : par un petit script
 * en tête de page avant le premier affichage, puis par `isDark`.
 */
// Hors useState exprès : la valeur serveur (toujours false) ne doit pas écraser
// celle du navigateur à l'hydratation. Jamais modifiée côté serveur.
const systemDark = ref(import.meta.client ? matchMedia('(prefers-color-scheme: dark)').matches : false)

export function useTheme() {
  const mode = useCookie<ThemeMode>(THEME_COOKIE, {
    default: () => 'system',
    maxAge: 60 * 60 * 24 * 365 * 2,
    sameSite: 'lax',
  })

  const isDark = computed(() => mode.value === 'dark' || (mode.value === 'system' && systemDark.value))

  async function setMode(value: ThemeMode) {
    mode.value = value
    await $fetch('/api/me', { method: 'PATCH', body: { theme: value } }).catch(() => {})
  }

  return { mode, setMode, isDark, systemDark }
}

/** Script inline exécuté avant le rendu : évite le flash clair → sombre en mode « Système ». */
export const THEME_BOOT_SCRIPT = `(function(){try{var m=(document.cookie.match(/(?:^|; )${THEME_COOKIE}=([^;]*)/)||[])[1]||'system';if(m==='system'&&matchMedia('(prefers-color-scheme: dark)').matches)document.documentElement.dataset.theme='dark'}catch(e){}})()`
