import { Color, Mesh, PlaneGeometry, ShaderMaterial, Vector2 } from 'three'

export function createTwilightBackdrop() {
  const material = new ShaderMaterial({
    depthTest: false,
    depthWrite: false,
    toneMapped: false,
    uniforms: {
      resolution: { value: new Vector2(1, 1) },
      time: { value: 0 },
      heading: { value: 0 },
      elevation: { value: 0 },
      rain: { value: 0 },
      hour: { value: 1 },
      drift: { value: 0 },
      dayTop: { value: new Color('#6b98c0') },
      dayLow: { value: new Color('#c2d7db') },
      dayGround: { value: new Color('#8c9fa7') },
      nightTop: { value: new Color('#11162c') },
      nightLow: { value: new Color('#353956') },
      nightGround: { value: new Color('#22273d') },
      zenith: { value: new Color('#192444') },
      dusk: { value: new Color('#60668e') },
      afterglow: { value: new Color('#da9a83') },
      ground: { value: new Color('#353751') },
    },
    vertexShader: `
      varying vec2 screenUV;
      void main() {
        screenUV = uv;
        gl_Position = vec4(position.xy, 0.9999, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec2 resolution;
      uniform float time, heading, elevation, rain, hour, drift;
      uniform vec3 dayTop, dayLow, dayGround, nightTop, nightLow, nightGround;
      uniform vec3 zenith, dusk, afterglow, ground;
      varying vec2 screenUV;

      float randomValue(vec2 p) {
        vec3 q = fract(vec3(p.xyx) * 0.1031);
        q += dot(q, q.yzx + 33.33);
        return fract((q.x + q.y) * q.z);
      }

      float noiseValue(vec2 p) {
        vec2 cell = floor(p);
        vec2 fraction = fract(p);
        vec2 blend = fraction * fraction * (3.0 - 2.0 * fraction);
        return mix(
          mix(randomValue(cell), randomValue(cell + vec2(1, 0)), blend.x),
          mix(randomValue(cell + vec2(0, 1)), randomValue(cell + vec2(1, 1)), blend.x),
          blend.y
        );
      }

      void main() {
        vec2 p = screenUV;
        float aspect = resolution.x / resolution.y;
        float gold = 1.0 - abs(hour - 1.0);
        float blue = max(0.0, hour - 1.0);
        vec3 upper = mix(dayTop, zenith, gold) + (nightTop - dayTop) * blue;
        vec3 middle = mix(dayLow, dusk, gold) + (nightLow - dayLow) * blue;
        vec3 floorColor = mix(dayGround, ground, gold) + (nightGround - dayGround) * blue;
        upper = mix(upper, vec3(0.028, 0.040, 0.070) * (1.12 - 0.34 * blue), rain * 0.77);
        middle = mix(middle, vec3(0.098, 0.140, 0.203) * (1.04 - 0.39 * blue), rain * 0.79);
        floorColor = mix(floorColor, vec3(0.030, 0.048, 0.080), rain * 0.68);
        float skyHeight = p.y - elevation;
        vec3 color = mix(middle, upper, smoothstep(0.39, 1.0, skyHeight));
        float horizon = 0.49 + 0.021 * p.x;
        float glow = exp(-pow((skyHeight - horizon) * 3.65, 2.0)
                         -pow((p.x - 0.14 - 0.24 * sin(heading)) * aspect * 1.15, 2.0));
        float facesAfterglow = smoothstep(-0.32, 0.61, cos(heading + 0.38));
        glow *= facesAfterglow;
        color = mix(color, afterglow, 0.69 * glow * gold * (1.0 - rain * 0.92));

        // Thin clouds pick up the remaining light at their lower edges.
        vec2 bands = vec2(p.x * aspect * 2.6 + sin(heading) * 1.4 - drift * 0.13 - time * 0.025, skyHeight * 29.0 + p.x * 0.8 + (1.0 - cos(heading)) * 0.61);
        float streak = noiseValue(bands) * 0.74 + noiseValue(bands * 2.1) * 0.26;
        float cloud = smoothstep(0.51, 0.88, streak);
        cloud *= smoothstep(0.45, 0.57, p.y) * (1.0 - smoothstep(0.71, 0.89, p.y));
        color = mix(color, upper, cloud * (0.16 + rain * 0.31));
        color = mix(color, afterglow, cloud * glow * gold * 0.23 * (1.0 - rain));

        // The rear horizon is a muted blue ridge softened by distance.
        float ridge = 0.457 + 0.026 * noiseValue(vec2(p.x * 6.7, 13.0))
                           + 0.021 * noiseValue(vec2(p.x * 12.0, 2.0));
        float landscape = (1.0 - smoothstep(ridge - 0.016, ridge + 0.012, p.y))
                        * smoothstep(0.29, 0.40, p.y);
        color = mix(color, middle * 0.67, landscape * 0.33);

        float floorFade = 1.0 - smoothstep(0.08, 0.52, p.y);
        color = mix(color, floorColor, floorFade * 0.99);
        vec2 edge = (p - vec2(0.46, 0.55)) * vec2(1.25, 0.95);
        color *= 1.0 - smoothstep(0.30, 0.81, length(edge)) * 0.23;
        color += (randomValue(gl_FragCoord.xy) - 0.5) * 0.0019;
        gl_FragColor = vec4(color, 1.0);
        #include <colorspace_fragment>
      }
    `,
  })

  const backdrop = new Mesh(new PlaneGeometry(2, 2), material)
  backdrop.frustumCulled = false
  backdrop.renderOrder = -1000
  return backdrop
}
