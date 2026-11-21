import { CanvasTexture, SRGBColorSpace } from 'three'

export function createWindowMap() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 96
  const context = canvas.getContext('2d')
  context.fillStyle = 'rgba(137, 180, 227, 0.08)'
  context.fillRect(0, 0, 96, 96)
  context.fillStyle = 'rgba(194, 217, 252, 0.12)'
  context.beginPath()
  context.moveTo(0, 69)
  context.lineTo(96, 10)
  context.lineTo(96, 28)
  context.lineTo(0, 86)
  context.fill()
  context.strokeStyle = 'rgba(198, 222, 255, 0.15)'
  context.lineWidth = 1.6
  context.strokeRect(2, 2, 92, 92)
  const map = new CanvasTexture(canvas)
  map.colorSpace = SRGBColorSpace
  return map
}

export function createCurtainLightMap() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 96
  const context = canvas.getContext('2d')
  const glow = context.createRadialGradient(62, 53, 8, 62, 53, 76)
  glow.addColorStop(0, '#fffaf0')
  glow.addColorStop(0.49, '#f1e6d2')
  glow.addColorStop(1, '#939096')
  context.fillStyle = glow
  context.fillRect(0, 0, 128, 96)

  // Transmitted light softens the folds of a curtain behind the glass.
  context.globalCompositeOperation = 'multiply'
  for (let x = 0; x < 128; x += 1) {
    const shade = 0.035 + 0.08 * (0.5 + 0.5 * Math.sin(x * 0.40 + Math.sin(x * 0.16)))
    context.fillStyle = `rgba(65, 54, 60, ${shade})`
    context.fillRect(x, 0, 1, 96)
  }

  const map = new CanvasTexture(canvas)
  map.colorSpace = SRGBColorSpace
  return map
}
