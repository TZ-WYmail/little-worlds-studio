import { Color, DirectionalLight, HemisphereLight } from 'three'

const palette = [
  { sky: '#d4e7ff', ground: '#c6ac97', key: '#fff5e6', rim: '#fff6df', skyPower: 1.8, keyPower: 2.06, rimPower: 1.15, fill: 0.48, x: -7, y: 13 },
  { sky: '#acbaf0', ground: '#98797e', key: '#ffdfc5', rim: '#ffc2ae', skyPower: 0.65, keyPower: 1.29, rimPower: 1.83, fill: 0.30, x: -6, y: 10 },
  { sky: '#8296db', ground: '#504861', key: '#adc2ff', rim: '#a2a5ff', skyPower: 0.30, keyPower: 0.39, rimPower: 0.96, fill: 0.16, x: 3, y: 8 },
].map((item) => ({
  ...item, sky: new Color(item.sky), ground: new Color(item.ground), key: new Color(item.key), rim: new Color(item.rim),
}))

export function createLighting(scene, { shadowMapSize }) {
  const sky = new HemisphereLight()
  const key = new DirectionalLight()
  key.castShadow = true
  key.shadow.mapSize.set(shadowMapSize, shadowMapSize)
  Object.assign(key.shadow.camera, { left: -11, right: 11, top: 11, bottom: -9, near: 1, far: 39 })
  key.shadow.normalBias = 0.014
  key.shadow.radius = 3.0

  const rim = new DirectionalLight()
  rim.position.set(-8, 8, -7)
  const bounce = new DirectionalLight('#a9b6ff')
  bounce.position.set(10, 8, 3)
  scene.add(sky, key, rim, bounce)

  const wetSky = new Color('#9fb5da')
  const wetKey = new Color('#b1c3de')
  const blend = (a, b, mix) => a + (b - a) * mix
  return (time, rain) => {
    const index = Math.min(1, Math.floor(time))
    const t = time - index
    const a = palette[index]
    const b = palette[index + 1]
    sky.color.copy(a.sky).lerp(b.sky, t).lerp(wetSky, rain * 0.65)
    sky.groundColor.copy(a.ground).lerp(b.ground, t)
    sky.intensity = blend(a.skyPower, b.skyPower, t) * (1 - rain * 0.12)
    key.color.copy(a.key).lerp(b.key, t).lerp(wetKey, rain * 0.8)
    key.intensity = blend(a.keyPower, b.keyPower, t) * (1 - rain * 0.45)
    key.position.set(blend(a.x, b.x, t), blend(a.y, b.y, t), 11)
    key.shadow.intensity = 0.88 - rain * 0.12
    rim.color.copy(a.rim).lerp(b.rim, t)
    rim.intensity = blend(a.rimPower, b.rimPower, t) * (1 - rain * 0.40)
    bounce.intensity = blend(a.fill, b.fill, t)
  }
}
