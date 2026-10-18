/** Espaces insécables entre un nombre et son unité : « 180 °C » ne se coupe pas en fin de ligne. */
export const nbsp = (text: string) =>
  text.replace(/(\d) (°C|°|%|min|h|g|kg|ml|cl|L|cm)(?=[\s.,;:!?)]|$)/g, '$1 $2')
