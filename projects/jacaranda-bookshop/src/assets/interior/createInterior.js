import {
  BoxGeometry, Color, CylinderGeometry, Group, InstancedMesh,
  MeshStandardMaterial, Object3D, PointLight, SphereGeometry,
} from 'three'
import { seededRandom } from '../../utils/seededRandom.js'
import { addDisplayWindow } from './addDisplayWindow.js'
import { groundGlazing } from '../architecture/groundGlazing.js'
import { spot } from '../../world/lightingEffects.js'
import { addMesh, box } from '../../world/modeling.js'

function shelves(room, width, depth, wood) {
  const rack = new Group()
  rack.position.set(0, 0.16, -depth / 2 + 0.57)
  room.add(rack)
  const compartments = [-width * 0.29, 0, width * 0.29]
  const shelfWidth = width * 0.27
  const volume = new InstancedMesh(new BoxGeometry(1, 1, 1),
    new MeshStandardMaterial({ roughness: 0.94 }), compartments.length * 3 * 12)
  const tones = ['#4c7367', '#a66551', '#777eaa', '#c2a364', '#e6d1a7', '#5d7591'].map((value) => new Color(value))
  const random = seededRandom(483)
  const pose = new Object3D()
  let index = 0
  for (const bay of compartments) {
    for (const side of [-1, 1]) {
      box(rack, wood, [0.07, 1.69, 0.34], [bay + side * shelfWidth / 2, 0.84, 0], 0.014)
    }
    for (let shelf = 0; shelf < 4; shelf += 1) {
      const shelfY = shelf * 0.54
      box(rack, wood, [shelfWidth + 0.045, 0.059, 0.35], [bay, shelfY, 0], 0.012)
      if (shelf === 3) continue
      for (let book = 0; book < 12; book += 1) {
        const height = 0.19 + random() * 0.21
        const pitch = shelfWidth / 13
        pose.position.set(bay + (book - 5.5) * pitch, shelfY + height / 2 + 0.03, 0.126 + random() * 0.038)
        pose.scale.set(pitch * (0.7 + random() * 0.19), height, 0.15 + random() * 0.089)
        pose.updateMatrix()
        volume.setMatrixAt(index, pose.matrix)
        volume.setColorAt(index, tones[Math.floor(random() * tones.length)])
        index += 1
      }
    }
  }
  rack.add(volume)
}

export function createInterior({ width, depth }, materials) {
  const room = new Group()
  room.name = '书店内部'
  shelves(room, width, depth, materials.wood)
  addDisplayWindow(room, { width, depth }, materials)
  const x = width * 0.26
  const z = depth * 0.23
  box(room, materials.wood, [0.88, 0.10, 0.63], [x, 0.75, z], 0.036)
  for (const dx of [-0.34, 0.34]) {
    for (const dz of [-0.22, 0.22]) {
      box(room, materials.wood, [0.067, 0.57, 0.067], [x + dx, 0.425, z + dz], 0.014)
    }
  }
  box(room, materials.pavingWarm, [0.31, 0.045, 0.24], [x + 0.23, 0.823, z - 0.07], 0.01).rotation.y = -0.16
  box(room, materials.detail, [0.32, 0.027, 0.25], [x + 0.23, 0.851, z - 0.07], 0.01).rotation.y = -0.16

  addMesh(room, new CylinderGeometry(0.13, 0.14, 0.043, 16), materials.brass, x - 0.27, 0.825, z)
  addMesh(room, new CylinderGeometry(0.023, 0.032, 0.34, 10), materials.brass, x - 0.27, 0.98, z)
  const shade = addMesh(room, new CylinderGeometry(0.086, 0.20, 0.23, 16), materials.lampShade, x - 0.27, 1.15, z)
  shade.castShadow = false

  const chairZ = z - 0.55
  box(room, materials.wood, [0.39, 0.067, 0.37], [x, 0.45, chairZ], 0.023)
  for (const dx of [-0.145, 0.145]) {
    for (const dz of [-0.141, 0.141]) {
      const h = dz < 0 ? 0.68 : 0.32
      box(room, materials.wood, [0.044, h, 0.044], [x + dx, 0.16 + h / 2, chairZ + dz], 0.009)
    }
  }
  box(room, materials.wood, [0.36, 0.135, 0.061], [x, 0.76, chairZ - 0.141], 0.021)

  const counterX = -width * 0.32
  box(room, materials.wood, [0.77, 0.86, 0.48], [counterX, 0.59, -0.38], 0.04)
  box(room, materials.trim, [0.86, 0.068, 0.56], [counterX, 1.045, -0.38], 0.026)
  addMesh(room, new CylinderGeometry(0.10, 0.075, 0.14, 11), materials.clay, counterX, 1.146, -0.38)
  for (let leaf = 0; leaf < 6; leaf += 1) {
    const angle = leaf * Math.PI / 3
    const frond = addMesh(room, new SphereGeometry(1, 8, 5), materials.sage,
      counterX + Math.cos(angle) * 0.07, 1.27, -0.38 + Math.sin(angle) * 0.07)
    frond.scale.set(0.045, 0.105, 0.04)
    frond.rotation.set(Math.sin(angle) * 0.55, 0, -Math.cos(angle) * 0.55)
  }

  const front = depth / 2
  const glazing = groundGlazing({ width, depth })
  const warm = '#ffcd98'
  const pendantShade = new CylinderGeometry(0.055, 0.19, 0.103, 16)
  const pendantStem = new CylinderGeometry(0.013, 0.013, 0.18, 8)
  const pendantBulb = new SphereGeometry(0.059, 12, 8)
  for (const px of [0, width * 0.30]) {
    addMesh(room, pendantShade, materials.windowBox, px, 1.89, front - 0.91)
    addMesh(room, pendantStem, materials.iron, px, 2.02, front - 0.91)
    addMesh(room, pendantBulb, materials.interiorBulb, px, 1.808, front - 0.91).castShadow = false
  }

  const rearBulb = addMesh(room, pendantBulb, materials.interiorBulb, -glazing.back.x - 0.09, 1.465, -front + 0.23)
  rearBulb.scale.setScalar(0.66)
  rearBulb.castShadow = false

  // The projectors sit indoors. Masonry, mullions and furniture block the light;
  // the panes transmit it because only the frames participate in the shadow pass.
  const throughOpening = (source, target, intensity, angle, size) => {
    const range = 4.65
    const light = spot(room, { color: warm, intensity, range, angle, softEdge: 0.67, source, target })
    light.castShadow = true
    light.shadow.autoUpdate = false
    light.shadow.needsUpdate = true
    light.shadow.mapSize.set(size, size)
    light.shadow.camera.near = 0.24
    light.shadow.camera.far = range
    light.shadow.radius = 2.45
    light.shadow.normalBias = 0.007
    light.shadow.intensity = 1
  }

  for (const opening of glazing.frontWindows) {
    const outward = Math.sign(opening.x)
    throughOpening([opening.x - 0.14 * outward, 1.81, front - 0.89],
      [opening.x + 0.16 * outward, 0.055, front + 1.33], opening.x > 0 ? 67 : 58, 0.41, 384)
  }
  throughOpening([0, 1.76, front - 1.02], [0.03, 0.045, front + 1.19], 52, 0.37, 384)
  throughOpening([width / 2 - 0.94, 1.84, -glazing.east.x - 0.10],
    [width / 2 + 1.19, 0.064, -glazing.east.x + 0.06], 44, 0.39, 320)
  throughOpening([-width / 2 + 0.84, 1.70, glazing.west.x + 0.07],
    [-width / 2 - 0.78, 0.47, glazing.west.x], 24, 0.31, 256)
  throughOpening([-glazing.back.x, 1.55, -front + 0.26],
    [-glazing.back.x, 1.20, -front - 0.62], 3.8, 0.29, 192)

  for (const px of [-width * 0.19, width * 0.23]) {
    spot(room, {
      color: '#ffd3a0', intensity: 15, range: 1.93, angle: 0.54, softEdge: 0.74,
      source: [px, 1.91, -0.12], target: [px, 0.86, -front + 0.58],
    })
  }
  spot(room, {
    color: '#ffd8ac', intensity: 2.7, range: 1.18, angle: 0.55, softEdge: 0.78,
    source: [x - 0.27, 1.06, z], target: [x - 0.18, 0.76, z - 0.05],
  })

  // Keep the bounced fill inside the masonry. Only the window beams reach the street.
  const fillRange = Math.min(front - 0.03, width * 0.35, 1.78)
  for (const offset of [-0.14, 0.14]) {
    const bounce = new PointLight('#ffd3a0', 13, fillRange, 2)
    bounce.position.set(width * offset, 1.39, 0)
    room.add(bounce)
  }

  const roomLights = []
  const glows = []
  room.traverse((object) => {
    if (object.isLight) roomLights.push([object, object.intensity])
    if (object.isSprite) glows.push([object, object.material.opacity])
  })

  return {
    room,
    updateInterior(power) {
      for (const [light, intensity] of roomLights) {
        light.visible = power > 0
        light.intensity = intensity * power
      }
      for (const [halo, opacity] of glows) {
        halo.visible = power > 0
        halo.material.opacity = opacity * power
      }
      materials.lampShade.emissiveIntensity = power * 0.92
      materials.interiorBulb.emissiveIntensity = power * 1.58
    },
  }
}
