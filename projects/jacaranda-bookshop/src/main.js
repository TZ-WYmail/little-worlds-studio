import { createScene } from './index.js'
import { bindSoundtrack } from './soundtrack.js'
import poster from './styles/twilight-poster.webp?url'
import './styles/main.css'

const container = document.querySelector('#scene')
const frame = document.querySelector('#scene-frame')
const status = document.querySelector('#scene-status')
let bookshop
let events

try {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let moving = !reducedMotion.matches
  bookshop = createScene(container, {
    interactive: true, motion: moving, reducedMotion: reducedMotion.matches, maxPixelRatio: 1.5,
  })
  const toolbar = document.querySelector('#scene-controls')
  const instructions = document.querySelector('#view-instructions')
  const motionButton = document.querySelector('#motion-toggle')
  events = new AbortController()
  const listener = { signal: events.signal }
  const views = [...toolbar.querySelectorAll('[data-view]')]
  bindSoundtrack(events.signal)

  function select(buttons, selected) {
    for (const button of buttons) button.setAttribute('aria-pressed', String(button === selected))
  }
  function bindChoices(key, apply) {
    const buttons = [...toolbar.querySelectorAll(`[data-${key}]`)]
    for (const button of buttons) button.addEventListener('click', () => {
      const value = button.dataset[key]
      if (apply(value) === false) return
      select(buttons, button)
      frame.dataset[key] = value
    }, listener)
  }
  function setMotion(enabled) {
    moving = enabled
    bookshop.setMotion(enabled)
    motionButton.textContent = moving ? 'Pause motion' : 'Play motion'
    motionButton.setAttribute('aria-label', moving ? 'Pause motion 暂停动效' : 'Play motion 继续动效')
    frame.dataset.motion = moving ? 'on' : 'off'
  }

  bindChoices('view', (name) => {
    if (!bookshop.setView(name)) return false
    if (name === 'rear' && frame.getBoundingClientRect().top < -frame.clientHeight / 3) {
      frame.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'auto' : 'smooth' })
    }
    return true
  })
  bindChoices('time', (name) => bookshop.setTimeOfDay(name))
  bindChoices('weather', (name) => bookshop.setWeather(name))
  const wind = document.querySelector('#wind')
  const windValue = document.querySelector('#wind-value')
  wind.addEventListener('input', () => {
    bookshop.setWind(wind.valueAsNumber / 100)
    windValue.textContent = `${wind.value}%`
  }, listener)
  const petals = document.querySelector('#petals')
  petals.addEventListener('change', () => bookshop.setPetals(petals.checked), listener)
  container.addEventListener('sceneviewchange', () => {
    select(views, null)
    frame.dataset.view = 'custom'
  }, listener)
  motionButton.addEventListener('click', () => setMotion(!moving), listener)
  reducedMotion.addEventListener('change', ({ matches }) => setMotion(!matches), listener)
  setMotion(moving)
  toolbar.hidden = false
  instructions.hidden = false
  container.querySelector('canvas').setAttribute('aria-describedby', instructions.id)
  status.hidden = true
  container.dataset.ready = 'true'
  if (import.meta.hot) import.meta.hot.dispose(() => {
    events.abort()
    bookshop.dispose()
  })
} catch (error) {
  events?.abort()
  bookshop?.dispose()
  const image = document.createElement('img')
  image.src = poster
  image.alt = '暮色中的春页书店，橱窗与路灯照亮蓝花楹旁的街角'
  container.replaceChildren(image)
  status.textContent = '当前浏览器无法启动 3D 场景，正在显示静态预览。'
  console.warn('Jacaranda Bookshop: WebGL 初始化失败', error)
}
