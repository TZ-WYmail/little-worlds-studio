import { Color, CylinderGeometry, Group, InstancedMesh, Object3D, SphereGeometry } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { addMesh } from '../../world/modeling.js'

export function createTreeGarden(trees, materials, random) {
  const garden = new Group()
  garden.name = '行道树花坛'
  // Trees outside a paved area can be placed independently by an embedding project.
  const planted = trees.filter(({ position: [x, y, z] }) =>
    y === 0 && Math.abs(x) < 5.7 && z > -3.65 && z < 1.02)
  if (planted.length === 0) return garden

  const rimSegments = 18
  const sprigs = 56
  const rim = new InstancedMesh(new RoundedBoxGeometry(0.31, 0.13, 0.18, 2, 0.023),
    materials.treeRim, planted.length * rimSegments)
  const leaves = new InstancedMesh(new SphereGeometry(1, 7, 4), materials.bedLeaves,
    planted.length * sprigs * 3)
  const pose = new Object3D()
  const shade = new Color()
  const moss = new Color('#75845b')
  const fern = new Color('#a1aa78')
  let stoneIndex = 0
  let leafIndex = 0
  for (const { position: [x, , z] } of planted) {
    addMesh(garden, new CylinderGeometry(0.835, 0.85, 0.079, 32), materials.earth, x, 0.037, z)
    for (let segment = 0; segment < rimSegments; segment += 1) {
      const angle = segment * 2 * Math.PI / rimSegments
      pose.position.set(x + Math.cos(angle) * 0.87, 0.082 + random() * 0.009, z + Math.sin(angle) * 0.87)
      pose.rotation.set(0, Math.PI / 2 - angle, 0)
      pose.scale.set(1, 1, 1)
      pose.updateMatrix()
      rim.setMatrixAt(stoneIndex, pose.matrix)
      rim.setColorAt(stoneIndex, shade.setScalar(0.66 + random() * 0.32))
      stoneIndex += 1
    }
    for (let sprig = 0; sprig < sprigs; sprig += 1) {
      const angle = random() * 2 * Math.PI
      const radius = 0.38 + random() * 0.43
      const sprigX = x + Math.cos(angle) * radius
      const sprigZ = z + Math.sin(angle) * radius
      for (let leaf = 0; leaf < 3; leaf += 1) {
        const bearing = angle + leaf * 2.399
        const length = 0.042 + random() * 0.09
        pose.position.set(sprigX + Math.cos(bearing) * 0.029, 0.104 + length * 0.38, sprigZ + Math.sin(bearing) * 0.03)
        pose.rotation.set(Math.sin(bearing) * 0.63, bearing, Math.cos(bearing) * 0.68)
        pose.scale.set(0.02 + random() * 0.022, length, 0.018)
        pose.updateMatrix()
        leaves.setMatrixAt(leafIndex, pose.matrix)
        leaves.setColorAt(leafIndex, shade.copy(moss).lerp(fern, random()))
        leafIndex += 1
      }
    }
  }
  rim.castShadow = rim.receiveShadow = true
  leaves.receiveShadow = true
  garden.add(rim, leaves)
  return garden
}
