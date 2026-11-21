import { BoxGeometry, CylinderGeometry, Mesh, Quaternion, Vector3 } from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'

const up = new Vector3(0, 1, 0)

export function addMesh(group, geometry, material, x = 0, y = 0, z = 0) {
  const mesh = new Mesh(geometry, material)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)
  return mesh
}

export function box(group, material, size, position, radius = 0) {
  const geometry = radius
    ? new RoundedBoxGeometry(...size, 2, radius)
    : new BoxGeometry(...size)
  return addMesh(group, geometry, material, ...position)
}

export function rod(group, material, start, end, bottomRadius, topRadius = bottomRadius) {
  const direction = new Vector3().subVectors(end, start)
  const midpoint = new Vector3().addVectors(start, end).multiplyScalar(0.5)
  const geometry = new CylinderGeometry(topRadius, bottomRadius, direction.length(), 8)
  const mesh = addMesh(group, geometry, material, ...midpoint)
  mesh.quaternion.copy(new Quaternion().setFromUnitVectors(up, direction.normalize()))
  return mesh
}
