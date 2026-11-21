import { Color, DoubleSide, MeshStandardMaterial } from 'three'
import { createCurtainLightMap, createWindowMap } from './createWindowMap.js'
import { createSurfaceGrain } from './createSurfaceGrain.js'

export function createMaterials() {
  const colors = {
    base: '#6f5c60', edge: '#a88f80', lane: '#938884', pavement: '#b1a895',
    plaster: '#e9d6bb', roof: '#69546b', tiles: '#ffffff', roofRidge: '#694e50', trim: '#dfcdb2', wood: '#92745c',
    shutterTrim: '#799182', windowBox: '#70504d', flowerBox: '#d098a1', treeRim: '#b9a18f', wallStone: '#888080', chimney: '#937172', bedLeaves: '#fff9ed', detail: '#938980', pavingWarm: '#b7a38a', clay: '#a46c55',
    earth: '#54473b', sage: '#819073', bike: '#536b5a', iron: '#494241', brass: '#d8a961',
  }
  const materials = Object.fromEntries(Object.entries(colors).map(([name, color]) => [
    name, new MeshStandardMaterial({ color, roughness: 0.85 }),
  ]))
  materials.plaster.map = createSurfaceGrain(161, 18)
  materials.wood.map = createSurfaceGrain(197, 37, true)
  materials.streetStones = new MeshStandardMaterial({ roughness: 0.69, map: createSurfaceGrain(13, 31) })
  materials.roofTone = new Color('#705d72')
  materials.glass = new MeshStandardMaterial({
    color: '#d7e4ff', map: createWindowMap(), roughness: 0.22, transparent: true, depthWrite: false,
  })
  const curtain = createCurtainLightMap()
  materials.upperGlass = new MeshStandardMaterial({
    color: '#9c6744', emissive: '#ffcc90', map: curtain, emissiveMap: curtain, emissiveIntensity: 0, roughness: 0.46,
  })
  materials.creamCloth = new MeshStandardMaterial({ color: '#e2c7a0', roughness: 0.96, side: DoubleSide })
  materials.sageCloth = new MeshStandardMaterial({ color: '#536a60', roughness: 0.96, side: DoubleSide })
  materials.streetLantern = new MeshStandardMaterial({
    color: '#617587', emissive: '#ffcf98', emissiveIntensity: 0, roughness: 0.48,
  })
  materials.interiorBulb = new MeshStandardMaterial({
    color: '#d7cbb4', emissive: '#ffd8a5', emissiveIntensity: 0, roughness: 0.44,
  })
  materials.lampShade = new MeshStandardMaterial({
    color: '#e6b978', emissive: '#e6b978', emissiveIntensity: 0, roughness: 0.74,
  })
  return materials
}
