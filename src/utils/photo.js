// Compressione foto lato client: quadrato centrale, max 320px, JPEG ~0.7, obiettivo < 50KB.
const MAX = 320
const TARGET_BYTES = 50 * 1024

export function compressFrom(source, width, height, { mirror = false } = {}) {
  const side = Math.min(width, height)
  const out = Math.min(MAX, side)
  const canvas = document.createElement('canvas')
  canvas.width = out
  canvas.height = out
  const ctx = canvas.getContext('2d')
  if (mirror) {
    ctx.translate(out, 0)
    ctx.scale(-1, 1)
  }
  ctx.drawImage(source, (width - side) / 2, (height - side) / 2, side, side, 0, 0, out, out)
  let q = 0.7
  let url = canvas.toDataURL('image/jpeg', q)
  while (url.length * 0.75 > TARGET_BYTES && q > 0.3) {
    q -= 0.1
    url = canvas.toDataURL('image/jpeg', q)
  }
  return url
}

export async function compressFile(file) {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise((resolve, reject) => {
      const i = new Image()
      i.onload = () => resolve(i)
      i.onerror = reject
      i.src = url
    })
    return compressFrom(img, img.naturalWidth, img.naturalHeight)
  } finally {
    URL.revokeObjectURL(url)
  }
}

// Finta foto-prova per i bot (solo debug): un'emoji su sfondo colorato
export function placeholderPhoto(emoji = '🤖', bg = '#9fdcff') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="320"><rect width="320" height="320" fill="${bg}"/><text x="160" y="205" font-size="160" text-anchor="middle">${emoji}</text></svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}
