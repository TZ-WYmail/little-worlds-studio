import { OrthographicCamera, Vector3 } from 'three'

export function createCamera(world, config) {
  const camera = new OrthographicCamera(-1, 1, 1, -1, 0.1, 150)
  camera.position.set(...config.cameraPosition).normalize().multiplyScalar(40)
  camera.lookAt(0, 2.2, 0)
  camera.updateMatrixWorld()
  world.updateMatrixWorld(true)

  const point = new Vector3()
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  world.traverse((object) => {
    if (!object.isMesh) return
    if (!object.boundingBox) object.computeBoundingBox?.()
    if (!object.geometry.boundingBox) object.geometry.computeBoundingBox()
    const { min, max } = object.boundingBox || object.geometry.boundingBox
    for (const x of [min.x, max.x]) {
      for (const y of [min.y, max.y]) {
        for (const z of [min.z, max.z]) {
          point.set(x, y, z).applyMatrix4(object.matrixWorld).applyMatrix4(camera.matrixWorldInverse)
          minX = Math.min(minX, point.x)
          maxX = Math.max(maxX, point.x)
          minY = Math.min(minY, point.y)
          maxY = Math.max(maxY, point.y)
        }
      }
    }
  })

  return {
    camera,
    resize(width, height) {
      const aspect = width / height
      const centerX = (maxX + minX) / 2
      const centerY = (maxY + minY) / 2
      const halfHeight = config.framingMargin * Math.max((maxY - minY) / 2, (maxX - minX) / (2 * aspect))
      const halfWidth = halfHeight * aspect
      camera.left = centerX - halfWidth
      camera.right = centerX + halfWidth
      camera.top = centerY + halfHeight
      camera.bottom = centerY - halfHeight
      camera.updateProjectionMatrix()
    },
  }
}
