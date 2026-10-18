// Génère favicon, icônes PWA, apple-touch-icon, logo et écrans de démarrage iOS
// à partir de assets-src/icon.png (logo « BAO » blanc sur fond vert).
// À relancer si le logo change : `npm run icons`.
import { mkdir, rm } from 'node:fs/promises'
import sharp from 'sharp'

const OUT = 'public'
const ICON = 'assets-src/icon.png'
const BRAND = { r: 0x29, g: 0x49, b: 0x36 } // vert du fond de l'icône

// Couleurs des écrans de démarrage : celles du thème de l'app
const SPLASH_THEME = {
  light: { background: '#FBF7F0', logo: '#294936' },
  dark: { background: '#16130F', logo: '#7BA98A' },
}

// Mêmes tailles que dans nuxt.config.ts (points CSS × ratio)
const SPLASH = [
  [430, 932, 3], [440, 956, 3], [393, 852, 3], [402, 874, 3], [428, 926, 3],
  [390, 844, 3], [375, 812, 3], [414, 896, 2], [375, 667, 2],
]

/**
 * Logo seul, en blanc sur fond transparent : l'opacité vient de la « blancheur »
 * de chaque pixel de l'icône (fond vert → transparent, lettres blanches → opaque).
 * Le fruit dans le O reste évidé.
 */
async function extractLogoMask() {
  const { data, info } = await sharp(ICON).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const out = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const whiteness = Math.min(
      (data[i] - BRAND.r) / (255 - BRAND.r),
      (data[i + 1] - BRAND.g) / (255 - BRAND.g),
      (data[i + 2] - BRAND.b) / (255 - BRAND.b),
    )
    out[j] = out[j + 1] = out[j + 2] = 255
    out[j + 3] = Math.round(Math.max(0, Math.min(1, whiteness)) * 255)
  }
  return sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } }).trim().png().toBuffer()
}

/** Le logo teinté d'une couleur, à la largeur demandée. */
async function tintedLogo(mask, color, width) {
  const resized = await sharp(mask).resize({ width }).toBuffer()
  const { width: w, height: h } = await sharp(resized).metadata()
  return sharp({ create: { width: w, height: h, channels: 4, background: color } })
    .composite([{ input: resized, blend: 'dest-in' }])
    .png()
    .toBuffer()
}

await rm(`${OUT}/splash`, { recursive: true, force: true })
await rm(`${OUT}/logo-light.webp`, { force: true })
await rm(`${OUT}/logo-dark.webp`, { force: true })
await mkdir(`${OUT}/splash`, { recursive: true })

const png = (img, file) => img.png({ compressionLevel: 9, palette: true }).toFile(`${OUT}/${file}`)

await Promise.all([
  png(sharp(ICON).resize(48, 48), 'favicon.png'),
  png(sharp(ICON).resize(180, 180), 'apple-touch-icon.png'),
  png(sharp(ICON).resize(192, 192), 'pwa-192.png'),
  png(sharp(ICON).resize(512, 512), 'pwa-512.png'),
  // Le logo occupe moins de 80 % du cadre : il tient dans la zone sûre « maskable »
  png(sharp(ICON).resize(512, 512), 'pwa-maskable-512.png'),
])

const mask = await extractLogoMask()

// Logo en masque (blanc) : l'app le colore en CSS avec la couleur du thème
await sharp(mask).resize({ width: 480 }).png({ compressionLevel: 9 }).toFile(`${OUT}/logo-mask.png`)

for (const [w, h, r] of SPLASH) {
  const width = w * r
  const height = h * r
  for (const scheme of ['light', 'dark']) {
    const { background, logo } = SPLASH_THEME[scheme]
    const input = await tintedLogo(mask, logo, Math.round(width * 0.46))
    await sharp({ create: { width, height, channels: 3, background } })
      .composite([{ input, gravity: 'center' }])
      .png({ compressionLevel: 9, palette: true })
      .toFile(`${OUT}/splash/${scheme}-${width}x${height}.png`)
  }
}

console.log('Icônes, logo et écrans de démarrage générés dans public/')
