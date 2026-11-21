import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, InstancedMesh, MeshStandardMaterial, Object3D } from 'three'

export function bellGeometry() {
  const positions = []
  const colors = []
  const indices = []
  const sides = 10
  const rings = [[0.17, 0, 0.73], [0.27, 0.41, 0.91], [0.57, 0.77, 1.27], [1, 1, 1]]
  for (let ring = 0; ring < rings.length; ring += 1) {
    const [radius, height, tone] = rings[ring]
    for (let side = 0; side < sides; side += 1) {
      const angle = side * Math.PI * 2 / sides
      const petal = ring === 3 && side % 2 === 1
      const spread = radius * (petal ? 0.70 : 1)
      positions.push(Math.cos(angle) * spread, height + (petal ? 0.16 : 0), Math.sin(angle) * spread)
      colors.push(tone, tone, tone)
      if (ring === rings.length - 1) continue
      const a = ring * sides + side
      const b = ring * sides + (side + 1) % sides
      indices.push(a, a + sides, b, b, a + sides, b + sides)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export function createFlowers(tips, { flowerDensity, flowerColor, crownWidth }, random) {
  const density = Math.max(0, Math.round(18 * flowerDensity))
  const flowers = new InstancedMesh(bellGeometry(), new MeshStandardMaterial({
    roughness: 0.77, side: DoubleSide, vertexColors: true, emissive: '#653e89', emissiveIntensity: 0.14,
  }), tips.length * density)
  flowers.castShadow = true
  flowers.receiveShadow = true
  const pose = new Object3D()
  const lavender = new Color(flowerColor)
  const violet = new Color('#7763ae')
  const pale = new Color('#e4c9ef')
  const shade = new Color()
  const scale = crownWidth / 4
  let index = 0
  tips.forEach((tip) => {
    const clusterScale = (0.68 + random() * 0.59) * scale
    shade.copy(violet).lerp(lavender, 0.33 + random() * 0.62)
    const tilt = random() * Math.PI * 2
    for (let bloom = 0; bloom < density; bloom += 1) {
      const t = (bloom + 0.5) / density
      const radius = (0.095 + 0.19 * Math.sin(t * Math.PI)) * clusterScale
      const azimuth = tilt + bloom * 2.39996
      pose.position.set(tip.x + radius * Math.cos(azimuth), tip.y + t * 0.54 * clusterScale,
        tip.z + radius * Math.sin(azimuth))
      const petal = (0.042 + random() * 0.042) * clusterScale * (1 - t * 0.30)
      pose.scale.set(petal, petal * (1.6 + random() * 0.58), petal)
      pose.rotation.set(Math.cos(azimuth) * 1.23, azimuth, Math.sin(azimuth) * 1.21)
      pose.updateMatrix()
      flowers.setMatrixAt(index, pose.matrix)
      flowers.setColorAt(index, shade.clone().lerp(pale, random() * 0.59))
      index += 1
    }
  })
  return flowers
}
