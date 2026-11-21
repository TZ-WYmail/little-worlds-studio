import { CatmullRomCurve3, CylinderGeometry, Group, SphereGeometry, TubeGeometry, Vector3 } from 'three'
import { addLanternHalo, spot } from '../../world/lightingEffects.js'
import { addMesh, box, rod } from '../../world/modeling.js'

function addRearLantern(back, materials, doorX) {
  const lantern = new Group()
  lantern.name = '后门壁灯'
  lantern.position.set(doorX - 0.84, 1.92, 0)
  back.add(lantern)
  box(lantern, materials.iron, [0.115, 0.29, 0.057], [0, 0.055, 0.012], 0.024)
  const arm = new CatmullRomCurve3([
    new Vector3(0, 0.05, 0.034), new Vector3(0, 0.155, 0.105),
    new Vector3(0, 0.157, 0.195), new Vector3(0, 0.092, 0.24),
  ])
  addMesh(lantern, new TubeGeometry(arm, 12, 0.018, 6, false), materials.iron)
  addMesh(lantern, new SphereGeometry(0.034, 10, 7), materials.brass, 0, 0.087, 0.24)
  addMesh(lantern, new CylinderGeometry(0.042, 0.143, 0.085, 6), materials.iron, 0, 0.049, 0.24)

  const glazing = materials.streetLantern.clone()
  glazing.color.set('#6a7279')
  glazing.emissive.set('#ffdcaa')
  const glass = addMesh(lantern, new CylinderGeometry(0.103, 0.073, 0.195, 6),
    glazing, 0, -0.087, 0.24)
  glass.castShadow = false
  glass.receiveShadow = false
  for (let corner = 0; corner < 6; corner += 1) {
    const angle = corner * Math.PI / 3
    rod(lantern, materials.iron,
      new Vector3(Math.sin(angle) * 0.074, -0.186, 0.24 + Math.cos(angle) * 0.074),
      new Vector3(Math.sin(angle) * 0.106, 0.008, 0.24 + Math.cos(angle) * 0.106),
      0.008)
  }
  addMesh(lantern, new CylinderGeometry(0.088, 0.058, 0.035, 6), materials.brass, 0, -0.195, 0.24)

  const halo = addLanternHalo(lantern, [0, -0.079, 0.34], 0.56, 0)
  const pool = spot(lantern, {
    color: '#ffd19a', intensity: 0, range: 3.0, angle: 0.57, softEdge: 0.82,
    source: [0, -0.218, 0.245], target: [0.29, -1.88, 0.31],
  })
  pool.castShadow = true
  pool.shadow.autoUpdate = false
  pool.shadow.needsUpdate = true
  pool.shadow.mapSize.set(256, 256)
  pool.shadow.camera.near = 0.12
  pool.shadow.camera.far = 3.0
  pool.shadow.normalBias = 0.009
  pool.shadow.radius = 2

  return (power) => {
    pool.visible = halo.visible = power > 0
    pool.intensity = 22 * power
    halo.material.opacity = 0.33 * power
    glazing.emissiveIntensity = 1.55 * power
  }
}

export function createRearDetails({ width, depth, wallHeight }, materials) {
  const group = new Group()
  group.name = '后巷店门与侧墙排水'
  const rear = -depth / 2
  const left = -width / 2
  const back = new Group()
  back.position.z = rear - 0.09
  back.rotation.y = Math.PI
  group.add(back)

  const doorX = width * 0.23
  for (const side of [-1, 1]) {
    box(back, materials.trim, [0.13, 1.84, 0.12], [doorX + side * 0.495, 0.99, 0.024], 0.026)
    box(back, materials.sageCloth, [0.14, 0.49, 0.13], [doorX + side * 0.39, 1.40, 0.088], 0.02)
  }
  box(back, materials.sageCloth, [0.92, 1.10, 0.13], [doorX, 0.64, 0.088], 0.027)
  box(back, materials.sageCloth, [0.92, 0.20, 0.13], [doorX, 1.71, 0.088], 0.023)
  for (const offset of [-0.25, 0, 0.25]) {
    box(back, materials.wood, [0.02, 0.84, 0.019], [doorX + offset, 0.56, 0.156], 0.005)
  }
  for (const y of [1.177, 1.623]) {
    box(back, materials.wood, [0.72, 0.041, 0.045], [doorX, y, 0.161], 0.009)
  }
  const glass = box(back, materials.glass, [0.64, 0.41, 0.020], [doorX, 1.40, 0.175], 0.010)
  glass.castShadow = false
  box(back, materials.wood, [0.038, 0.45, 0.033], [doorX, 1.40, 0.194], 0.008)
  box(back, materials.brass, [0.043, 0.124, 0.041], [doorX + 0.34, 1.02, 0.173], 0.008)
  box(back, materials.pavingWarm, [1.29, 0.13, 0.39], [doorX, 0.085, 0.18], 0.033)
  box(back, materials.trim, [1.41, 0.094, 0.44], [doorX, 1.995, 0.17], 0.026)
  const updateRearLantern = addRearLantern(back, materials, doorX)

  for (const x of [-width * 0.27, width * 0.27]) {
    box(back, materials.trim, [0.86, 0.87, 0.10], [x, 3.26, 0.021], 0.041)
    box(back, materials.wood, [0.72, 0.73, 0.046], [x, 3.26, 0.073], 0.017)
    box(back, materials.upperGlass, [0.61, 0.62, 0.021], [x, 3.26, 0.107], 0.006)
    box(back, materials.wood, [0.035, 0.68, 0.042], [x, 3.26, 0.133], 0.007)
    box(back, materials.wood, [0.63, 0.035, 0.042], [x, 3.40, 0.133], 0.007)
    box(back, materials.trim, [0.94, 0.080, 0.19], [x, 2.83, 0.085], 0.019)
  }

  const parcelX = -width * 0.30
  for (const [dx, dy, w, h] of [[0, 0.22, 0.65, 0.40], [-0.03, 0.54, 0.52, 0.27], [0.61, 0.18, 0.48, 0.32]]) {
    box(back, materials.wood, [w, h, 0.36], [parcelX + dx, dy, 0.42], 0.023)
    for (const edge of [-1, 1]) {
      box(back, materials.detail, [0.054, h + 0.012, 0.042],
        [parcelX + dx + edge * (w / 2 - 0.065), dy, 0.59], 0.007)
    }
  }

  const pipeZ = rear + 0.26
  rod(group, materials.iron, new Vector3(left - 0.13, 0.31, pipeZ),
    new Vector3(left - 0.13, wallHeight - 0.24, pipeZ), 0.035)
  rod(group, materials.iron, new Vector3(left - 0.13, 0.31, pipeZ),
    new Vector3(left - 0.24, 0.19, pipeZ), 0.035)
  for (const y of [0.76, 2.02, 3.25]) {
    addMesh(group, new CylinderGeometry(0.045, 0.045, 0.055, 10), materials.brass, left - 0.13, y, pipeZ)
  }
  for (const side of [-1, 1]) {
    const edgeZ = side * (depth / 2 + 0.20)
    rod(group, materials.iron, new Vector3(left - 0.24, wallHeight + 0.09, edgeZ),
      new Vector3(-left + 0.24, wallHeight + 0.09, edgeZ), 0.034)
  }

  const side = new Group()
  side.position.set(left - 0.093, 0, depth * 0.17)
  side.rotation.y = -Math.PI / 2
  group.add(side)
  for (const y of [3.25]) {
    box(side, materials.trim, [0.99, 0.90, 0.12], [0, y, 0], 0.036)
    box(side, materials.wood, [0.84, 0.75, 0.04], [0, y, 0.073], 0.016)
    box(side, materials.upperGlass, [0.71, 0.62, 0.025], [0, y, 0.103], 0.009)
    box(side, materials.wood, [0.041, 0.68, 0.040], [0, y, 0.125], 0.008)
    box(side, materials.wood, [0.72, 0.036, 0.040], [0, y + 0.13, 0.125], 0.008)
    box(side, materials.trim, [1.06, 0.074, 0.22], [0, y - 0.47, 0.05], 0.019)
  }
  return { rear: group, updateRearLantern }
}
