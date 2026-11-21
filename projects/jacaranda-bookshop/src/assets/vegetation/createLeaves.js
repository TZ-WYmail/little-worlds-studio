import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, InstancedMesh, MeshStandardMaterial, Object3D } from 'three'

function frondGeometry() {
  const points = []
  const triangles = []
  function leaf(x, y, dx, dy, width) {
    const index = points.length / 3
    points.push(x, y, 0, x + dx * 0.45, y + dy * 0.45, 0.013, x + dx, y + dy, 0,
      x + dx * 0.43 - dy * width, y + dy * 0.43 + dx * width, 0,
      x + dx * 0.43 + dy * width, y + dy * 0.43 - dx * width, 0)
    triangles.push(index, index + 3, index + 1, index + 3, index + 2, index + 1,
      index, index + 1, index + 4, index + 4, index + 1, index + 2)
  }
  leaf(0, 0, 0, 1.03, 0.012)
  for (let row = 0; row < 5; row += 1) {
    const y = 0.16 + row * 0.15
    for (const side of [-1, 1]) {
      const extent = (0.37 - row * 0.048) * side
      leaf(0, y, extent, 0.16, 0.023)
      for (let tip = 0; tip < 3; tip += 1) {
        const t = 0.19 + tip * 0.24
        leaf(extent * t, y + 0.16 * t, side * 0.075, 0.092, 0.23)
        leaf(extent * t, y + 0.16 * t, side * 0.08, -0.04, 0.22)
      }
    }
  }
  leaf(0, 0.94, 0, 0.13, 0.25)
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(points, 3))
  geometry.setIndex(triangles)
  geometry.computeVertexNormals()
  return geometry
}

export function createLeaves(tips, random) {
  const foliage = new InstancedMesh(frondGeometry(), new MeshStandardMaterial({
    roughness: 0.87, side: DoubleSide,
  }), tips.length * 2)
  foliage.receiveShadow = true
  const pose = new Object3D()
  const sage = new Color('#8d9a70')
  const olive = new Color('#4f634a')
  const tone = new Color()
  for (const [index, tip] of tips.entries()) {
    for (let pair = 0; pair < 2; pair += 1) {
      pose.position.copy(tip)
      pose.rotation.set((random() - 0.5) * 2.5, random() * Math.PI * 2, (pair ? 1 : -1) * (0.56 + random()))
      pose.scale.setScalar(0.18 + random() * 0.25)
      pose.updateMatrix()
      foliage.setMatrixAt(index * 2 + pair, pose.matrix)
      foliage.setColorAt(index * 2 + pair, tone.copy(olive).lerp(sage, random()))
    }
  }
  return foliage
}
