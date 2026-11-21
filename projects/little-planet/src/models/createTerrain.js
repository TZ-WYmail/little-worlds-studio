import {
  BackSide, BufferAttribute, Color, ConeGeometry, DodecahedronGeometry, Group, InstancedMesh, Object3D, ShaderMaterial,
  SphereGeometry, Vector3,
} from 'three'
import { seededRandom } from '../core/seededRandom.js'
import { material, mesh } from './modeling.js'

const up = new Vector3(0, 1, 0)
const radius = 2.78

function wave(x, y, z) {
  return Math.sin(3.2 * x + 2.2 * z) * Math.cos(4.1 * y - 3.6 * z)
    + 0.38 * Math.sin(11 * x + 5.1 * y - z) * Math.sin(7 * z + 2.8 * y)
    + 0.15 * Math.cos(19 * y + 12 * x) * Math.sin(11 * z - 3 * x)
}

function heightAt(normal) {
  return radius + 0.068 * wave(normal.x, normal.y, normal.z)
}

export function putOnPlanet(anchor, direction) {
  const normal = new Vector3(...direction).normalize()
  anchor.position.copy(normal).multiplyScalar(heightAt(normal) - 0.018)
  anchor.quaternion.setFromUnitVectors(up, normal)
}

function ground() {
  const shape = new SphereGeometry(1, 115, 82)
  const coords = shape.attributes.position
  const vertex = new Vector3()
  const mossDark = new Color('#46584b')
  const mossPale = new Color('#879568')
  const loam = new Color('#82604a')
  const ochre = new Color('#b58262')
  const slate = new Color('#584a55')
  const color = new Color()
  const rock = new Color()
  const rgb = new Float32Array(coords.count * 3)
  for (let index = 0; index < coords.count; index++) {
    vertex.fromBufferAttribute(coords, index).normalize()
    const { x, y, z } = vertex
    const meander = wave(x, y, z)
    const grain = Math.sin(x * 377 + y * 218) * Math.cos(z * 142 - x * 99) * 0.035
    const band = Math.sin(23 * y + 1.9 * wave(2 * x, y, 2 * z) + x * 3.5)
    const grass = Math.max(0, Math.min(1, 2.9 * (y - 0.07 - meander * .13)))
    color.copy(mossDark).lerp(mossPale, .44 + meander * .29)
    rock.copy(loam).lerp(ochre, .44 + band * .20).lerp(slate, Math.max(0, -y) * .52)
    color.lerp(rock, 1 - grass).multiplyScalar(1 + grain + .068 * band * (1 - grass))
    color.toArray(rgb, index * 3)
    vertex.multiplyScalar(heightAt(vertex))
    coords.setXYZ(index, vertex.x, vertex.y, vertex.z)
  }
  shape.computeVertexNormals()
  shape.setAttribute('color', new BufferAttribute(rgb, 3))
  return shape
}

function landscapeDetails(planet) {
  const random = seededRandom(81732)
  const pose = new Object3D()
  const normal = new Vector3()
  const stoneTint = new Color()
  const palette = ['#9b8a77', '#786e77', '#aba296', '#7f7868', '#a69681']
  const rocks = new InstancedMesh(new DodecahedronGeometry(1, 1), material('#ffffff'), 130)
  rocks.castShadow = true
  rocks.receiveShadow = true
  planet.add(rocks)
  for (let index = 0; index < rocks.count; index++) {
    if (index < 37) {
      const t = index / 36
      normal.set(-.56 + t * 1.03, .80 + Math.sin(t * Math.PI) * .13, .49 + Math.sin(t * 4.7) * .16)
      normal.x += (random() - .5) * .09
      normal.z += (random() - .5) * .080
    } else {
      const angle = random() * Math.PI * 2
      const y = random() * 1.52 - .73
      normal.set(Math.sqrt(1 - y * y) * Math.cos(angle), y, Math.sqrt(1 - y * y) * Math.sin(angle))
    }
    normal.normalize()
    const width = index < 37 ? .045 + random() * .06 : .038 + random() ** 2 * .139
    pose.position.copy(normal).multiplyScalar(heightAt(normal) - width * .18)
    pose.quaternion.setFromUnitVectors(up, normal)
    pose.rotateY(random() * Math.PI)
    pose.scale.set(width * (1.0 + random() * .67), width * .57, width * .81)
    pose.updateMatrix()
    rocks.setMatrixAt(index, pose.matrix)
    rocks.setColorAt(index, stoneTint.set(palette[index % palette.length]))
  }

  const turf = new InstancedMesh(new ConeGeometry(.038, .19, 3), material('#ffffff'), 620)
  const petals = new InstancedMesh(new DodecahedronGeometry(.07, 0), material('#ffffff', { roughness: .63 }), 57)
  const pips = new InstancedMesh(new DodecahedronGeometry(.029, 0), material('#dca052'), 57)
  const blades = ['#839560', '#93966b', '#6d8057', '#55744e', '#9ca572']
  const flowers = ['#e9c284', '#dba68e', '#e9d9b3', '#b9a0bb']
  planet.add(turf, petals, pips)
  for (let index = 0; index < 310; index++) {
    const angle = random() * 6.283
    const y = .37 + random() * .63
    const span = Math.sqrt(1 - y * y)
    const x = Math.cos(angle) * span
    const z = Math.sin(angle) * span
    normal.set(x, y, z)
    if (index < petals.count) {
      pose.position.copy(normal).multiplyScalar(heightAt(normal) + .054)
      pose.quaternion.setFromUnitVectors(up, normal)
      pose.scale.set(.52, .23, .47)
      pose.updateMatrix()
      petals.setMatrixAt(index, pose.matrix)
      petals.setColorAt(index, stoneTint.set(flowers[index % flowers.length]))
      pose.position.addScaledVector(normal, .014)
      pose.scale.setScalar(.40)
      pose.updateMatrix()
      pips.setMatrixAt(index, pose.matrix)
    }
    for (let blade = 0; blade < 2; blade++) {
      normal.set(x + (random() - .5) * .042, y, z + (random() - .5) * .042).normalize()
      pose.position.copy(normal).multiplyScalar(heightAt(normal) + .033)
      pose.quaternion.setFromUnitVectors(up, normal)
      pose.rotateZ((random() - .5) * .69)
      pose.scale.set(.45, .32 + random() * .48, .39)
      pose.updateMatrix()
      turf.setMatrixAt(index * 2 + blade, pose.matrix)
      turf.setColorAt(index * 2 + blade, stoneTint.set(blades[(index + blade) % blades.length]))
    }
  }
}

function terrainMaterial() {
  const surface = material('#ffffff', { vertexColors: true, roughness: .95 })
  surface.onBeforeCompile = (shader) => {
    shader.vertexShader = 'varying vec3 clayPoint;\n' + shader.vertexShader.replace(
      '#include <begin_vertex>', '#include <begin_vertex>\nclayPoint = position;')
    shader.fragmentShader = `varying vec3 clayPoint;
      float fleck(vec3 p) {
        return fract(sin(dot(p, vec3(19.17, 73.7, 51.3))) * 43758.5453);
      }
      float clayNoise(vec3 point) {
        vec3 cell = floor(point), f = fract(point);
        vec3 w = f * f * (3.0 - 2.0 * f);
        return mix(mix(mix(fleck(cell), fleck(cell + vec3(1,0,0)), w.x),
                       mix(fleck(cell + vec3(0,1,0)), fleck(cell + vec3(1,1,0)), w.x), w.y),
                   mix(mix(fleck(cell + vec3(0,0,1)), fleck(cell + vec3(1,0,1)), w.x),
                       mix(fleck(cell + vec3(0,1,1)), fleck(cell + vec3(1,1,1)), w.x), w.y), w.z);
      }
    ` + shader.fragmentShader.replace('#include <color_fragment>', `
      #include <color_fragment>
      float grain = clayNoise(clayPoint * 93.1) - .5;
      float moss = clayNoise(clayPoint * 17.8) - .5;
      float layers = sin(clayPoint.y * 16.0 + sin(clayPoint.x * 2.1) * 2.2 + clayPoint.z * 1.4);
      float cracks = smoothstep(.76, 1.0, layers) * (1.0 - smoothstep(-1.0, .83, clayPoint.y));
      diffuseColor.rgb *= 1.0 + grain * .092 + moss * .111 - cracks * .085;
    `)
  }
  return surface
}

export function createTerrain(scene) {
  const planet = new Group()
  const shell = mesh(planet, ground(), terrainMaterial())
  shell.castShadow = true
  landscapeDetails(planet)
  const fringe = mesh(planet, new SphereGeometry(2.846,60,40), new ShaderMaterial({
    uniforms:{ tone:{ value:new Color('#efb7a7') } },
    side:BackSide, transparent:true, depthWrite:false,
    vertexShader:`
      varying vec3 directionNormal;
      varying vec3 directionView;
      void main() {
        vec4 point = modelViewMatrix * vec4(position, 1.0);
        directionNormal = normalMatrix * normal;
        directionView = -point.xyz;
        gl_Position = projectionMatrix * point;
      }
    `,
    fragmentShader:`
      uniform vec3 tone;
      varying vec3 directionNormal;
      varying vec3 directionView;
      void main() {
        float edge = 1.0 - abs(dot(normalize(directionNormal), normalize(directionView)));
        gl_FragColor = vec4(tone, pow(edge, 5.0) * .12);
        #include <colorspace_fragment>
      }
    `,
  }))
  fringe.castShadow=fringe.receiveShadow=false
  scene.add(planet)
  return planet
}
