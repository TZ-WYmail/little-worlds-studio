import { Group, Mesh, MeshStandardMaterial } from 'three'
import { seededRandom } from '../../utils/seededRandom.js'
import { createBranches } from './createBranches.js'
import { createFlowers } from './createFlowers.js'
import { createLeaves } from './createLeaves.js'

export function createJacarandaTree({
  height = 6, crownWidth = 4, branchCount = 9, flowerDensity = 1,
  flowerColor = '#b69bd6', seed = 1234, lean = 0.18, spread = 1,
} = {}) {
  const random = seededRandom(seed)
  const tree = new Group()
  tree.name = '蓝花楹'
  const { geometry, terminals, fronds } = createBranches({ height, crownWidth, branchCount, lean, spread }, random)
  const branches = new Mesh(geometry, new MeshStandardMaterial({
    color: '#896b56', roughness: 0.92, vertexColors: true,
  }))
  branches.castShadow = true
  branches.receiveShadow = true
  tree.add(branches, createLeaves(fronds, random))
  if (flowerDensity > 0) tree.add(createFlowers(terminals, { flowerDensity, flowerColor, crownWidth }, random))
  return tree
}
