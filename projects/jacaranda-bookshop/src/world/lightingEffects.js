import { AdditiveBlending, Color, Mesh, PlaneGeometry, ShaderMaterial, SpotLight, Sprite, SpriteMaterial, CanvasTexture } from 'three'

export function spot(group, { color, intensity, range, angle, softEdge, source, target }) {
  const light = new SpotLight(color, intensity, range, angle, softEdge, 2)
  light.position.set(...source)
  light.target.position.set(...target)
  group.add(light, light.target)
  return light
}

export function addLanternHalo(group, position, size, strength) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const context = canvas.getContext('2d')
  const glow = context.createRadialGradient(32, 32, 0, 32, 32, 32)
  glow.addColorStop(0, 'rgba(255, 255, 255, 0.69)')
  glow.addColorStop(0.25, 'rgba(255, 255, 255, 0.22)')
  glow.addColorStop(0.54, 'rgba(255, 255, 255, 0.06)')
  glow.addColorStop(1, 'rgba(255, 255, 255, 0)')
  context.fillStyle = glow
  context.fillRect(0, 0, 64, 64)
  const sprite = new Sprite(new SpriteMaterial({
    map: new CanvasTexture(canvas), color: '#ffab66', opacity: strength,
    blending: AdditiveBlending, depthWrite: false, toneMapped: false,
  }))
  sprite.position.set(...position)
  sprite.scale.set(size, size, 1)
  group.add(sprite)
  return sprite
}

export function createLampBeam(group) {
  const glow = new Mesh(new PlaneGeometry(3.0, 2.5), new ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    toneMapped: false,
    uniforms: { intensity: { value: 0 }, amber: { value: new Color('#ffb36b') } },
    vertexShader: `
      varying vec2 beamUV;
      void main() {
        beamUV = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 beamUV;
      uniform float intensity;
      uniform vec3 amber;
      void main() {
        float belowBulb = 1.0 - beamUV.y;
        float width = 0.045 + belowBulb * 0.41;
        float softEdge = exp(-pow(abs(beamUV.x - 0.5) / width * 2.08, 2.0));
        float falloff = smoothstep(0.0, 0.12, belowBulb)
          * (1.0 - smoothstep(0.35, 0.99, belowBulb)) * (1.0 - belowBulb * 0.6);
        gl_FragColor = vec4(amber, intensity * softEdge * falloff);
        #include <colorspace_fragment>
      }
    `,
  }))
  glow.position.set(0, 1.17, 0)
  glow.renderOrder = 4
  group.add(glow)
  return glow
}
