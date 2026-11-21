import { BufferGeometry, CatmullRomCurve3, Float32BufferAttribute, Vector3 } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'

function taper(points, radii, rings) {
  const curve = new CatmullRomCurve3(points)
  const frames = curve.computeFrenetFrames(rings, false)
  const segments = 7
  const positions = []
  const tones = []
  const indices = []
  const offset = new Vector3()
  for (let ring = 0; ring <= rings; ring += 1) {
    const t = ring / rings
    const center = curve.getPointAt(t)
    const radius = radii[1] + (radii[0] - radii[1]) * (1 - t) ** 1.28
    for (let side = 0; side < segments; side += 1) {
      const angle = side * Math.PI * 2 / segments
      offset.copy(frames.normals[ring]).multiplyScalar(Math.cos(angle) * radius)
      offset.addScaledVector(frames.binormals[ring], Math.sin(angle) * radius)
      positions.push(...offset.add(center))
      const grain = 0.76 + Math.cos(side * 2.93 + ring * 0.17) * 0.10 + Math.sin(side * 4.63 + ring * 0.57) * 0.06
      tones.push(grain * 1.12, grain, grain * 0.95)
      if (ring === rings) continue
      const current = ring * segments + side
      const next = ring * segments + (side + 1) % segments
      indices.push(current, next, current + segments, next, next + segments, current + segments)
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('color', new Float32BufferAttribute(tones, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

export function createBranches({ height, crownWidth, branchCount, spread, lean }, random) {
  const geometries = []
  const terminals = []
  const fronds = []
  const head = new Vector3(lean * 0.55, height * 0.67, -0.13)
  const trunk = [
    new Vector3(0, -0.025, 0),
    new Vector3(-lean * 0.12, height * 0.22, 0.045),
    new Vector3(lean * 0.28, height * 0.44, -0.07),
    head,
  ]
  const axis = new CatmullRomCurve3(trunk)
  geometries.push(taper(trunk, [height * 0.037, height * 0.007], 15))
  for (let root = 0; root < 5; root += 1) {
    const angle = root * 2 * Math.PI / 5 + random() * 0.45
    const foot = new Vector3(Math.cos(angle) * height * 0.074, 0.018, Math.sin(angle) * height * 0.074)
    const shoulder = foot.clone().multiplyScalar(0.58)
    shoulder.y = height * 0.019
    geometries.push(taper([new Vector3(0, height * 0.12, 0), shoulder, foot], [height * 0.022, 0.018], 4))
  }

  const rotation = random() * Math.PI * 2
  for (let limb = 0; limb < branchCount; limb += 1) {
    const level = limb / (branchCount - 1)
    const angle = rotation + limb * 2.39996 + (random() - 0.5) * 0.42
    const radial = new Vector3(Math.cos(angle), 0, Math.sin(angle))
    const tangent = new Vector3(-radial.z, 0, radial.x)
    const start = axis.getPoint(0.44 + 0.55 * level)
    const length = crownWidth * (0.34 + random() * 0.12 - level * 0.13)
    const elbow = start.clone().addScaledVector(radial, length * 0.46)
    elbow.y += height * (0.11 + random() * 0.03)
    const tip = elbow.clone().addScaledVector(radial, length * 0.54).addScaledVector(tangent, (random() - 0.5) * length * 0.45)
    tip.y = height * (0.60 + level * 0.32 + (random() - 0.5) * 0.08)
    tip.z *= spread
    const limbCurve = new CatmullRomCurve3([start, elbow, tip])
    geometries.push(taper([start, elbow, tip], [height * (0.016 - level * 0.007), 0.017], 10))

    for (let fork = 0; fork < 4; fork += 1) {
      const join = limbCurve.getPoint(0.39 + fork * 0.18)
      const side = fork % 2 === 0 ? 1 : -1
      const forkEnd = join.clone()
        .addScaledVector(radial, crownWidth * (0.08 + random() * 0.07))
        .addScaledVector(tangent, side * crownWidth * (0.07 + random() * 0.08))
      forkEnd.y += height * (0.09 + random() * 0.13) * (1 - level * 0.42)
      const bend = join.clone().lerp(forkEnd, 0.57)
      bend.y += height * 0.023
      geometries.push(taper([join, bend, forkEnd], [0.042, 0.008], 5))
      fronds.push(bend, forkEnd)
      terminals.push(forkEnd)

      for (let twig = 0; twig < 2; twig += 1) {
        const twigEnd = bend.clone().lerp(forkEnd, 0.48 + twig * 0.29)
          .addScaledVector(tangent, (twig === 0 ? -1 : 1) * crownWidth * 0.065)
          .addScaledVector(radial, crownWidth * (0.018 + random() * 0.06))
        twigEnd.y += height * (0.025 + random() * 0.047)
        const twigBend = bend.clone().lerp(twigEnd, 0.53)
        twigBend.y -= 0.035
        geometries.push(taper([bend, twigBend, twigEnd], [0.017, 0.004], 3))
        terminals.push(twigEnd)
        fronds.push(twigEnd)
      }
    }
  }
  const geometry = mergeGeometries(geometries)
  for (const part of geometries) part.dispose()
  return { geometry, terminals, fronds }
}
