import { Group } from 'three'
import { box } from './modeling.js'

export function createBase(materials) {
  const base = new Group()
  base.name = '微缩底座'
  box(base, materials.base, [14, 0.66, 10], [0, -0.66, 0], 0.18)
  box(base, materials.edge, [13.84, 0.18, 9.84], [0, -0.27, 0], 0.08)
  box(base, materials.lane, [13.7, 0.14, 2.63], [0, -0.10, 3.54], 0.055)
  box(base, materials.pavement, [13.7, 0.19, 7.14], [0, -0.095, -1.25], 0.055)
  return base
}
