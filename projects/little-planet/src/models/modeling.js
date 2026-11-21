import {
  BoxGeometry, CapsuleGeometry, CatmullRomCurve3, Mesh, MeshStandardMaterial, SphereGeometry, TubeGeometry, Vector3,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const sphere = new SphereGeometry(1, 24, 16)
const up = new Vector3(0, 1, 0)

export const xyz = (coordinates) => new Vector3(...coordinates)
export function material(color, options = {}) {
  return new MeshStandardMaterial({ color, roughness: 0.78, ...options })
}

export function mesh(parent, geometry, surface, x = 0, y = 0, z = 0) {
  const object = new Mesh(geometry, surface)
  object.position.set(x, y, z)
  object.castShadow = true
  object.receiveShadow = true
  parent.add(object)
  return object
}

export function oval(parent, surface, coordinates, scale) {
  const object = mesh(parent, sphere, surface, ...coordinates)
  object.scale.set(...scale)
  return object
}

export function block(parent, surface, dimensions, coordinates, round = 0) {
  const geometry = round ? new RoundedBoxGeometry(...dimensions, 2, round) : new BoxGeometry(...dimensions)
  return mesh(parent, geometry, surface, ...coordinates)
}

export function capsule(parent, surface, a, b, width) {
  const start = xyz(a)
  const end = xyz(b)
  const axis = end.clone().sub(start)
  const middle = start.addScaledVector(axis, 0.5)
  const object = mesh(parent, new CapsuleGeometry(width, axis.length(), 5, 10), surface, ...middle)
  object.quaternion.setFromUnitVectors(up, axis.normalize())
  return object
}

export function sweep(parent, surface, coordinates, radius, segments = 20) {
  return mesh(parent, new TubeGeometry(new CatmullRomCurve3(coordinates.map(xyz)), segments, radius, 7, false), surface)
}
