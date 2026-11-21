import {
  CanvasTexture, CylinderGeometry, Group, MeshStandardMaterial, PointLight, SphereGeometry,
  SRGBColorSpace, TorusGeometry, Vector3,
} from 'three'
import { addLanternHalo, createLampBeam, spot } from '../../world/lightingEffects.js'
import { addMesh, box, rod } from '../../world/modeling.js'

function bench(group, materials) {
  const seat = new Group()
  seat.position.set(-2.75, 0.038, 0.93)
  seat.rotation.y = -0.22
  group.add(seat)
  for (const x of [-0.61, 0.61]) {
    for (const z of [-0.18, 0.18]) {
      box(seat, materials.iron, [0.061, 0.40, 0.057], [x, 0.20, z], 0.015)
    }
    box(seat, materials.iron, [0.058, 0.43, 0.056], [x, 0.60, -0.19], 0.015)
  }
  for (const z of [-0.19, -0.063, 0.063, 0.19]) {
    box(seat, materials.wood, [1.55, 0.06, 0.106], [0, 0.43, z], 0.023)
  }
  for (const y of [0.64, 0.77]) {
    box(seat, materials.wood, [1.55, 0.096, 0.062], [0, y, -0.155], 0.022)
  }
}

function lamp(group, materials) {
  const light = new Group()
  light.position.set(4.75, 0.027, 1.97)
  group.add(light)
  addMesh(light, new CylinderGeometry(0.16, 0.22, 0.15, 12), materials.iron, 0, 0.075, 0)
  addMesh(light, new CylinderGeometry(0.065, 0.102, 0.33, 12), materials.iron, 0, 0.225, 0)
  addMesh(light, new CylinderGeometry(0.039, 0.058, 1.99, 10), materials.iron, 0, 1.25, 0)
  const glazing = addMesh(light, new CylinderGeometry(0.19, 0.095, 0.39, 6),
    materials.streetLantern, 0, 2.40, 0)
  glazing.castShadow = false
  glazing.receiveShadow = false
  const halo = addLanternHalo(light, [0, 2.42, 0], 1.97, 0.47)
  const beam = createLampBeam(light)
  const pool = spot(light, {
    color: '#ffd296', intensity: 64, range: 6.0, angle: 0.77, softEdge: 0.79,
    source: [0, 2.34, 0], target: [-0.19, 0, 0.32],
  })
  pool.castShadow = true
  pool.shadow.autoUpdate = false
  pool.shadow.needsUpdate = true
  pool.shadow.mapSize.set(512, 512)
  pool.shadow.camera.near = 0.24
  pool.shadow.camera.far = 6.0
  pool.shadow.radius = 2.45
  pool.shadow.intensity = 0.84
  pool.shadow.normalBias = 0.013
  for (let corner = 0; corner < 6; corner += 1) {
    const angle = corner * Math.PI / 3 + Math.PI / 2
    const point = (radius, y) => new Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
    rod(light, materials.iron, point(0.096, 2.19), point(0.193, 2.594), 0.012)
  }
  addMesh(light, new CylinderGeometry(0.048, 0.262, 0.15, 6), materials.iron, 0, 2.665, 0)
  addMesh(light, new SphereGeometry(0.055, 10, 7), materials.brass, 0, 2.758, 0)

  const scatter = new PointLight('#ffcc9c', 0, 3.55, 2)
  scatter.position.set(-0.06, 2.42, -0.025)
  light.add(scatter)

  return (power, rain, camera) => {
    const energy = power * (0.89 + rain * 0.11)
    pool.visible = scatter.visible = halo.visible = beam.visible = energy > 0
    pool.intensity = 105 * energy
    scatter.intensity = 3.55 * energy
    glazing.material.emissiveIntensity = 2.2 * energy
    halo.material.opacity = energy * (0.56 + rain * 0.10)
    beam.material.uniforms.intensity.value = energy * (0.074 + rain * 0.15)
    beam.rotation.y = Math.atan2(camera.position.x - light.position.x, camera.position.z - light.position.z)
    // Bias the optical halo toward the camera so the solid panes cannot hide its source.
    halo.position.x = Math.sin(beam.rotation.y) * 0.17
    halo.position.z = Math.cos(beam.rotation.y) * 0.17
  }
}

function bicycle(group, materials) {
  const bike = new Group()
  bike.position.set(2.92, 0.035, 1.54)
  bike.rotation.set(0.07, -0.18, 0)
  group.add(bike)
  const rear = new Vector3(-0.48, 0.31, 0)
  const front = new Vector3(0.53, 0.31, 0)
  const crank = new Vector3(-0.08, 0.34, 0)
  const seat = new Vector3(-0.24, 0.76, 0)
  const stem = new Vector3(0.37, 0.74, 0)
  const tire = new TorusGeometry(0.286, 0.026, 8, 32)
  const rim = new TorusGeometry(0.257, 0.011, 6, 32)
  for (const center of [rear, front]) {
    addMesh(bike, tire, materials.iron, ...center)
    addMesh(bike, rim, materials.brass, ...center)
    addMesh(bike, new SphereGeometry(0.029, 10, 6), materials.iron, ...center)
    for (let spoke = 0; spoke < 9; spoke += 1) {
      const angle = spoke * Math.PI / 4.5
      rod(bike, materials.brass, center,
        center.clone().add(new Vector3(Math.cos(angle) * 0.252, Math.sin(angle) * 0.252, 0)), 0.0038)
    }
  }
  const frame = [[rear, seat], [rear, crank], [seat, crank], [crank, stem], [seat, stem], [stem, front]]
  for (const [start, end] of frame) rod(bike, materials.bike, start, end, 0.022)
  rod(bike, materials.iron, stem, new Vector3(0.31, 0.91, 0), 0.014)
  box(bike, materials.iron, [0.17, 0.045, 0.075], [-0.25, 0.79, 0], 0.02)
  box(bike, materials.iron, [0.041, 0.032, 0.24], [0.31, 0.91, 0], 0.012)
  box(bike, materials.wood, [0.17, 0.13, 0.16], [0.48, 0.77, 0], 0.024)
  rod(bike, materials.iron, crank, new Vector3(0.045, 0.23, 0), 0.009)
  box(bike, materials.iron, [0.075, 0.024, 0.14], [0.045, 0.23, 0], 0.009)
}

function planters(group, materials) {
  const leafShape = new SphereGeometry(1, 8, 5)
  for (const [x, z, size] of [[-1.20, 0.79, 0.20], [3.79, 0.93, 0.22], [5.78, -2.12, 0.245]]) {
    const h = size * 1.55
    addMesh(group, new CylinderGeometry(size, size * 0.77, h, 14), materials.clay, x, h / 2 + 0.028, z)
    addMesh(group, new CylinderGeometry(size * 1.06, size * 1.06, 0.055, 14), materials.clay, x, h + 0.028, z)
    addMesh(group, new CylinderGeometry(size * 0.84, size * 0.84, 0.016, 14), materials.earth, x, h + 0.06, z)
    for (let leaf = 0; leaf < 9; leaf += 1) {
      const angle = leaf * 2.39
      const r = size * (0.39 + leaf * 0.021)
      const frond = addMesh(group, leafShape, materials.sage, x + Math.cos(angle) * r,
        h + 0.155 + Math.sin(leaf * 1.4) * 0.04, z + Math.sin(angle) * r)
      frond.scale.set(0.058, 0.154, 0.047)
      frond.rotation.set(Math.sin(angle) * 0.83, angle, -Math.cos(angle) * 0.76)
    }
  }
}

function streetSign(group, materials) {
  const board = new Group()
  board.position.set(-0.60, 0.04, 1.65)
  board.rotation.y = 0.27
  group.add(board)
  const paper = document.createElement('canvas')
  paper.width = 144
  paper.height = 200
  const pen = paper.getContext('2d')
  pen.fillStyle = '#414337'
  pen.fillRect(0, 0, 144, 200)
  pen.fillStyle = '#ebdbbd'
  pen.textAlign = 'center'
  pen.font = '21px Georgia, serif'
  pen.fillText('OPEN', 72, 57)
  pen.font = '17px Georgia, serif'
  pen.fillText('New books', 72, 106)
  pen.fillText('this spring', 72, 132)
  const map = new CanvasTexture(paper)
  map.colorSpace = SRGBColorSpace
  const chalk = new MeshStandardMaterial({ map, roughness: 0.93 })
  for (const side of [-1, 1]) {
    const legs = box(board, materials.wood, [0.40, 0.61, 0.038], [0, 0.306, side * 0.074], 0.014)
    legs.rotation.x = side * -0.22
    if (side > 0) {
      const face = box(board, chalk, [0.33, 0.46, 0.01], [0, 0.34, 0.09])
      face.rotation.x = -0.22
    }
  }
}

export function createStreetProps(materials) {
  const props = new Group()
  props.name = '街道道具'
  bench(props, materials)
  const updateLamp = lamp(props, materials)
  bicycle(props, materials)
  planters(props, materials)
  streetSign(props, materials)
  addMesh(props, new CylinderGeometry(0.15, 0.135, 0.37, 12), materials.sage, 5.45, 0.21, 1.58)
  addMesh(props, new CylinderGeometry(0.158, 0.158, 0.054, 12), materials.iron, 5.45, 0.41, 1.58)
  return { props, updateLamp }
}
