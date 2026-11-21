import { PlaneGeometry, UnsignedByteType } from 'three'
import { Reflector } from 'three/addons/objects/Reflector.js'

export function createWetReflection(renderer) {
  const reflector = new Reflector(new PlaneGeometry(13.68, 9.58), {
    textureWidth: 512,
    textureHeight: 384,
    multisample: 0,
    clipBias: 0.00035,
    shader: {
      uniforms: {
        color: { value: null }, tDiffuse: { value: null }, textureMatrix: { value: null },
        wetness: { value: 0 }, time: { value: 0 },
      },
      vertexShader: `
        uniform mat4 textureMatrix;
        varying vec4 reflectedUV;
        varying vec2 pavement;
        void main() {
          reflectedUV = textureMatrix * vec4(position, 1.0);
          pavement = vec2(position.x, -position.y);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float wetness, time;
        varying vec4 reflectedUV;
        varying vec2 pavement;

        float shimmer(vec2 p) {
          return sin(p.x * 86.0 + p.y * 142.0 + time * 9.5)
               * sin(p.y * 102.0 - p.x * 62.0 - time * 11.2);
        }

        void main() {
          vec2 p = pavement;
          float road = smoothstep(2.35, 2.64, p.y);
          float joint = abs(fract((p.y - 2.57) / 0.49 + 0.5) - 0.5);
          float face = mix(1.0, 1.0 - smoothstep(0.39, 0.48, joint), road);
          float spread = 0.58 + sin(p.x * 1.92 + p.y * 1.58) * 0.13
            + sin(p.x * 4.11 - p.y * 5.57) * 0.12 + sin(p.x * 13.0 + p.y * 18.0) * 0.10;
          float sheen = smoothstep(0.26, 0.71, spread) * face;
          float edge = (1.0 - smoothstep(6.50, 6.82, abs(p.x)))
                     * (1.0 - smoothstep(4.53, 4.78, abs(p.y)));
          vec2 jitter = vec2(shimmer(p) * 0.0037, shimmer(p.yx) * 0.0023);
          vec2 uv = reflectedUV.xy / reflectedUV.w + jitter;
          vec3 reflected = texture2D(tDiffuse, uv).rgb * 0.32;
          vec2 blur = vec2(0.008, 0.004);
          reflected += texture2D(tDiffuse, uv + vec2(blur.x, blur.y)).rgb * 0.20;
          reflected += texture2D(tDiffuse, uv - vec2(blur.x, blur.y)).rgb * 0.20;
          reflected += texture2D(tDiffuse, uv + vec2(blur.x * 1.9, -blur.y)).rgb * 0.14;
          reflected += texture2D(tDiffuse, uv - vec2(blur.x * 1.9, -blur.y)).rgb * 0.14;
          float brightness = max(reflected.r, max(reflected.g, reflected.b));
          float intensity = wetness * edge * sheen * mix(0.39, 0.78, road);
          // Bright windows and the street lamp survive the diffuse breakup of the wet stone.
          reflected *= vec3(0.92, 0.89, 0.96);
          gl_FragColor = vec4(reflected, intensity * (0.16 + 0.84 * smoothstep(0.021, 0.49, brightness)));
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
    },
  })
  if (renderer && !renderer.extensions.has('EXT_color_buffer_float')) {
    reflector.getRenderTarget().texture.type = UnsignedByteType
  }
  reflector.name = '湿石板反射'
  reflector.position.y = 0.033
  reflector.rotation.x = -Math.PI / 2
  reflector.material.transparent = true
  reflector.material.depthWrite = false
  reflector.renderOrder = 1
  reflector.visible = false

  return reflector
}
