import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import { join } from 'node:path'

// Les noms sont des UUID aléatoires : impossibles à deviner, et jamais réécrits,
// d'où le cache « immutable » d'un an.
const FILE = /^[a-f0-9-]{36}(-thumb)?\.webp$/

export default defineEventHandler(async (event) => {
  const file = getRouterParam(event, 'file') ?? ''
  if (!FILE.test(file)) throw createError({ statusCode: 404 })

  const path = join(uploadDir(), file)
  const info = await stat(path).catch(() => null)
  if (!info?.isFile()) throw createError({ statusCode: 404 })

  setResponseHeaders(event, {
    'content-type': 'image/webp',
    'content-length': info.size,
    'cache-control': 'public, max-age=31536000, immutable',
  })
  return sendStream(event, createReadStream(path))
})
