import { ACESFilmicToneMapping, PCFShadowMap, WebGLRenderer } from 'three'

export function createRenderer(config) {
  const renderer = new WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, config.maxPixelRatio))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.autoUpdate = false
  renderer.shadowMap.needsUpdate = true
  renderer.shadowMap.type = PCFShadowMap
  renderer.toneMapping = ACESFilmicToneMapping
  renderer.domElement.setAttribute('role', 'img')
  renderer.domElement.setAttribute('aria-label', '树冠环绕两层街角书店的微缩场景')
  return renderer
}
