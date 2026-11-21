import { Group } from 'three'
import { createBookshop } from '../assets/architecture/createBookshop.js'
import { createJacarandaTree } from '../assets/vegetation/createJacaranda.js'
import { createStreet } from '../assets/environment/createStreet.js'
import { createStreetProps } from '../assets/props/createStreetProps.js'
import { createInterior } from '../assets/interior/createInterior.js'
import { createMaterials } from '../materials/createMaterials.js'
import { createBase } from './createBase.js'

export function createWorld(config) {
  const world = new Group()
  const materials = createMaterials()
  const { props, updateLamp } = createStreetProps(materials)
  world.add(createBase(materials), createStreet(materials, config.trees), props)
  const { shop, updateRearLantern } = createBookshop(config.bookshop, materials)
  shop.position.set(...config.bookshop.position)
  const { room, updateInterior } = createInterior(config.bookshop, materials)
  shop.add(room)
  world.add(shop)
  const trees = []
  for (const definition of config.trees) {
    const tree = createJacarandaTree(definition)
    tree.position.set(...definition.position)
    trees.push(tree)
    world.add(tree)
  }
  return {
    world, materials, trees, updateInterior,
    updateLamps(power, rain, camera) {
      updateLamp(power, rain, camera)
      updateRearLantern(power)
    },
  }
}
