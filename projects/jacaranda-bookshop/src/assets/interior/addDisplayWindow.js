import { CylinderGeometry, Group, PointLight } from 'three'
import { addMesh, box } from '../../world/modeling.js'
import { addLanternHalo, spot } from '../../world/lightingEffects.js'

export function addDisplayWindow(room, { width, depth }, materials) {
  const x = -width * 0.30
  const z = depth / 2 - 0.26
  const display = new Group()
  display.position.set(x, 0, z)
  room.add(display)

  box(display, materials.wood, [1.14, 0.49, 0.44], [0, 0.415, 0], 0.024)
  box(display, materials.trim, [1.23, 0.061, 0.50], [0, 0.686, 0], 0.018)
  for (const [dx, cover] of [[-0.32, materials.sageCloth], [-0.04, materials.clay], [0.24, materials.flowerBox]]) {
    const book = new Group()
    book.position.set(dx, 0.86, 0.05)
    book.rotation.set(-0.22, dx * -0.42, dx * 0.12)
    display.add(book)
    box(book, materials.trim, [0.15, 0.237, 0.031], [0, 0, 0], 0.006)
    box(book, cover, [0.161, 0.251, 0.014], [0, 0, 0.018], 0.006)
    box(book, cover, [0.027, 0.251, 0.049], [-0.071, 0, 0], 0.007)
    box(book, materials.brass, [0.087, 0.014, 0.004], [0.009, 0.047, 0.026], 0.002)
  }

  const shade = addMesh(display, new CylinderGeometry(0.057, 0.145, 0.10, 14),
    materials.windowBox, 0.02, 1.66, -0.10)
  shade.castShadow = false
  const bulb = addMesh(display, new CylinderGeometry(0.092, 0.105, 0.028, 14),
    materials.interiorBulb, 0.02, 1.60, -0.10)
  bulb.castShadow = false
  addMesh(display, new CylinderGeometry(0.012, 0.012, 0.41, 8), materials.iron,
    0.02, 1.91, -0.10)
  addLanternHalo(display, [0.025, 1.58, -0.033], 0.45, 0.32)
  const displayBounce = new PointLight('#ffd09b', 2.4, 0.89, 2)
  displayBounce.position.set(-0.16, 1.14, -0.66)
  display.add(displayBounce)
  spot(display, {
    color: '#ffc68e', intensity: 4.4, range: 1.28, angle: 0.48, softEdge: 0.76,
    source: [0.02, 1.615, -0.10], target: [0.01, 0.75, 0.02],
  })
}
