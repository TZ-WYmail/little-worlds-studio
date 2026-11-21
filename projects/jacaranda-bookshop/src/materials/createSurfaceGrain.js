import { CanvasTexture, RepeatWrapping, SRGBColorSpace } from 'three'
import { seededRandom } from '../utils/seededRandom.js'

export function createSurfaceGrain(seed, strength, vertical = false) {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')
  const pixels = ctx.createImageData(size, size)
  const random = seededRandom(seed)
  const bands = Array.from({ length: size }, () => random())
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const noise = vertical ? bands[x] * 0.65 + random() * 0.35 : random()
      const shade = Math.round(255 - noise * strength)
      const index = (y * size + x) * 4
      pixels.data.set([shade, shade, shade, 255], index)
    }
  }
  ctx.putImageData(pixels, 0, 0)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = texture.wrapT = RepeatWrapping
  return texture
}
