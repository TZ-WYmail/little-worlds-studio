import gymnopedie from './audio/gymnopedie-no-1.mp3?url'
import avecSoin from './audio/avec-soin.mp3?url'

const playlist = [gymnopedie, avecSoin]

export function bindSoundtrack(signal) {
  const audio = document.querySelector('#soundtrack')
  const toggle = document.querySelector('#music-toggle')
  const state = toggle.querySelector('.music-state')
  const status = document.querySelector('#music-status')
  const listener = { signal }
  let track = 0
  let attempt = 0
  let enabled = false

  function pause() {
    attempt += 1
    enabled = false
    audio.pause()
    toggle.setAttribute('aria-pressed', 'false')
    state.textContent = 'Off'
  }

  function showError() {
    pause()
    status.textContent = '音乐暂时无法播放，请点 Music 重试。'
  }

  async function play() {
    const request = ++attempt
    enabled = true
    toggle.setAttribute('aria-pressed', 'true')
    state.textContent = '…'
    status.textContent = ''
    if (!audio.hasAttribute('src') || audio.error) audio.src = playlist[track]
    try {
      await audio.play()
      if (request === attempt) state.textContent = 'On'
    } catch {
      if (request === attempt) showError()
    }
  }

  toggle.addEventListener('click', () => {
    if (enabled) pause()
    else void play()
  }, listener)
  audio.addEventListener('ended', () => {
    if (!enabled) return
    track = (track + 1) % playlist.length
    audio.src = playlist[track]
    void play()
  }, listener)
  audio.addEventListener('pause', () => {
    if (enabled && audio.paused && !audio.ended) pause()
  }, listener)
  audio.addEventListener('error', () => {
    if (enabled && audio.error) showError()
  }, listener)
  signal.addEventListener('abort', pause, { once: true })
}
