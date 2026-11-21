import {
  Color, Float32BufferAttribute, Group, InstancedBufferAttribute,
  InstancedBufferGeometry, Mesh, PlaneGeometry, ShaderMaterial,
} from 'three'
import { seededRandom } from '../utils/seededRandom.js'

const colorOutput = '#include <colorspace_fragment>'

function petals(trees, time, drift, wind, random) {
  const geometry = new InstancedBufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([
    0, 0, 0, -0.44, 0.13, 0.10, -0.19, 0.58, -0.08,
    0.17, 0.52, 0.09, 0.40, 0.21, 0.04, 0.37, -0.23, -0.06, -0.16, -0.46, 0,
  ], 3))
  geometry.setIndex([0, 2, 1, 0, 3, 2, 0, 4, 3, 0, 5, 4, 0, 6, 5, 0, 1, 6])
  const origins = []
  const phases = []
  for (const tree of trees) {
    const [x, y, z] = tree.position
    for (let index = 0; index < 37; index += 1) {
      const angle = random() * Math.PI * 2
      const reach = Math.sqrt(random()) * tree.crownWidth * 0.48
      origins.push(x + Math.cos(angle) * reach, y + tree.height * (0.72 + random() * 0.26), z + Math.sin(angle) * reach)
      phases.push(random(), random(), random(), random())
    }
  }
  geometry.setAttribute('origin', new InstancedBufferAttribute(new Float32Array(origins), 3))
  geometry.setAttribute('variation', new InstancedBufferAttribute(new Float32Array(phases), 4))
  geometry.instanceCount = phases.length / 4

  const material = new ShaderMaterial({
    uniforms: {
      time, drift, wind, opacity: { value: 1 },
      lilac: { value: new Color('#b991dc') },
      rose: { value: new Color('#f8c7df') },
    },
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    vertexShader: `
      uniform float time, drift, wind;
      attribute vec3 origin;
      attribute vec4 variation;
      varying vec3 petalColor;
      varying float fade;
      uniform vec3 lilac, rose;
      void main() {
        float cycle = fract(variation.x + time * (0.046 + variation.y * 0.046));
        float sway = time * (0.71 + variation.z) + variation.w * 6.283;
        vec3 center = origin + vec3(cycle * (0.37 + 2.15 * wind + 0.50 * sin(drift * 0.43 + variation.x * 6.283)) + sin(sway) * (0.13 + wind * 0.39),
          -cycle * (origin.y - 0.10), cycle * 1.7 + cos(sway * 0.64) * 0.43);
        vec4 point = modelViewMatrix * vec4(center, 1.0);
        float spin = sway * 1.36;
        vec2 shape = position.xy * vec2(0.38 + 0.62 * abs(cos(sway * 0.81)), 1.0);
        shape = mat2(cos(spin), -sin(spin), sin(spin), cos(spin)) * shape;
        point.xy += shape * (0.062 + variation.w * 0.062);
        petalColor = mix(lilac, rose, variation.y) * (0.83 + 0.17 * sin(sway + position.y * 2.0));
        fade = smoothstep(0.0, 0.12, cycle) * (1.0 - smoothstep(0.79, 1.0, cycle));
        gl_Position = projectionMatrix * point;
      }
    `,
    fragmentShader: `
      uniform float opacity;
      varying vec3 petalColor;
      varying float fade;
      void main() {
        gl_FragColor = vec4(petalColor, opacity * fade * 0.9);
        ${colorOutput}
      }
    `,
  })
  return new Mesh(geometry, material)
}

function rain(time, wind, random, bookshop) {
  const geometry = new InstancedBufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute([
    -1, 0, 0, 1, 0, 0, -1, 1, 0, 1, 1, 0,
  ], 3))
  geometry.setIndex([0, 1, 2, 2, 1, 3])
  const origins = []
  const parameters = []
  for (let index = 0; index < 610; index += 1) {
    origins.push((random() - 0.5) * 23, random(), (random() - 0.5) * 19)
    parameters.push(random(), random(), random(), 0)
  }
  const [shopX, shopY, shopZ] = bookshop.position
  for (let index = 0; index < 31; index += 1) {
    origins.push(shopX + (random() - 0.5) * (bookshop.width + 0.43), random(),
      shopZ + bookshop.depth * 0.5 + 0.25 + random() * 0.09)
    parameters.push(random(), random(), random(), 1)
  }
  geometry.setAttribute('origin', new InstancedBufferAttribute(new Float32Array(origins), 3))
  geometry.setAttribute('drop', new InstancedBufferAttribute(new Float32Array(parameters), 4))
  geometry.instanceCount = origins.length / 3

  return new Mesh(geometry, new ShaderMaterial({
    uniforms: {
      time, wind, opacity: { value: 0 }, sourceBrightness: { value: 0.8 },
      roofHeight: { value: shopY + bookshop.wallHeight + 0.08 },
      cold: { value: new Color('#a9c1e2') }, amber: { value: new Color('#ffe0b1') },
    },
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    vertexShader: `
      uniform float time, wind, roofHeight, sourceBrightness;
      attribute vec3 origin;
      attribute vec4 drop;
      varying vec2 streakUV;
      varying vec3 lightColor;
      varying float alpha;
      uniform vec3 cold, amber;
      void main() {
        float runoff = drop.w;
        float cycle = fract(origin.y - time * mix(0.67 + drop.x * 0.66, 1.09 + drop.x * 0.58, runoff));
        float distance = mix(11.2, roofHeight, runoff);
        float lean = mix(0.30 + wind * 4.35, 0.09 + wind * 0.62, runoff);
        vec3 p = vec3(origin.x + (1.0 - cycle) * lean,
          cycle * distance, origin.z + (1.0 - cycle) * mix(0.62, 0.10, runoff));
        float length = mix(0.125 + drop.x * 0.39, 0.09 + drop.y * 0.18, runoff);
        vec3 direction = vec3(-lean / distance, 1.0, -0.061);
        vec4 view = modelViewMatrix * vec4(p + direction * position.y * length, 1.0);
        vec2 streakDirection = (modelViewMatrix * vec4(direction, 0.0)).xy;
        vec2 across = normalize(vec2(streakDirection.y, -streakDirection.x));
        view.xy += across * position.x * (0.006 + drop.z * drop.z * 0.018);
        float nearCamera = 1.0 - smoothstep(30.0, 51.0, -view.z);
        float light = exp(-dot((p - vec3(4.75, 1.47, 1.97)) * vec3(0.87, 0.57, 0.84),
                              (p - vec3(4.75, 1.47, 1.97)) * vec3(0.87, 0.57, 0.84)));
        float window = exp(-dot((p - vec3(2.3, 0.81, 1.00)) * vec3(0.66, 0.65, 0.97),
                               (p - vec3(2.3, 0.81, 1.00)) * vec3(0.66, 0.65, 0.97)));
        float warm = clamp((light + window * 0.47) * sourceBrightness, 0.0, 1.0);
        lightColor = mix(cold, amber, warm);
        alpha = (0.30 + drop.y * 0.35) * (0.44 + 0.42 * nearCamera + 0.70 * warm);
        alpha *= smoothstep(0.01, 0.08, cycle) * (1.0 - smoothstep(0.90, 0.99, cycle));
        streakUV = position.xy;
        gl_Position = projectionMatrix * view;
      }
    `,
    fragmentShader: `
      uniform float opacity;
      varying vec2 streakUV;
      varying vec3 lightColor;
      varying float alpha;
      void main() {
        float width = 1.0 - smoothstep(0.12, 1.0, abs(streakUV.x));
        float tail = smoothstep(0.0, 0.14, streakUV.y) * (1.0 - smoothstep(0.18, 1.0, streakUV.y));
        gl_FragColor = vec4(lightColor, opacity * alpha * width * tail);
        ${colorOutput}
      }
    `,
  }))
}

function puddles(time, random) {
  const plane = new PlaneGeometry(2, 2).rotateX(-Math.PI / 2)
  const geometry = new InstancedBufferGeometry().copy(plane)
  plane.dispose()
  const locations = []
  const shapes = []
  for (let index = 0; index < 37; index += 1) {
    const x = -6.15 + random() * 12.3
    const z = 2.67 + random() * 2.02
    locations.push(x, 0.042, z)
    shapes.push(0.17 + random() * 0.36, 0.07 + random() * 0.16, random(), random())
  }
  geometry.setAttribute('location', new InstancedBufferAttribute(new Float32Array(locations), 3))
  geometry.setAttribute('shape', new InstancedBufferAttribute(new Float32Array(shapes), 4))
  geometry.instanceCount = locations.length / 3

  return new Mesh(geometry, new ShaderMaterial({
    uniforms: { time, opacity: { value: 0 }, amber: { value: new Color('#f9b685') }, sky: { value: new Color('#7a9abb') } },
    transparent: true,
    depthWrite: false,
    toneMapped: false,
    vertexShader: `
      attribute vec3 location;
      attribute vec4 shape;
      varying vec2 localUV;
      varying vec3 center;
      varying vec2 phase;
      void main() {
        localUV = position.xz;
        center = location;
        phase = shape.zw;
        vec3 p = location + position * vec3(shape.x, 1.0, shape.y);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: `
      uniform float time, opacity;
      uniform vec3 amber, sky;
      varying vec2 localUV;
      varying vec3 center;
      varying vec2 phase;
      void main() {
        float r = length(localUV);
        float boundary = r + 0.09 * sin(localUV.x * 15.0 + phase.y * 6.0) + 0.06 * sin(localUV.y * 14.0);
        float edge = 1.0 - smoothstep(0.64, 0.98, boundary);
        float t = fract(time * (0.52 + phase.y * 0.26) + phase.x);
        float ring = (1.0 - smoothstep(0.018, 0.067, abs(r - t))) * (1.0 - t);
        float second = (1.0 - smoothstep(0.013, 0.056, abs(r - max(0.0, t - 0.16)))) * (1.0 - t) * 0.52;
        float impact = (1.0 - smoothstep(0.00, 0.10, r)) * (1.0 - smoothstep(0.04, 0.20, t));
        float lamp = exp(-pow((center.x - 4.53) * 0.62, 2.0) - pow((center.z - 2.2) * 0.55, 2.0));
        vec3 color = mix(sky, amber, lamp * 0.82) * (0.61 + 0.39 * ring);
        gl_FragColor = vec4(color, opacity * edge * (0.015 + 0.46 * ring + 0.22 * second + 0.36 * impact));
        ${colorOutput}
      }
    `,
  }))
}

export function createWeather(trees, bookshop) {
  const group = new Group()
  const random = seededRandom(83271)
  const time = { value: 0 }
  const drift = { value: 0 }
  const wind = { value: 0.42 }
  const blossom = petals(trees, time, drift, wind, random)
  const rainfall = rain(time, wind, random, bookshop)
  const water = puddles(time, random)
  for (const layer of [blossom, rainfall, water]) layer.frustumCulled = false
  water.renderOrder = 2
  rainfall.renderOrder = 5
  group.add(water, blossom, rainfall)

  return {
    group,
    update(seconds, rainAmount, showPetals, breeze, travel, lamps) {
      time.value = seconds
      drift.value = travel
      wind.value = breeze
      blossom.visible = showPetals && trees.length > 0
      blossom.material.uniforms.opacity.value = 1 - rainAmount * 0.58
      rainfall.visible = rainAmount > 0.005
      water.visible = rainfall.visible
      rainfall.material.uniforms.opacity.value = rainAmount
      rainfall.material.uniforms.sourceBrightness.value = lamps
      water.material.uniforms.opacity.value = rainAmount
    },
  }
}
