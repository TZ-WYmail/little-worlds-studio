import { CanvasTexture, CircleGeometry, CylinderGeometry, Group, MeshStandardMaterial, SRGBColorSpace, Vector3 } from 'three'
import { addMesh, rod } from '../../world/modeling.js'

export function createHangingSign({ width, depth }, materials) {
  const sign = new Group()
  sign.position.set(width * 0.5 - 0.13, 2.21, depth * 0.5 + 0.11)
  const bracket = [
    [[0, 0.39, -0.04], [0, 0.39, 0.53]],
    [[0, 0.19, -0.04], [0, 0.39, 0.31]],
    [[0, 0.39, 0.26], [0, 0.26, 0.26]],
    [[0, 0.39, 0.47], [0, 0.26, 0.47]],
  ]
  for (const [from, to] of bracket) rod(sign, materials.iron, new Vector3(...from), new Vector3(...to), 0.015)
  const board = addMesh(sign, new CylinderGeometry(0.23, 0.23, 0.044, 28), materials.brass, 0, 0.044, 0.36)
  board.rotation.z = Math.PI / 2

  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 192
  const pen = canvas.getContext('2d')
  pen.fillStyle = '#334d48'
  pen.fillRect(0, 0, 192, 192)
  pen.strokeStyle = '#e3c189'
  pen.lineWidth = 3
  pen.beginPath()
  pen.arc(96, 96, 85, 0, Math.PI * 2)
  pen.stroke()
  pen.lineWidth = 5
  pen.lineJoin = 'round'
  pen.beginPath()
  pen.moveTo(45, 67)
  pen.quadraticCurveTo(74, 61, 96, 77)
  pen.quadraticCurveTo(118, 61, 147, 67)
  pen.lineTo(147, 116)
  pen.quadraticCurveTo(118, 111, 96, 128)
  pen.quadraticCurveTo(74, 111, 45, 116)
  pen.closePath()
  pen.stroke()
  pen.beginPath()
  pen.moveTo(96, 77)
  pen.lineTo(96, 127)
  pen.stroke()
  const map = new CanvasTexture(canvas)
  map.colorSpace = SRGBColorSpace
  const print = new MeshStandardMaterial({ map, roughness: 0.84 })
  const face = new CircleGeometry(0.222, 28)
  for (const side of [-1, 1]) {
    const mesh = addMesh(sign, face, print, 0.023 * side, 0.044, 0.36)
    mesh.rotation.y = side * Math.PI / 2
    mesh.castShadow = false
  }
  return sign
}
