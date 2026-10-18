import type { RouterConfig } from '@nuxt/schema'

// Le document ne défile pas (voir main.css) : la position de défilement est
// gérée par le plugin scroll.client.ts sur `.app-scroller`.
export default <RouterConfig>{
  scrollBehavior: () => false,
}
