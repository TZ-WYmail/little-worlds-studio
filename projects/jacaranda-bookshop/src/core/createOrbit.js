import { Quaternion, Vector3 } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

export function createOrbit(camera, canvas, config) {
  const controls = new OrbitControls(camera, canvas)
  controls.target.set(0, 2.2, 0)
  controls.enablePan = false
  controls.enableDamping = !config.reducedMotion
  const damping = 0.094
  controls.dampingFactor = damping
  controls.minPolarAngle = 0.39
  controls.maxPolarAngle = 1.43
  controls.minZoom = 0.75
  controls.maxZoom = 4.4
  controls.rotateSpeed = 0.58
  controls.zoomSpeed = 0.78
  controls.cursorStyle = 'grab'
  controls.update()
  controls.saveState()
  canvas.tabIndex = 0
  canvas.removeAttribute('role')
  canvas.setAttribute('aria-label', '交互式蓝花楹书店，用方向键旋转，加减键缩放')

  const homeDirection = controls.position0.clone().sub(controls.target0).normalize()
  const shopDirection = new Vector3(0.32, 0.26, 0.94).normalize()
  const crownDirection = new Vector3(-0.11, 0.22, 0.97).normalize()
  const rearDirection = new Vector3(0.28, 0.24, -0.93).normalize()
  const turn = new Quaternion()
  const direction = new Vector3()
  let transition
  let settling = false
  let updating = false
  let onChange = () => {}
  const markDirty = () => {
    if (!updating) {
      settling = controls.enableDamping
      onChange()
    }
  }
  controls.addEventListener('change', markDirty)

  function takeControl() {
    transition = undefined
    canvas.dispatchEvent(new Event('sceneviewchange', { bubbles: true }))
  }

  function onKey(event) {
    const nudge = 0.1047
    switch (event.key) {
      case 'ArrowLeft': controls.rotateLeft(nudge); break
      case 'ArrowRight': controls.rotateLeft(-nudge); break
      case 'ArrowUp': controls.rotateUp(nudge); break
      case 'ArrowDown': controls.rotateUp(-nudge); break
      case '=':
      case '+': controls.dollyIn(1 / 1.13); break
      case '-': controls.dollyOut(1 / 1.13); break
      default: return
    }
    event.preventDefault()
    takeControl()
  }

  controls.addEventListener('start', takeControl)
  canvas.addEventListener('keydown', onKey)

  function update(delta) {
    updating = true
    if (transition) {
      transition.progress = Math.min(1, transition.progress + delta / 0.79)
      const t = transition.progress
      const mix = t * t * (3 - 2 * t)
      turn.identity().slerp(transition.rotation, mix)
      direction.copy(transition.direction).applyQuaternion(turn)
      controls.target.lerpVectors(transition.target, transition.endTarget, mix)
      camera.position.copy(controls.target).addScaledVector(direction, transition.distance)
      camera.zoom = transition.zoom + (transition.endZoom - transition.zoom) * mix
      camera.updateProjectionMatrix()
      controls.update()
      if (t === 1) transition = undefined
    } else if (settling) {
      controls.dampingFactor = 1 - (1 - damping) ** (delta * 60)
      settling = controls.update()
      controls.dampingFactor = damping
    }
    updating = false
  }

  return {
    update,
    setChangeHandler(handler) { onChange = handler },
    hasTransition: () => Boolean(transition) || settling,
    setView(name, animate) {
      const { position, width, depth } = config.bookshop
      const tree = config.trees[0]
      const target = controls.target0.clone()
      let direction = homeDirection
      let zoom = 1
      if (name === 'shop') {
        target.set(position[0], position[1] + 1.89, position[2] + depth * 0.39)
        direction = shopDirection
        zoom = 2.15
      } else if (name === 'crown' && tree) {
        target.set(tree.position[0], tree.position[1] + tree.height * 0.74, tree.position[2])
        direction = crownDirection
        zoom = 2.33
      } else if (name === 'rear') {
        target.set(position[0] - width * 0.15, position[1] + 1.55, position[2] - depth * 0.51)
        direction = rearDirection
        zoom = 2.47
      } else if (name !== 'overview') {
        return false
      }

      const radius = controls.position0.distanceTo(controls.target0)
      // Consume pending damped movement before a preset takes ownership of the camera.
      if (settling) {
        const current = camera.position.clone()
        controls.enableDamping = false
        controls.update()
        camera.position.copy(current)
        controls.enableDamping = !config.reducedMotion
        controls.update()
        settling = false
      }
      if (animate) {
        const startDirection = camera.position.clone().sub(controls.target).normalize()
        transition = {
          direction: startDirection, rotation: new Quaternion().setFromUnitVectors(startDirection, direction),
          target: controls.target.clone(), endTarget: target, distance: radius,
          zoom: camera.zoom, endZoom: zoom, progress: 0,
        }
      } else {
        transition = undefined
        controls.target.copy(target)
        camera.position.copy(target).addScaledVector(direction, radius)
        camera.zoom = zoom
        camera.updateProjectionMatrix()
        controls.update()
      }
      return true
    },
    dispose() {
      canvas.removeEventListener('keydown', onKey)
      controls.dispose()
    },
  }
}
