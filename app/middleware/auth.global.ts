const PUBLIC_ROUTES = new Set(['/login', '/register'])

export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (PUBLIC_ROUTES.has(to.path)) {
    if (loggedIn.value) return navigateTo('/')
    return
  }
  if (!loggedIn.value) return navigateTo('/login')
})
