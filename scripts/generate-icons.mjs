// Génère favicon, icônes PWA, apple-touch-icon et écrans de démarrage iOS
// à partir des visuels de assets-src/. À relancer si le logo change : `npm run icons`.
import { mkdir } from 'node:fs/promises'
import sharp from 'sharp'

const OUT = 'public'
const ICON = 'assets-src/icon.png' // logo plein cadre sur fond vert
const PANDA = { light: 'assets-src/splash-light.png', dark: 'assets-src/splash-dark.png' }
const BACKGROUND = { light: '#FBF7F0', dark: '#16130F' }

// Mêmes tailles que dans nuxt.config.ts (points CSS × ratio)
const SPLASH = [
  [430, 932, 3], [440, 956, 3], [393, 852, 3], [402, 874, 3], [428, 926, 3],
  [390, 844, 3], [375, 812, 3], [414, 896, 2], [375, 667, 2],
]

await mkdir(`${OUT}/splash`, { recursive: true })

const png = (img, file) => img.png({ compressionLevel: 9, palette: true }).toFile(`${OUT}/${file}`)

await Promise.all([
  png(sharp(ICON).resize(48, 48), 'favicon.png'),
  png(sharp(ICON).resize(180, 180), 'apple-touch-icon.png'),
  png(sharp(ICON).resize(192, 192), 'pwa-192.png'),
  png(sharp(ICON).resize(512, 512), 'pwa-512.png'),
  // Le logo occupe déjà moins de 80 % du cadre : il tient dans la zone sûre « maskable »
  png(sharp(ICON).resize(512, 512), 'pwa-maskable-512.png'),
])

// Logo panda pour les écrans de connexion
for (const scheme of ['light', 'dark']) {
  await sharp(PANDA[scheme]).trim().resize(320).webp({ quality: 85 }).toFile(`${OUT}/logo-${scheme}.webp`)
}

for (const [w, h, r] of SPLASH) {
  const width = w * r
  const height = h * r
  const logoSize = Math.round(width * 0.42)
  for (const scheme of ['light', 'dark']) {
    const logo = await sharp(PANDA[scheme]).trim().resize(logoSize, logoSize, { fit: 'inside' }).toBuffer()
    await sharp({ create: { width, height, channels: 3, background: BACKGROUND[scheme] } })
      .composite([{ input: logo, gravity: 'center' }])
      .png({ compressionLevel: 9, palette: true })
      .toFile(`${OUT}/splash/${scheme}-${width}x${height}.png`)
  }
}

console.log('Icônes et écrans de démarrage générés dans public/')
