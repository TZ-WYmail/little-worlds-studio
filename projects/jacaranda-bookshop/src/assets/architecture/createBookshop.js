import {
  BoxGeometry, CanvasTexture, ExtrudeGeometry, Group, InstancedMesh, MeshStandardMaterial,
  Object3D, Shape, SRGBColorSpace,
} from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { groundGlazing } from './groundGlazing.js'
import { createRearDetails } from './createRearDetails.js'
import { createHangingSign } from './createHangingSign.js'
import { addEuropeanFacade, createDormer } from './addEuropeanDetails.js'
import { addShopDetails } from './addShopDetails.js'
import { addMesh, box } from '../../world/modeling.js'

const floorLine = 2.31
function buildWindowWall(group, material, width, height, openings, turn, x, z) {
  const wall = new Group()
  wall.position.set(x, 0, z)
  wall.rotation.y = turn
  group.add(wall)
  const thickness = 0.16
  let edge = -width / 2
  const panel = (left, right, low, high) => {
    if (right > left && high > low) {
      box(wall, material, [right - left, high - low, thickness], [(left + right) / 2, (low + high) / 2, 0])
    }
  }
  for (const opening of openings) {
    const left = opening.x - opening.width / 2 + 0.021
    const right = opening.x + opening.width / 2 - 0.021
    panel(edge, left, 0, floorLine)
    panel(left, right, 0, opening.y - opening.height / 2 + 0.022)
    panel(left, right, opening.y + opening.height / 2 - 0.022, floorLine)
    edge = right
  }
  panel(edge, width / 2, 0, floorLine)
  panel(-width / 2, width / 2, floorLine, height)
}

function addWall(group, materials, { width, depth, wallHeight }, glazing) {
  const front = depth / 2
  buildWindowWall(group, materials.plaster, width, wallHeight,
    [glazing.frontWindows[0], glazing.frontDoor, glazing.frontWindows[1]], 0, 0, front)
  buildWindowWall(group, materials.plaster, width, wallHeight, [glazing.back], Math.PI, 0, -front)
  buildWindowWall(group, materials.plaster, depth, wallHeight, [glazing.east], Math.PI / 2, width / 2, 0)
  buildWindowWall(group, materials.plaster, depth, wallHeight, [glazing.west], -Math.PI / 2, -width / 2, 0)
  for (const x of [-width / 2 + 0.20, -width * 0.15, width * 0.15, width / 2 - 0.20]) {
    const outer = Math.abs(x) > width * 0.2
    box(group, materials.trim, [outer ? 0.24 : 0.09, floorLine, 0.058], [x, floorLine / 2, front + 0.10], 0.02)
  }

  box(group, materials.wood, [width - 0.10, 0.13, depth - 0.10], [0, 0.092, 0], 0.025)
  box(group, materials.trim, [width + 0.08, 0.16, depth + 0.08], [0, floorLine, 0], 0.025)
  box(group, materials.wood, [width - 0.05, 0.14, depth - 0.08], [0, 2.16, -0.01], 0.025)
}

function pane(group, materials, x, y, z, width, height, { door = false, upper = false } = {}) {
  const frame = new Group()
  frame.position.set(x, y, z)
  group.add(frame)
  const rim = upper ? 0.068 : 0.085
  for (const side of [-1, 1]) {
    box(frame, materials.wood, [rim, height, 0.15], [side * (width - rim) / 2, 0, 0], 0.015)
    box(frame, materials.wood, [width, rim, 0.15], [0, side * (height - rim) / 2, 0], 0.015)
  }
  const glass = box(frame, upper ? materials.upperGlass : materials.glass,
    [width - 2 * rim, height - 2 * rim, 0.026], [0, 0, 0.013])
  glass.castShadow = false
  glass.receiveShadow = false
  box(frame, materials.wood, [width, 0.045, 0.095], [0, height * 0.22, 0.058], 0.009)
  box(frame, materials.wood, [0.038, height - rim, 0.095], [0, 0, 0.058], 0.009)
  if (door) {
    box(frame, materials.wood, [width - rim, height * 0.23, 0.095], [0, -height * 0.365, 0.035], 0.022)
    box(frame, materials.brass, [0.038, 0.15, 0.047], [width * 0.27, -0.15, 0.12], 0.012)
  } else {
    box(frame, materials.trim, [width + 0.13, 0.071, 0.22], [0, -height / 2 - 0.015, 0.018], 0.018)
  }
  return frame
}

function sign(shop, materials, width, front) {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 144
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#303f36'
  ctx.fillRect(0, 0, 1024, 144)
  ctx.strokeStyle = '#d6b27f'
  ctx.lineWidth = 2
  ctx.strokeRect(11, 10, 1002, 124)
  ctx.fillStyle = '#f5dfb4'
  ctx.font = '50px Georgia, serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('J A C A R A N D A   B O O K S', 512, 74)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  const lettering = new MeshStandardMaterial({ map: texture, roughness: 0.82 })
  box(shop, materials.wood, [width - 0.34, 0.34, 0.13], [0, 2.03, front + 0.15], 0.045)
  addMesh(shop, new BoxGeometry(width - 0.47, 0.29, 0.01), lettering, 0, 2.03, front + 0.22).castShadow = false
}

function addBalcony(shop, materials, front) {
  box(shop, materials.trim, [1.44, 0.18, 0.64], [0, 2.55, front + 0.27], 0.055)
  for (const x of [-0.61, 0.61]) {
    box(shop, materials.iron, [0.06, 0.43, 0.06], [x, 2.85, front + 0.58], 0.02)
    box(shop, materials.iron, [0.045, 0.06, 0.51], [x, 3.04, front + 0.32], 0.014)
  }
  for (const x of [-0.42, -0.21, 0, 0.21, 0.42]) {
    box(shop, materials.iron, [0.029, 0.35, 0.029], [x, 2.84, front + 0.58], 0.01)
  }
  box(shop, materials.wood, [1.34, 0.055, 0.07], [0, 3.04, front + 0.58], 0.019)
}

function roof(group, materials, width, depth, wallHeight) {
  const run = depth / 2 + 0.25
  const rise = depth * 0.28
  const slope = Math.atan(rise / run)
  const length = Math.hypot(run, rise)
  const gable = new Shape()
  gable.moveTo(-depth / 2, 0)
  gable.lineTo(0, rise - 0.045)
  gable.lineTo(depth / 2, 0)
  gable.closePath()
  const gableMesh = addMesh(group, new ExtrudeGeometry(gable, { depth: width, bevelEnabled: false }),
    materials.plaster, -width / 2, wallHeight, 0)
  gableMesh.rotation.y = Math.PI / 2
  box(group, materials.trim, [width + 0.34, 0.22, depth + 0.31], [0, wallHeight - 0.016, 0], 0.052)

  const columns = Math.ceil(width / 0.23)
  const rows = Math.ceil(length / 0.29)
  const stepX = (width + 0.43) / columns
  const stepZ = length / rows
  const tileShape = new RoundedBoxGeometry(stepX * 0.97, 0.077, stepZ * 1.14, 2, 0.022)
  const tiles = new InstancedMesh(tileShape, materials.tiles, columns * rows * 2)
  tiles.castShadow = true
  tiles.receiveShadow = true
  const pose = new Object3D()
  let tile = 0
  for (const side of [-1, 1]) {
    const board = box(group, materials.roof, [width + 0.49, 0.105, length],
      [0, wallHeight + rise / 2 + 0.078, side * run / 2], 0.032)
    board.rotation.x = side * slope
    pose.rotation.x = side * slope
    for (let row = 0; row < rows; row += 1) {
      const distance = (row + 0.47) / rows
      for (let col = 0; col < columns; col += 1) {
        const irregularity = Math.sin(tile * 2.431) * 0.01
        pose.position.set((col + 0.5 - columns / 2) * stepX, wallHeight + rise * (1 - distance) + 0.15 + irregularity,
          side * run * distance)
        pose.updateMatrix()
        tiles.setMatrixAt(tile, pose.matrix)
        tiles.setColorAt(tile, materials.roofTone.clone().multiplyScalar(0.89 + 0.10 * Math.sin(col + row) ** 2))
        tile += 1
      }
    }
  }
  group.add(tiles)
  box(group, materials.roofRidge, [width + 0.59, 0.16, 0.20], [0, wallHeight + rise + 0.13, 0], 0.067)
}

export function createBookshop({ width, depth, wallHeight }, materials) {
  const shop = new Group()
  shop.name = '春页书店'
  const shell = new Group()
  shell.name = '建筑外壳'
  const top = new Group()
  top.name = '屋顶'
  shop.add(shell, top)
  const dimensions = { width, depth, wallHeight }
  const glazing = groundGlazing(dimensions)
  addWall(shell, materials, dimensions, glazing)
  const front = depth / 2
  for (const { x, y, width: paneWidth, height } of glazing.frontWindows) {
    box(shell, materials.wood, [width * 0.25, 0.55, 0.17], [x, 0.345, front + 0.04], 0.035)
    pane(shell, materials, x, y, front + 0.105, paneWidth, height)
    pane(shell, materials, x, 3.32, front + 0.08, width * 0.15, 1.03, { upper: true })
  }
  const door = glazing.frontDoor
  pane(shell, materials, door.x, door.y, front + 0.11, door.width, door.height, { door: true })
  pane(shell, materials, 0, 3.20, front + 0.084, width * 0.13, 1.16, { upper: true })
  const sideWindow = pane(shell, materials, width / 2 + 0.08, glazing.east.y, -glazing.east.x, glazing.east.width, glazing.east.height)
  sideWindow.rotation.y = Math.PI / 2
  const westWindow = pane(shell, materials, -width / 2 - 0.08,
    glazing.west.y, glazing.west.x, glazing.west.width, glazing.west.height)
  westWindow.rotation.y = -Math.PI / 2
  const sideUpper = pane(shell, materials, width / 2 + 0.08, 3.30, depth * 0.16, depth * 0.31, 1.01, { upper: true })
  sideUpper.rotation.y = Math.PI / 2
  box(shell, materials.trim, [1.68, 0.14, 0.65], [0, 0.07, front + 0.26], 0.038)
  box(shell, materials.trim, [1.57, 0.10, 0.47], [0, 0.17, front + 0.18], 0.032)
  sign(shell, materials, width, front)
  addBalcony(shell, materials, front)
  roof(top, materials, width, depth, wallHeight)
  top.add(createDormer({ width, depth, wallHeight }, materials))
  addShopDetails(shell, { width, depth, wallHeight }, materials, top)
  addEuropeanFacade(shell, { width, depth }, materials)
  const { rear, updateRearLantern } = createRearDetails(dimensions, materials)
  shell.add(rear, createHangingSign(dimensions, materials))
  return { shop, updateRearLantern }
}
