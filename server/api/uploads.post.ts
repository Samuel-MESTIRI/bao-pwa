const MAX_SIZE = 12 * 1024 * 1024

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  rateLimit(`upload:${user.id}`, 60, 60 * 60_000)

  const parts = await readMultipartFormData(event)
  const file = parts?.find(p => p.name === 'image' && p.data?.length)
  if (!file) throw createError({ statusCode: 400, statusMessage: 'Aucune image reçue' })
  if (file.data.length > MAX_SIZE) throw createError({ statusCode: 413, statusMessage: 'Image trop lourde (12 Mo max)' })

  try {
    return { image: await saveImage(file.data) }
  }
  catch {
    throw createError({ statusCode: 415, statusMessage: 'Format d\'image non pris en charge' })
  }
})
