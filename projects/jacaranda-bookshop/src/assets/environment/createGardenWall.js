import { Color, Group, InstancedMesh, Object3D, SphereGeometry } from 'three'
import { seededRandom } from '../../utils/seededRandom.js'
import { box } from '../../world/modeling.js'

export function createGardenWall(materials) {
  const wall = new Group()
  wall.name = '后院矮墙与花圃'
  box(wall, materials.earth, [3.80, 0.16, 0.64], [-4.65, 0.091, -4.24], 0.064)
  box(wall, materials.wallStone, [3.90, 0.28, 0.20], [-4.65, 0.15, -4.69], 0.039)
  box(wall, materials.wallStone, [0.20, 0.28, 2.39], [-6.57, 0.15, -3.57], 0.039)
  for (let index = 0; index < 10; index += 1) {
    box(wall, materials.pavingWarm, [0.366, 0.089, 0.27], [-6.35 + 0.376 * index, 0.33, -4.69], 0.022)
  }
  for (let index = 0; index < 6; index += 1) {
    box(wall, materials.pavingWarm, [0.27, 0.084, 0.34], [-6.57, 0.33, -4.40 + 0.35 * index], 0.020)
  }

  const patches = 15
  const perPatch = 17
  const green = new InstancedMesh(new SphereGeometry(1, 7, 4), materials.bedLeaves, patches * perPatch)
  const buds = new InstancedMesh(new SphereGeometry(1, 7, 5), materials.tiles, patches * 9)
  const random = seededRandom(60229)
  const pose = new Object3D()
  const shade = new Color()
  let leafIndex = 0
  let budIndex = 0
  for (let patch = 0; patch < patches; patch += 1) {
    const beside = patch > 10
    const x = beside ? -6.38 + random() * 0.12 : -6.26 + patch * 0.33
    const z = beside ? -4.13 + (patch - 11) * 0.32 : -4.28 + random() * 0.18
    for (let leaf = 0; leaf < perPatch; leaf += 1) {
      const bearing = random() * Math.PI * 2
      const radius = Math.sqrt(random()) * 0.21
      pose.position.set(x + Math.cos(bearing) * radius, 0.16 + random() * 0.26 - radius * 0.33,
        z + Math.sin(bearing) * radius)
      pose.rotation.set(Math.sin(bearing) * 0.77, bearing, -Math.cos(bearing) * 0.82)
      pose.scale.set(0.025 + random() * 0.043, 0.068 + random() * 0.091, 0.028 + random() * 0.018)
      pose.updateMatrix()
      green.setMatrixAt(leafIndex, pose.matrix)
      green.setColorAt(leafIndex, shade.setHSL(0.235 + random() * 0.055, 0.23 + random() * 0.18, 0.24 + random() * 0.15))
      leafIndex += 1
    }
    for (let bud = 0; bud < 9; bud += 1) {
      pose.position.set(x + (random() - 0.5) * 0.30, 0.31 + random() * 0.18, z + (random() - 0.5) * 0.31)
      pose.rotation.set(0, random() * Math.PI, (random() - 0.5) * 0.7)
      pose.scale.set(0.021 + random() * 0.014, 0.033 + random() * 0.03, 0.019 + random() * 0.015)
      pose.updateMatrix()
      buds.setMatrixAt(budIndex, pose.matrix)
      buds.setColorAt(budIndex, shade.set(patch % 3 ? '#ac7d91' : '#b9a6bd'))
      budIndex += 1
    }
  }
  green.receiveShadow = buds.receiveShadow = true
  wall.add(green, buds)
  return wall
}
