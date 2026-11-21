import {
  Color, DoubleSide, Group, InstancedMesh, MeshStandardMaterial, Object3D,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { bellGeometry } from '../vegetation/createFlowers.js'
import { seededRandom } from '../../utils/seededRandom.js'
import { createGardenWall } from './createGardenWall.js'
import { createTreeGarden } from './createTreeGarden.js'
import { box } from '../../world/modeling.js'

function pavers(group, random, materials) {
  const stones = []
  for (let row = 0; row < 11; row += 1) {
    const z = -4.5 + row * 0.645
    for (let col = 0; col < 19; col += 1) {
      const x = -6.5 + col * 0.705 + (row % 2) * 0.32
      const width = Math.min(0.69, (6.85 - x) * 2)
      if (width > 0.10) stones.push({ x, z, w: width, d: 0.622, tone: '#afa498' })
    }
  }
  for (let row = 0; row < 5; row += 1) {
    const z = 2.57 + row * 0.49
    for (let col = 0; col < 22; col += 1) {
      const x = -6.55 + col * 0.62 + (row % 2) * 0.25
      const width = Math.min(0.60, (6.85 - x) * 2)
      if (width > 0.10) stones.push({ x, z, w: width, d: 0.467, tone: '#827d7f' })
    }
  }
  const mesh = new InstancedMesh(new RoundedBoxGeometry(1, 1, 1, 1, 0.11),
    materials.streetStones, stones.length)
  const pose = new Object3D()
  const tone = new Color()
  stones.forEach(({ x, z, w, d, tone: hue }, index) => {
    pose.position.set(x, z > 2.4 ? -0.034 : -0.008, z)
    pose.rotation.y = (random() - 0.5) * 0.018
    pose.scale.set(w, 0.053 + random() * 0.012, d)
    pose.updateMatrix()
    mesh.setMatrixAt(index, pose.matrix)
    mesh.setColorAt(index, tone.set(hue).multiplyScalar(0.82 + random() * 0.27))
  })
  mesh.receiveShadow = true
  group.add(mesh)
}

function fallenFlowers(group, trees, random) {
  const scatter = new InstancedMesh(bellGeometry(), new MeshStandardMaterial({
    color: '#b496d6', roughness: 0.92, vertexColors: true, side: DoubleSide,
  }), trees.length * 86)
  const pose = new Object3D()
  const color = new Color()
  let index = 0
  for (const tree of trees) {
    const [centerX, , centerZ] = tree.position
    for (let petal = 0; petal < 86; petal += 1) {
      const angle = random() * 2 * Math.PI
      const radius = Math.sqrt(random()) * tree.crownWidth * 0.37 + 0.10
      const x = Math.max(-6.72, Math.min(6.72, centerX + Math.cos(angle) * radius))
      const z = Math.max(-4.68, Math.min(4.73, centerZ + Math.sin(angle) * radius * 0.83))
      pose.position.set(x, z > 2.4 ? 0.015 : 0.045, z)
      pose.rotation.set((random() - 0.5) * 0.22, angle, random() > 0.5 ? 1.43 : -1.53)
      pose.scale.setScalar(0.022 + random() * 0.035)
      pose.updateMatrix()
      scatter.setMatrixAt(index, pose.matrix)
      scatter.setColorAt(index, color.setRGB(0.78 + random() * 0.22, 0.72 + random() * 0.17, 0.93))
      index += 1
    }
  }
  scatter.receiveShadow = true
  group.add(scatter)
}

export function createStreet(materials, trees) {
  const street = new Group()
  street.name = '石板街'
  const random = seededRandom(2784)
  pavers(street, random, materials)
  for (let block = 0; block < 21; block += 1) {
    box(street, materials.pavingWarm, [0.618, 0.12, 0.22],
      [-6.48 + block * 0.645, 0.002, 2.32], 0.025)
  }
  street.add(createGardenWall(materials))
  street.add(createTreeGarden(trees, materials, random))
  fallenFlowers(street, trees, random)
  return street
}
