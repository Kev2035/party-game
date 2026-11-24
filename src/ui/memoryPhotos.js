// Le foto del Memory: basta aggiungere o togliere file in src/custom/memory/ (può anche essere vuota)
// -> { 'nomefile.webp': url }
export const MEMORY_PHOTOS = Object.fromEntries(
  Object.entries(
    import.meta.glob('../custom/memory/*.{webp,jpg,jpeg,png,WEBP,JPG,JPEG,PNG}', { eager: true, import: 'default', query: '?url' }),
  ).map(([path, url]) => [path.split('/').pop(), url]),
)
