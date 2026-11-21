import { Color, Fog, Scene, Vector3 } from 'three'
import { resolveConfig } from '../config/sceneConfig.js'
import { disposeAssets } from '../utils/dispose.js'
import { createContactShadow } from '../world/createContactShadow.js'
import { createWetReflection } from '../world/createWetReflection.js'
import { createWeather } from '../world/createWeather.js'
import { createWorld } from '../world/createWorld.js'
import { createCamera } from './createCamera.js'
import { createLighting } from './createLighting.js'
import { createOrbit } from './createOrbit.js'
import { createRenderer } from './createRenderer.js'
import { createTwilightBackdrop } from './createTwilightBackdrop.js'

const hours = { day: 0, evening: 1, night: 2, golden: 1, blue: 2 }
const weatherModes = { clear: 0, dusk: 0, rain: 1 }
function toward(current, target, step) {
  if (current === target) return current
  const distance = target - current
  return Math.abs(distance) <= step ? target : current + Math.sign(distance) * step
}

export function createScene(container, options = {}) {
  const config = resolveConfig(options)
  const renderer = createRenderer(config)
  const canvas = renderer.domElement
  const scene = new Scene()
  let ownedMaterials = {}
  let orbit
  let observer
  let frame = 0
  let disposed = false
  let draw = () => {}
  let visibilityChanged = () => {}
  let motion = config.motion
  let animatePetals = motion
  let viewportVisible = true
  let viewportObserver

  function dispose() {
    if (disposed) return
    disposed = true
    cancelAnimationFrame(frame)
    observer?.disconnect()
    viewportObserver?.disconnect()
    orbit?.dispose()
    document.removeEventListener('visibilitychange', visibilityChanged)
    canvas.removeEventListener('webglcontextrestored', onContextRestored)
    disposeAssets(scene, Object.values(ownedMaterials))
    renderer.dispose()
    renderer.forceContextLoss()
    canvas.remove()
  }

  function onContextRestored() {
    scene.traverse((object) => {
      if (object.isLight && object.shadow) object.shadow.needsUpdate = true
    })
    renderer.shadowMap.needsUpdate = true
    draw()
    visibilityChanged()
  }

  try {
    const backdrop = config.background == null ? createTwilightBackdrop() : null
    if (backdrop) scene.add(backdrop)
    else scene.background = new Color(config.background)

    const haze = new Fog('#849db1', 70, 150)
    scene.fog = haze
    const built = createWorld(config)
    ownedMaterials = built.materials
    scene.add(built.world, createContactShadow())
    const lightMood = createLighting(scene, config)
    const { camera, resize } = createCamera(built.world, config)
    if (config.interactive) orbit = createOrbit(camera, canvas, config)
    const weather = createWeather(config.trees, config.bookshop)
    const reflection = createWetReflection(renderer)
    scene.add(weather.group, reflection)
    for (const effect of weather.group.children) effect.layers.set(1)
    camera.layers.enable(1)
    reflection.getReflectionCamera(camera).layers.disable(1)

    const heading = new Vector3()
    const homeHeading = Math.atan2(camera.position.x, camera.position.z)
    camera.getWorldDirection(heading)
    const homePitch = heading.y
    const dryStone = new Color('#ffffff')
    const wetStone = new Color('#b8c6d7')
    const dayGlass = new Color('#667786')
    const nightGlass = ownedMaterials.upperGlass.color.clone()

    let width = 0
    let height = 0
    let clock = 0
    let travel = 0
    let lastRender = 0
    let targetHour = Object.hasOwn(hours, config.timeOfDay) ? hours[config.timeOfDay] : 1
    let targetRain = Object.hasOwn(weatherModes, config.weather) ? weatherModes[config.weather] : 0
    let hour = targetHour
    let rainAmount = targetRain
    let lastHour = -1
    let lastRain = -1
    let wind = config.wind
    let petals = config.petals

    draw = () => {
      const nextWidth = container.clientWidth
      const nextHeight = container.clientHeight
      if (disposed || !nextWidth || !nextHeight || renderer.getContext().isContextLost()) return
      if (nextWidth !== width || nextHeight !== height) {
        width = nextWidth
        height = nextHeight
        resize(width, height)
        backdrop?.material.uniforms.resolution.value.set(width, height)
        renderer.setSize(width, height, false)
      }
      if (hour !== lastHour || rainAmount !== lastRain) {
        if (lastHour !== hour) renderer.shadowMap.needsUpdate = true
        lastHour = hour
        lastRain = rainAmount
        lightMood(hour, rainAmount)
        haze.near = 70 - 27 * rainAmount
        haze.far = 150 - 49 * rainAmount
        ownedMaterials.streetStones.color.copy(dryStone).lerp(wetStone, rainAmount)
        ownedMaterials.streetStones.roughness = 0.69 - 0.40 * rainAmount
        ownedMaterials.upperGlass.color.copy(dayGlass).lerp(nightGlass, Math.min(1, hour))
      }

      const electric = 0.965 + 0.036 * Math.sin(clock * 2.83)
        + 0.026 * Math.sin(clock * 5.11 + 0.9) + 0.018 * Math.sin(clock * 11.17)
      const powered = Math.min(1, hour * 0.84)
      const roomPower = powered * (0.96 + 0.04 * electric)
      ownedMaterials.upperGlass.emissiveIntensity = roomPower * 1.12
      built.updateInterior(roomPower)
      built.updateLamps(powered * electric, rainAmount, camera)

      if (backdrop) {
        const { uniforms } = backdrop.material
        camera.getWorldDirection(heading)
        uniforms.heading.value = Math.atan2(-heading.x, -heading.z) - homeHeading
        uniforms.elevation.value = (homePitch - heading.y) * 0.31
        uniforms.time.value = clock
        uniforms.drift.value = travel
        uniforms.rain.value = rainAmount
        uniforms.hour.value = hour
      }
      weather.update(clock, rainAmount, animatePetals && petals, wind, travel, powered * electric)
      reflection.visible = rainAmount > 0.015
      reflection.material.uniforms.wetness.value = rainAmount
      reflection.material.uniforms.time.value = clock
      renderer.render(scene, camera)
    }

    function transitioning() {
      return orbit?.hasTransition() || hour !== targetHour ||
        rainAmount !== targetRain
    }

    function requestFrame() {
      if (!frame && !disposed && !document.hidden && viewportVisible &&
        !renderer.getContext().isContextLost() && (motion || transitioning())) {
        frame = requestAnimationFrame(tick)
      }
    }

    function tick(timestamp) {
      frame = 0
      const elapsed = timestamp - lastRender
      if (!lastRender || elapsed >= (orbit?.hasTransition() ? 14 : 28)) {
        const delta = lastRender ? Math.min(elapsed / 1000, 0.08) : 1 / 30
        lastRender = timestamp
        if (motion) {
          clock += delta
          travel += delta * (0.30 + wind * 2.07 + rainAmount * 0.67)
          const gust = wind * (0.012 + rainAmount * 0.008)
          built.trees.forEach((tree, index) => {
            tree.rotation.x = Math.sin(travel * 0.86 + index * 2.1) * gust
            tree.rotation.z = Math.sin(travel * 0.71 + index * 1.7) * gust * 0.84
          })
        }
        orbit?.update(delta)
        hour = toward(hour, targetHour, delta / 0.58)
        rainAmount = toward(rainAmount, targetRain, delta / 0.66)
        draw()
      }
      if (motion || transitioning()) requestFrame()
      else lastRender = 0
    }

    orbit?.setChangeHandler(() => {
      if (!motion && !transitioning()) draw()
      else requestFrame()
    })
    visibilityChanged = () => {
      cancelAnimationFrame(frame)
      frame = 0
      lastRender = 0
      requestFrame()
    }

    canvas.style.display = 'block'
    canvas.style.width = '100%'
    canvas.style.height = '100%'
    canvas.addEventListener('webglcontextrestored', onContextRestored)
    document.addEventListener('visibilitychange', visibilityChanged)
    container.append(canvas)
    observer = new ResizeObserver(draw)
    observer.observe(container)
    if (typeof IntersectionObserver === 'function') {
      viewportObserver = new IntersectionObserver(([entry]) => {
        viewportVisible = entry.isIntersecting
        visibilityChanged()
      })
      viewportObserver.observe(container)
    }
    draw()
    requestFrame()

    const useTransitions = () => motion && !config.reducedMotion
    return {
      dispose,
      setView(name) {
        if (disposed || !orbit?.setView(name, useTransitions())) return false
        draw()
        requestFrame()
        return true
      },
      setWeather(name) {
        if (disposed || !Object.hasOwn(weatherModes, name)) return false
        targetRain = weatherModes[name]
        if (!useTransitions()) rainAmount = targetRain
        draw()
        requestFrame()
        return true
      },
      setTimeOfDay(name) {
        if (disposed || !Object.hasOwn(hours, name)) return false
        targetHour = hours[name]
        if (!useTransitions()) hour = targetHour
        draw()
        requestFrame()
        return true
      },
      setWind(value) {
        if (disposed || !Number.isFinite(value)) return false
        wind = Math.max(0, Math.min(1, value))
        draw()
        return true
      },
      setPetals(enabled) {
        if (disposed) return
        petals = Boolean(enabled)
        animatePetals = true
        draw()
      },
      setMotion(enabled) {
        if (disposed) return
        motion = Boolean(enabled)
        animatePetals ||= motion
        if (motion) requestFrame()
        else if (!transitioning()) visibilityChanged()
      },
    }
  } catch (error) {
    dispose()
    throw error
  }
}
