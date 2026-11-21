import {
  BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Group, LatheGeometry, MeshPhysicalMaterial,
  PointLight, Vector2,
} from 'three'
import { material, mesh, oval, sweep } from './modeling.js'
import { putOnPlanet } from './createTerrain.js'

function place(planet, direction, id) {
  const group = new Group()
  if (id) group.userData.landmark = id
  putOnPlanet(group, direction)
  planet.add(group)
  return group
}

function petalShape(angle, reach, height, rise, index) {
  const vertices = []
  const indices = []
  const colors = []
  const color = new Color()
  const base = new Color('#802646')
  const body = new Color(index % 3 === 1 ? '#c74863' : '#be3a54')
  const edge = new Color('#ed867c')
  const rows = 15
  const columns = 12
  for (let r = 0; r <= rows; r++) {
    const y = r / rows
    for (let c = 0; c <= columns; c++) {
      const u = c / columns * 2 - 1
      const arc = Math.sin(Math.PI * y ** .66)
      const width = u * (reach * .57 + .030) * arc ** .54
      const distance = .02 + reach * y ** .89 + .035 * u * u * y
      const vertical = rise + height * Math.sin(y * 1.63) - u * u * .055 * y - .056 * y ** 5
      vertices.push(Math.cos(angle) * distance - Math.sin(angle) * width, vertical,
        Math.sin(angle) * distance + Math.cos(angle) * width)
      color.copy(base).lerp(body, Math.sin(y * 1.57)).lerp(edge, y ** 8 * .78 + Math.abs(u) ** 8 * y * .13)
      colors.push(color.r, color.g, color.b)
      if (r < rows && c < columns) {
        const a = r * (columns + 1) + c
        indices.push(a, a + columns + 1, a + 1, a + 1, a + columns + 1, a + columns + 2)
      }
    }
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position',new Float32BufferAttribute(vertices,3))
  geometry.setAttribute('color',new Float32BufferAttribute(colors,3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function leaf(parent, x, y, z, direction, size, mat) {
  const blade = oval(parent, mat, [x,y,z],[size*.53,.023,size])
  blade.rotation.set(-.28, direction, .31)
  return blade
}

function buildRose(planet) {
  const root = place(planet,[.32,.81,.49],'rose')
  const stalk = new Group()
  root.add(stalk)
  const green = material('#4f7452')
  const lightGreen = material('#769162')
  const petals = material('#fff5ef',{ vertexColors:true, side:DoubleSide, roughness:.47 })
  sweep(stalk, green, [[0,.02,0],[.04,.34,.025],[-.015,.60,.028],[.014,.86,.013]], .034)
  sweep(stalk, green, [[.027,.29,.020],[-.102,.43,.087],[-.211,.43,.21]], .016, 10)
  sweep(stalk, green, [[-.001,.55,.029],[.178,.61,-.06],[.246,.68,-.106]], .015, 10)
  leaf(stalk,-.169,.425,.167,-.69,.115,lightGreen)
  leaf(stalk,.185,.630,-.081,-1.18,.126,green)
  leaf(stalk,.105,.33,-.056,-.68,.091,green)
  const flower = new Group()
  flower.position.set(.014,.81,.013)
  stalk.add(flower)
  const whorls = [[7,.302,.115,.010],[6,.235,.185,.024],[5,.156,.232,.035],[4,.093,.244,.038]]
  for (const [ring,[n,r,h,y]] of whorls.entries()) {
    for (let i = 0; i < n; i++) {
      mesh(flower, petalShape(i / n * Math.PI * 2 + ring * .58,r,h,y,i),petals)
    }
  }
  for (let i = 0; i < 5; i++) {
    const azimuth = i * Math.PI * 2 / 5
    leaf(stalk, Math.cos(azimuth) * .09,.802,Math.sin(azimuth) * .09,azimuth + Math.PI / 2,.112,green)
  }
  const halo = new PointLight('#ffb784',0,1.8,2)
  halo.position.set(.04,.64,.17)
  root.add(halo)

  const glassProfile = [
    [.410,.019],[.420,.042],[.409,.075],[.405,.71],[.389,.90],[.350,1.054],
    [.263,1.189],[.145,1.249],[.074,1.263],[.004,1.272],
  ]
  const dome = new Group()
  root.add(dome)
  const glass = mesh(dome,new LatheGeometry(glassProfile.map(([r,y])=>new Vector2(r,y)),40),
    new MeshPhysicalMaterial({ color:'#e9efed', roughness:.16, metalness:.04, transparent:true,
      opacity:.28, transmission:.34, thickness:.07, clearcoat:.8, depthWrite:false }))
  glass.castShadow = glass.receiveShadow = false
  glass.renderOrder = 4
  const brass = material('#a58457',{ roughness:.42, metalness:.36 })
  mesh(dome, new LatheGeometry([[.422,0],[.436,.022],[.436,.035],[.416,.055],[.409,.045]].map(([r,y])=>new Vector2(r,y)),36),brass)
  oval(dome, brass, [0,1.303,0],[.043,.048,.043])
  dome.visible = false
  const gripPoint = [new Vector2(-.32,.208),new Vector2(-.32,-.208)]
  let cover = 0
  let turn = 0

  return {
    root,
    coverCenter(vector) { return dome.getWorldPosition(vector) },
    gripPosition(side, vector) {
      const p=gripPoint[side<0 ? 0 : 1]
      return dome.localToWorld(vector.set(p.x,.077,p.y))
    },
    update(delta, seconds, { motion, bloom, glow, protectedRose, low, settle, selected, delivery }) {
      stalk.rotation.x = motion ? Math.sin(seconds * 1.46 + .4) * .033 : 0
      stalk.rotation.z = motion ? Math.sin(seconds * 1.17) * .032 : 0
      flower.scale.setScalar(1 + bloom * .15)
      turn += ((selected ? .37 : 0) - turn) * (settle ? 1 : 1 - Math.exp(-delta * 4))
      flower.rotation.y = turn + (motion ? Math.sin(seconds * .62) * .028 : 0) + bloom * .19
      halo.intensity = glow * 3.1
      cover += ((delivery || protectedRose ? 1 : 0) - cover) * (settle ? 1 : 1 - Math.exp(-delta * 4))
      dome.visible = cover > .008
      if (delivery) {
        dome.position.set(.055*(1-delivery.advance),delivery.lift,.88*(1-delivery.advance))
        dome.rotation.z = -.06 * delivery.lift
      } else {
        dome.position.set(0, (1 - cover) * 1.42, 0)
        dome.rotation.z=0
      }
      glass.material.opacity = cover * (low ? .18 : .33)
      glass.material.transmission = low ? 0 : .34
    },
  }
}

function volcano(planet, direction, size, active, id) {
  const root = place(planet, direction, id)
  root.scale.setScalar(size)
  const profile = [[.76,-.07],[.73,.048],[.59,.18],[.48,.376],[.41,.58],[.346,.81],
    [.32,.975],[.259,1.024],[.207,.973],[.157,.814],[.123,.774],[.008,.741]]
  const shape = new LatheGeometry(profile.map(([r,y])=>new Vector2(r,y)),41)
  const position = shape.attributes.position
  const palette = []
  const ochre = new Color(active ? '#93705c' : '#77737a')
  const charcoal = new Color(active ? '#594a50' : '#505259')
  const lichen = new Color('#a08c67')
  const color = new Color()
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), z = position.getZ(i), y = position.getY(i)
    const angle = Math.atan2(z,x)
    const ridge = Math.sin(angle * 6 + y * 2.4) * .09 + Math.sin(angle * 10 - y * 7.2) * .047
    const warp = 1 + ridge + .19 * Math.sin(angle + 1.6)
    position.setXYZ(i,x*warp,y + (y > .16 ? Math.cos(angle*3 + .6)*.024 + ridge*.17 : 0),z*warp)
    color.copy(ochre).lerp(charcoal,.28 + y*.32 + ridge*1.8).lerp(lichen,Math.max(0, .18-y)*1.6)
    palette.push(color.r,color.g,color.b)
  }
  shape.setAttribute('color',new Float32BufferAttribute(palette,3))
  shape.computeVertexNormals()
  mesh(root,shape,material('#ffffff',{ vertexColors:true, roughness:.94 }))
  const lava = active ? material('#e58c51',{ emissive:'#ff7137', emissiveIntensity:.63 }) : material('#35333f')
  oval(root,lava,[0,.784,0],[.156,.029,.151])
  let lavaGlow = null
  if (active) {
    lavaGlow = new PointLight('#ff884e', .25, 1.42, 2)
    lavaGlow.position.set(.03,.89,.07)
    root.add(lavaGlow)
    sweep(root, lava, [[.109,.805,.165],[.161,.903,.237],[.17,.81,.290],[.187,.70,.332],[.205,.65,.367]], .019, 18)
  }
  return {root, lava, lavaGlow, active}
}

function seedling(planet, direction, id, yaw) {
  const root = place(planet,direction,id)
  const sprout = new Group()
  root.add(sprout)
  sprout.rotateY(yaw)
  const green = material('#77955e')
  const sage = material('#abb675')
  sweep(sprout,green,[[0,0,0],[.01,.119,0],[.006,.32,-.01],[.019,.49,.01]],.014,10)
  leaf(sprout,-.092,.228,.021,-1.24,.112,sage)
  leaf(sprout,.103,.348,.010,1.26,.133,green)
  leaf(sprout,.017,.426,.066,.22,.098,sage)
  oval(root,material('#9d7d5f'),[0,.016,0],[.116,.013,.102])
  return {root,sprout}
}

export function createLandmarks(planet) {
  const rose = buildRose(planet)
  const volcanoes = [
    volcano(planet,[.10,.87,-.56],1.12,true,'volcano-one'),
    volcano(planet,[.71,.63,-.30],.85,true,'volcano-two'),
    volcano(planet,[-.30,.87,-.58],.76,false,'volcano-three'),
  ]
  const seedlings = [
    seedling(planet,[-.52,.68,.55],'seed-one',.48),
    seedling(planet,[.61,.62,.45],'seed-two',1.15),
    seedling(planet,[-.73,.57,-.35],'seed-three',-.7),
  ]
  const box = place(planet,[-.12,.86,.56],'sheep')
  const cedar = material('#ae835b')
  const dark = material('#624a3e')
  const plaque = material('#d3ad78')
  const boxGeometry = new LatheGeometry([[.1,0],[.12,.02],[.12,.21],[.114,.22]].map(([r,y])=>new Vector2(r,y)),4)
  const shell = mesh(box,boxGeometry,cedar)
  shell.rotateY(Math.PI * .25)
  oval(box, plaque,[0,.12,.084],[.075,.073,.008])
  for (const x of [-.040,0,.04]) oval(box,dark,[x,.114,.092],[.010,.010,.004])
  return { rose, volcanoes, seedlings, box, picks: [rose.root, ...volcanoes.map(v=>v.root), ...seedlings.map(s=>s.root), box] }
}
