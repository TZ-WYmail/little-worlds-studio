import { CylinderGeometry, Group, PlaneGeometry, SphereGeometry, Vector3 } from 'three'
import { addMesh, box, rod } from '../../world/modeling.js'
import { seededRandom } from '../../utils/seededRandom.js'

function windowBoxes(shop, width, front, materials) {
  const random = seededRandom(874)
  const petal = new SphereGeometry(1, 7, 4)
  for (const x of [-width * 0.3, width * 0.3]) {
    box(shop, materials.windowBox, [0.9, 0.16, 0.28], [x, 2.68, front + 0.16], 0.031)
    box(shop, materials.earth, [0.78, 0.025, 0.20], [x, 2.77, front + 0.16], 0.009)
    for (let sprig = 0; sprig < 11; sprig += 1) {
      const px = x + (sprig - 5) * 0.064
      const py = 2.77 + random() * 0.12
      const pz = front + 0.13 + random() * 0.16
      const leaf = addMesh(shop, petal, materials.sage, px, py, pz)
      leaf.scale.set(0.068, 0.048 + random() * 0.026, 0.049)
      leaf.rotation.z = (random() - 0.5) * 1.6
      const blossom = addMesh(shop, petal, sprig % 3 ? materials.flowerBox : materials.trim, px, py + 0.061, pz)
      blossom.scale.set(0.032, 0.023, 0.034)
    }
  }
}

function stripedAwning(shop, width, front, materials) {
  const awning = new Group()
  awning.position.set(-width * 0.30, 1.86, front + 0.13)
  shop.add(awning)
  const cloth = new PlaneGeometry(1, 1, 1, 8)
  const positions = cloth.attributes.position
  for (let index = 0; index < positions.count; index += 1) {
    const t = positions.getY(index) + 0.5
    positions.setXYZ(index, positions.getX(index), -0.21 * t + 0.068 * Math.sin(t * Math.PI), 0.54 * t)
  }
  cloth.computeVertexNormals()
  const stripe = width * 0.27 / 9
  for (let i = 0; i < 9; i += 1) {
    const material = i % 2 ? materials.creamCloth : materials.sageCloth
    const x = (i - 4) * stripe
    const panel = addMesh(awning, cloth, material, x, 0, 0)
    panel.scale.x = stripe
    box(awning, material, [stripe, 0.088, 0.025], [x, -0.237, 0.535], 0.012)
  }
  rod(awning, materials.iron, new Vector3(-4.5 * stripe, -0.22, 0.54), new Vector3(4.5 * stripe, -0.22, 0.54), 0.015)
}

export function addShopDetails(shop, { width, depth, wallHeight }, materials, roof) {
  const front = depth / 2
  box(shop, materials.trim, [width + 0.14, 0.055, depth + 0.14],
    [0, wallHeight - 0.20, 0], 0.017)
  for (const x of [-width * 0.5 + 0.11, width * 0.5 - 0.11]) {
    for (let row = 0; row < 7; row += 1) {
      const w = row % 2 ? 0.31 : 0.22
      box(shop, materials.trim, [w, 0.20, 0.054], [x, 2.44 + row * 0.226, front + 0.089], 0.018)
    }
  }
  const chimneyX = -width * 0.31
  const chimneyZ = -depth * 0.17
  const chimneyBottom = wallHeight + depth * 0.17
  for (let course = 0; course < 5; course += 1) {
    const size = course % 2 ? 0.48 : 0.46
    box(roof, materials.chimney, [size, 0.124, 0.39],
      [chimneyX, chimneyBottom + 0.12 * course, chimneyZ], 0.017)
  }
  box(roof, materials.roofRidge, [0.54, 0.10, 0.47],
    [chimneyX, chimneyBottom + 0.62, chimneyZ], 0.028)
  addMesh(roof, new CylinderGeometry(0.097, 0.113, 0.15, 12),
    materials.chimney, chimneyX + 0.10, chimneyBottom + 0.74, chimneyZ)
  addMesh(roof, new CylinderGeometry(0.084, 0.10, 0.12, 12),
    materials.chimney, chimneyX - 0.10, chimneyBottom + 0.72, chimneyZ)
  windowBoxes(shop, width, front, materials)
  stripedAwning(shop, width, front, materials)
}
