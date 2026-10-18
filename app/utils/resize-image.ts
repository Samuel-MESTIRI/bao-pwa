/**
 * Réduit une photo dans le navigateur avant l'envoi (1600 px max, JPEG).
 * Une photo d'iPhone passe de 3–5 Mo à ~300 Ko : l'envoi est rapide même en 4G.
 * Le serveur la recompresse ensuite en WebP.
 */
export async function resizeImage(file: File, maxSize = 1600, quality = 0.85): Promise<Blob> {
  const bitmap = await createImageBitmap(file).catch(() => null)
  if (!bitmap) return file // format non décodable ici : on laisse le serveur s'en charger

  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()

  return new Promise(resolve =>
    canvas.toBlob(blob => resolve(blob ?? file), 'image/jpeg', quality))
}
