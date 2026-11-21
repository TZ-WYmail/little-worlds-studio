import { ExtrudeGeometry, Group, Shape, TorusGeometry } from 'three'
import { addMesh, box } from '../../world/modeling.js'

function archSector(inner, outer, from, to) {
  const shape = new Shape()
  shape.moveTo(Math.cos(from) * outer, Math.sin(from) * outer)
  shape.absarc(0, 0, outer, from, to, false)
  shape.lineTo(Math.cos(to) * inner, Math.sin(to) * inner)
  shape.absarc(0, 0, inner, to, from, true)
  shape.closePath()
  return new ExtrudeGeometry(shape, { depth: 0.048, bevelEnabled: true,
    bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1, curveSegments: 11 })
}

function shutter(parent, materials, x, y, z) {
  box(parent, materials.sageCloth, [0.20, 0.86, 0.063], [x, y, z], 0.017)
  for (let slat = 0; slat < 7; slat += 1) {
    const leaf = box(parent, materials.shutterTrim, [0.144, 0.038, 0.035], [x, y - 0.33 + slat * 0.11, z + 0.035], 0.009)
    leaf.rotation.x = 0.28
  }
}

export function addEuropeanFacade(shell, { width, depth }, materials) {
  const front = depth / 2
  const archZ = front + 0.192
  const radius = Math.min(0.73, width * 0.135)
  for (let index = 0; index < 9; index += 1) {
    const start = index * Math.PI / 9 + 0.013
    const end = (index + 1) * Math.PI / 9 - 0.013
    addMesh(shell, archSector(radius - 0.072, radius + (index === 4 ? 0.046 : 0.009), start, end),
      materials.trim, 0, 1.12, archZ)
  }

  for (const side of [-1, 1]) {
    box(shell, materials.trim, [0.099, 0.96, 0.077],
      [side * (radius - 0.029), 0.643, archZ + 0.012], 0.017)
    box(shell, materials.trim, [0.151, 0.085, 0.128],
      [side * (radius - 0.029), 0.191, archZ + 0.013], 0.017)
  }

  const ornament = new TorusGeometry(0.073, 0.009, 6, 18)
  for (const x of [-0.41, -0.205, 0, 0.205, 0.41]) {
    const scroll = addMesh(shell, ornament, materials.iron, x, 2.79, front + 0.59)
    scroll.scale.set(0.88, 1.4, 1)
    box(shell, materials.brass, [0.026, 0.038, 0.023], [x, 2.895, front + 0.59], 0.009)
  }
  for (const x of [-0.57, 0.57]) {
    box(shell, materials.trim, [0.13, 0.20, 0.29], [x, 2.41, front + 0.139], 0.036).rotation.x = -0.32
  }
  for (const bay of [-width * 0.3, width * 0.3]) {
    for (const side of [-1, 1]) shutter(shell, materials, bay + side * (width * 0.075 + 0.125), 3.34, front + 0.087)
  }
}

export function createDormer({ width, depth, wallHeight }, materials) {
  const dormer = new Group()
  // Seat the dormer on the front slope so it follows the lifted roof assembly.
  dormer.position.set(width * 0.23, wallHeight + depth * 0.14, depth * 0.34)
  box(dormer, materials.plaster, [0.90, 0.61, 0.74], [0, 0.15, -0.10], 0.028)
  box(dormer, materials.trim, [0.77, 0.54, 0.105], [0, 0.19, 0.31], 0.052)
  const window = new Shape()
  window.moveTo(-0.23, -0.17)
  window.lineTo(0.23, -0.17)
  window.lineTo(0.23, 0.023)
  window.absarc(0, 0.023, 0.23, 0, Math.PI, false)
  window.closePath()
  addMesh(dormer, new ExtrudeGeometry(window, { depth: 0.023, bevelEnabled: false }),
    materials.upperGlass, 0, 0.19, 0.369)
  box(dormer, materials.wood, [0.041, 0.38, 0.034], [0, 0.208, 0.41], 0.01)
  box(dormer, materials.wood, [0.465, 0.035, 0.034], [0, 0.211, 0.41], 0.01)
  box(dormer, materials.trim, [0.85, 0.073, 0.20], [0, -0.095, 0.33], 0.022)
  for (const side of [-1, 1]) {
    const pitch = box(dormer, materials.roofRidge, [0.64, 0.093, 0.89],
      [side * 0.244, 0.50, -0.08], 0.026)
    pitch.rotation.z = -side * 0.57
  }
  box(dormer, materials.brass, [0.065, 0.067, 0.91], [0, 0.68, -0.08], 0.023)
  return dormer
}
