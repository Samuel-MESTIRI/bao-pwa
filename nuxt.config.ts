import tailwindcss from '@tailwindcss/vite'

const THEME_COLOR_LIGHT = '#FBF7F0'
const THEME_COLOR_DARK = '#16130F'

// Écrans de démarrage iOS : un fichier par taille d'écran (en points CSS × ratio).
// Générés par `npm run icons` dans public/splash/.
const IOS_SPLASH = [
  { w: 430, h: 932, r: 3 }, // 14/15/16 Pro Max, 15/16 Plus
  { w: 440, h: 956, r: 3 }, // 16/17 Pro Max
  { w: 393, h: 852, r: 3 }, // 14/15/16 Pro, 15/16
  { w: 402, h: 874, r: 3 }, // 16/17 Pro
  { w: 428, h: 926, r: 3 }, // 12/13 Pro Max, 14 Plus
  { w: 390, h: 844, r: 3 }, // 12/13/14
  { w: 375, h: 812, r: 3 }, // X/XS/11 Pro, 12/13 mini
  { w: 414, h: 896, r: 2 }, // XR/11
  { w: 375, h: 667, r: 2 }, // SE 2/3, 8
]

const splashLinks = IOS_SPLASH.flatMap(({ w, h, r }) =>
  (['light', 'dark'] as const).map(scheme => ({
    rel: 'apple-touch-startup-image' as const,
    href: `/splash/${scheme}-${w * r}x${h * r}.png`,
    media: `(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait) and (prefers-color-scheme: ${scheme})`,
  })),
)

export default defineNuxtConfig({
  compatibilityDate: '2026-10-01',
  devtools: { enabled: false },

  modules: ['nuxt-auth-utils', '@vite-pwa/nuxt'],

  css: [
    '@fontsource/poppins/latin-400.css',
    '@fontsource/poppins/latin-500.css',
    '@fontsource/poppins/latin-700.css',
    '~/assets/css/main.css',
  ],

  vite: {
    plugins: [tailwindcss()],
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      title: 'BAO',
      meta: [
        { name: 'viewport', content: 'width=device-width, initial-scale=1, viewport-fit=cover' },
        { name: 'description', content: 'Ton carnet de recettes et ta liste de courses.' },
        { name: 'theme-color', content: THEME_COLOR_LIGHT, media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: THEME_COLOR_DARK, media: '(prefers-color-scheme: dark)' },
        // Mode standalone une fois ajoutée à l'écran d'accueil
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-title', content: 'BAO' },
        // Le contenu passe sous la barre d'état : les marges viennent de env(safe-area-inset-*)
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
      link: [
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/favicon.png' },
        { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
        ...splashLinks,
      ],
    },
  },

  runtimeConfig: {
    databaseUrl: '',
    uploadDir: './.data/uploads',
    session: {
      maxAge: 60 * 60 * 24 * 90, // 90 jours : on ne se reconnecte pas tous les quatre matins en cuisine
    },
  },

  nitro: {
    compressPublicAssets: { gzip: true, brotli: true },
    routeRules: {
      '/_nuxt/**': { headers: { 'cache-control': 'public, max-age=31536000, immutable' } },
    },
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'BAO — Recettes',
      short_name: 'BAO',
      description: 'Ton carnet de recettes et ta liste de courses.',
      lang: 'fr',
      start_url: '/',
      scope: '/',
      display: 'standalone',
      orientation: 'portrait',
      background_color: THEME_COLOR_LIGHT,
      theme_color: THEME_COLOR_LIGHT,
      icons: [
        { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
        { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
        { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
    },
    workbox: {
      // Pas de hors-ligne : pas de fallback de navigation, le cache sert à la vitesse.
      navigateFallback: null,
      globPatterns: ['**/*.{js,css,woff2}'],
      runtimeCaching: [
        {
          // Les photos ont un nom unique : une fois chargées, elles ne changent plus.
          urlPattern: ({ url }) => url.pathname.startsWith('/images/'),
          handler: 'CacheFirst',
          options: {
            cacheName: 'bao-images',
            expiration: { maxEntries: 300, maxAgeSeconds: 60 * 60 * 24 * 60 },
          },
        },
      ],
    },
    client: { installPrompt: false },
    devOptions: { enabled: false },
  },

  typescript: { strict: true },
})
