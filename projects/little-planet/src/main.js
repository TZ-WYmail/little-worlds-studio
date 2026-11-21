import {
  ACESFilmicToneMapping, PCFShadowMap, Raycaster, Scene, Vector2, Vector3, WebGLRenderer,
} from 'three'
import { CameraDirector } from './core/CameraDirector.js'
import { DailyRoutine, roseNeedsCover } from './core/DailyRoutine.js'
import { formatHour, TimeEngine } from './core/TimeEngine.js'
import { createAtmosphere, paintSky } from './core/createAtmosphere.js'
import { createInteractionParticles } from './core/createInteractionParticles.js'
import { entries, StorySequence } from './core/StorySequence.js'
import { disposeAssets } from './core/dispose.js'
import { createLandmarks } from './models/createLandmarks.js'
import { createTerrain } from './models/createTerrain.js'
import { createTraveler } from './models/createTraveler.js'
import fallback from './assets/fallback.webp?url'
import score from './assets/canon-event.mp3?url'
import './style.css'

const byId=(id)=>document.getElementById(id)
const viewport=byId('viewport')
const sky=byId('sky')
const skyContext=sky.getContext('2d',{ alpha:false })
const notice=byId('notice')
const clock=new TimeEngine()
const signalController=new AbortController()
const listener={ signal:signalController.signal }
const media=matchMedia('(prefers-reduced-motion: reduce)')
const settings=byId('settings')
const timeInput=byId('scrubber')
const timeOutput=byId('time')
const chapter=byId('chapter')
const dailyNote=byId('daily-note')
const quality=byId('quality')
const motionSwitch=byId('reduced')
const play=byId('play')
const storyCard=byId('story-card')
const storyAction=byId('story-action')
const glassButton=byId('protect-rose')
const storyProgress=byId('story-progress')
const monologue=byId('monologue')
const monologueButton=byId('toggle-monologue')
const monologueText=byId('monologue-text')
const presets=[...document.querySelectorAll('[data-hour]')]
let noteTimer=0
let cleanup=()=>{}

function say(message, delay = 3600) {
  clearTimeout(noteTimer)
  notice.textContent=message
  notice.hidden=false
  if (delay) noteTimer=setTimeout(()=>{ notice.hidden=true },delay)
}
function useControl(id, action) { byId(id).addEventListener('click',action,listener) }

function bindAudio() {
  const button=byId('music')
  const audio=byId('soundtrack')
  useControl('music',async()=>{
    if (audio.paused) {
      if (!audio.src || audio.error) audio.src=score
      try { await audio.play() } catch (error) {
        if (error.name !== 'AbortError') say('Music is unavailable. Try again.')
      }
    } else audio.pause()
  })
  audio.addEventListener('playing',()=>button.setAttribute('aria-pressed','true'),listener)
  audio.addEventListener('pause',()=>button.setAttribute('aria-pressed','false'),listener)
  signalController.signal.addEventListener('abort',()=>audio.pause(),{ once:true })
}

function mount() {
  const renderer=new WebGLRenderer({ alpha:true, antialias:true, powerPreference:'high-performance' })
  renderer.autoClear=false
  renderer.toneMapping=ACESFilmicToneMapping
  renderer.toneMappingExposure=1.02
  renderer.shadowMap.enabled=true
  renderer.shadowMap.type=PCFShadowMap
  renderer.shadowMap.autoUpdate=false
  renderer.shadowMap.needsUpdate=true
  const canvas=renderer.domElement
  canvas.tabIndex=0
  canvas.setAttribute('aria-label','B-612. Use arrow keys to orbit and plus or minus to zoom.')
  viewport.append(canvas)
  const scene=new Scene()
  const planet=createTerrain(scene)
  const traveler=createTraveler(planet)
  traveler.anchor.userData.landmark='traveler'
  const landmarks=createLandmarks(planet)
  const atmospheric=createAtmosphere(scene,landmarks.volcanoes,innerWidth<700)
  function render(view) {
    const updateShadows = renderer.shadowMap.needsUpdate
    renderer.clear()
    renderer.render(atmospheric.skyScene,view)
    // The planet owns foreground depth even when its cinematic camera crosses a celestial body.
    renderer.clearDepth()
    renderer.shadowMap.needsUpdate = updateShadows
    renderer.render(scene,view)
  }
  const particles=createInteractionParticles(scene)
  const camera=new CameraDirector(canvas,media.matches)
  const raycaster=new Raycaster()
  const pointer=new Vector2()
  let economy=false
  let throttled=false
  let reduced=media.matches
  let needsFrame=true
  let frame=0
  let last=0
  let elapsed=0
  let stepCount=0
  let slowFrames=0
  let shadowTime=0
  let previousHour=-1
  let skyStamp=-1
  let skyHeading=0
  let lastClockMinute=-1
  let firstFrame=true
  let startPointer=null
  let protectByClock=false
  let roseNight=false
  let inputSettlesAt=0
  let timelinePointer=null
  let dailyBloom=0
  const routine=new DailyRoutine()
  const trackTarget=new Vector3()
  const roseDestination=new Vector3()
  const roseGaze=new Vector3()
  const trackDelta=new Vector3()
  const holdGlass=(side,point)=>landmarks.rose.gripPosition(side,point)

  function setEconomy() {
    economy=quality.value==='low' || (quality.value==='auto' && (innerWidth<700 || throttled))
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,economy ? 1 : 1.5))
    resize()
  }
  function resize() {
    const { clientWidth:width,clientHeight:height }=viewport
    if (!width || !height) return
    renderer.setSize(width,height,false)
    camera.resize(width,height)
    sky.width=innerWidth
    sky.height=innerHeight
    skyStamp=-1
    needsFrame=true
  }
  const observer=new ResizeObserver(resize)
  observer.observe(viewport)
  window.addEventListener('resize',setEconomy,listener)

  const currentStory=new StorySequence(clock,camera,()=>updateStory())
  const shortcuts=byId('object-shortcuts')
  const roots=new Map([traveler.anchor,...landmarks.picks].map(root=>[root.userData.landmark,root]))
  const shortcutButtons=new Map()
  for (const [id,info] of Object.entries(entries)) {
    const root=roots.get(id)
    if (!root) continue
    const button=document.createElement('button')
    button.type='button'
    button.id=`look-${id}`
    button.textContent=info.label
    button.setAttribute('aria-pressed','false')
    button.setAttribute('aria-controls','story-card')
    if (id.startsWith('seed-')) button.setAttribute('aria-describedby','seed-count')
    button.addEventListener('click',()=>currentStory.inspect(root),listener)
    shortcutButtons.set(id,button)
    shortcuts.append(button)
  }
  let voicedObjectId=null
  function showMonologue(expanded) {
    monologueButton.setAttribute('aria-expanded',String(expanded))
    monologueText.hidden=!expanded
  }
  useControl('toggle-monologue',()=>{
    const expanded=monologueText.hidden
    showMonologue(expanded)
    if (expanded && innerWidth<=690) {
      monologue.scrollIntoView({ block:'nearest',behavior:reduced?'auto':'smooth' })
    }
  })
  function updateStory() {
    const story=currentStory.current
    const playing=currentStory.playback
    const info=story ? entries[story.id ?? story.name] : null
    const voice=info?.voice
    const objectId=voice ? story.id : null
    const changedObject=objectId!==voicedObjectId
    if (changedObject) {
      showMonologue(false)
      monologueText.textContent=voice ?? ''
      voicedObjectId=objectId
    }
    monologue.hidden=!voice
    document.body.dataset.landmark=String(Boolean(voice))
    document.body.dataset.story=String(Boolean(story))
    storyCard.hidden=!story
    byId('rose-quote').hidden=story?.name!=='rose'
    const seedCount=byId('seed-count')
    const progress=`${currentStory.cleared} of ${landmarks.seedlings.length} sprouts cleared`
    if (seedCount.value!==progress) seedCount.value=progress
    for (const [id,button] of shortcutButtons) {
      button.setAttribute('aria-pressed',String(id===story?.id))
      if (id.startsWith('seed-')) button.dataset.cleared=String(!roots.get(id).visible)
    }
    storyProgress.hidden=!playing
    storyProgress.value=playing ? playing.time/playing.duration : 0
    if (!story) return
    byId('story-title').textContent=info.title
    byId('story-description').textContent=story.finished
      ? ({
          rose:'The rose has had her water.',
          seed:`${info.description} This sprout has been cleared. ${progress}.`,
          sunset:'The stars are out. You can keep exploring.',
          showcase:'The day is over. Replay it from the View & capture menu.',
        })[story.name]
      : info.description
    storyAction.hidden=!info.action || story.finished
    storyAction.disabled=Boolean(playing)
    storyAction.textContent=info.action||''
    updateGlassButton(clock.sample())
    needsFrame=true
    if (innerWidth<=690 && !playing && (!story.finished || changedObject)) {
      storyCard.scrollIntoView({ block:'nearest',behavior:reduced?'auto':'smooth' })
    }
  }
  function updateGlassButton(mood) {
    glassButton.hidden=currentStory.current?.name!=='rose' || mood.night<.58 || Boolean(currentStory.playback)
    const covered=currentStory.glass ?? protectByClock
    glassButton.textContent=covered ? 'Uncover the rose' : 'Cover the rose'
    glassButton.setAttribute('aria-pressed',String(covered))
  }
  function readClock(mood) {
    const minute=Math.round(clock.hour*60)%1440
    if (minute!==lastClockMinute) {
      const label=formatHour(clock.hour)
      timeOutput.value=label
      timeInput.value=minute
      timeInput.style.setProperty('--elapsed',`${minute/1439*100}%`)
      timeInput.setAttribute('aria-valuetext',`${label} ${mood.chapter.english}`)
      chapter.textContent=mood.chapter.english
      for (const preset of presets) {
        const hour=Number(preset.dataset.hour)
        preset.setAttribute('aria-pressed',String(Math.abs(clock.hour-hour)<.017))
      }
      updateGlassButton(mood)
      lastClockMinute=minute
    }
    play.setAttribute('aria-pressed',String(clock.playing))
    play.setAttribute('aria-label',clock.playing ? 'Pause day cycle' : 'Play day cycle')
    const activity=routine.label
    if (dailyNote.textContent!==activity) {
      dailyNote.textContent=activity
      dailyNote.hidden=!activity
    }
    if (currentStory.playback) storyProgress.value=currentStory.playback.time/currentStory.playback.duration
  }
  function setMotion(value) {
    reduced=value
    motionSwitch.checked=value
    camera.reduced=value
    camera.orbit.enableDamping=!value
    needsFrame=true
  }
  media.addEventListener('change',({ matches })=>setMotion(matches),listener)
  motionSwitch.addEventListener('change',()=>setMotion(motionSwitch.checked),listener)
  quality.addEventListener('change',setEconomy,listener)
  setMotion(reduced)
  setEconomy()
  canvas.addEventListener('keydown',(event)=>camera.keyboard(event),listener)
  camera.orbit.addEventListener('change',()=>{ needsFrame=true })

  function pick(event) {
    const bounds=canvas.getBoundingClientRect()
    pointer.set((event.clientX-bounds.x)/bounds.width*2-1,1-(event.clientY-bounds.y)/bounds.height*2)
    raycaster.setFromCamera(pointer,camera.camera)
    const clicked=raycaster.intersectObjects([planet.children[0],...landmarks.picks.filter(root=>root.visible),traveler.anchor],true)[0]
    let target=clicked?.object
    while (target && !target.userData.landmark) target=target.parent
    if (target) currentStory.inspect(target)
  }
  canvas.addEventListener('pointerdown',event=>{
    if (event.isPrimary && event.button===0) startPointer={ x:event.clientX,y:event.clientY,id:event.pointerId }
    else startPointer=null
  },listener)
  canvas.addEventListener('pointercancel',()=>{ startPointer=null },listener)
  canvas.addEventListener('pointerup',event=>{
    if (startPointer?.id===event.pointerId && Math.hypot(startPointer.x-event.clientX,startPointer.y-event.clientY)<7) pick(event)
    startPointer=null
  },listener)
  canvas.addEventListener('dblclick',()=>{ if (document.body.dataset.clean==='true') toggleClean() },listener)

  useControl('explore',()=>{
    currentStory.stop()
    canvas.focus({ preventScroll:true })
    viewport.scrollIntoView({ block:'nearest',behavior:reduced?'auto':'smooth' })
  })
  useControl('time-travel',()=>{
    timeInput.focus({ preventScroll:true })
    byId('clock-panel').scrollIntoView({ block:'nearest',behavior:reduced?'auto':'smooth' })
  })
  useControl('sunset',()=>currentStory.begin('sunset',20))
  useControl('showcase',()=>{
    settings.open=false
    currentStory.begin('showcase',24)
  })
  function closeStory() {
    const previous=currentStory.current
    currentStory.stop(!previous?.finished)
    shortcutButtons.get(previous?.id)?.focus({ preventScroll:true })
  }
  useControl('close-story',closeStory)
  useControl('story-action',()=>{
    currentStory.action()
    if (innerWidth<=690) viewport.scrollIntoView({ block:'center',behavior:reduced?'auto':'smooth' })
  })
  useControl('protect-rose',()=>{
    currentStory.glass=!(currentStory.glass ?? protectByClock)
    needsFrame=true
    updateGlassButton(clock.sample())
  })

  function overrideTime() {
    if (currentStory.playback) currentStory.stop(false)
    clock.playing=false
    currentStory.glass=null
    routine.reset()
    inputSettlesAt=performance.now()+190
    needsFrame=true
  }
  timeInput.addEventListener('input',()=>{
    overrideTime()
    clock.set(Number(timeInput.value)/60)
  },listener)
  timeInput.addEventListener('pointerdown',event=>{
    if (event.isPrimary && event.button===0) timelinePointer=event.pointerId
  },listener)
  function releaseTimeline(event) {
    if (event.pointerId===timelinePointer) timelinePointer=null
  }
  window.addEventListener('pointerup',releaseTimeline,listener)
  window.addEventListener('pointercancel',releaseTimeline,listener)
  window.addEventListener('blur',()=>{ timelinePointer=null },listener)
  for (const button of presets) {
    button.addEventListener('click',()=>{
      overrideTime()
      const hour=Number(button.dataset.hour)
      if (reduced) clock.set(hour)
      else clock.travel(hour)
    },listener)
  }
  useControl('play',()=>{
    if (currentStory.playback) currentStory.stop(false)
    clock.playing=!clock.playing
    needsFrame=true
  })
  byId('speed').addEventListener('change',event=>{ clock.speed=Number(event.target.value) },listener)
  function toggleClean() {
    const active=document.body.dataset.clean!=='true'
    document.body.dataset.clean=String(active)
    settings.open=false
    if (active) say('Press Esc or double-tap the planet to restore the interface.',2600)
    else notice.hidden=true
    resize()
  }
  useControl('clean-view',toggleClean)
  window.addEventListener('keydown',event=>{
    if (event.key==='Escape') {
      if (settings.open) settings.open=false
      else if (document.body.dataset.clean==='true') toggleClean()
      else if (!monologueText.hidden) {
        showMonologue(false)
        monologueButton.focus({ preventScroll:true })
      }
      else if (currentStory.current) closeStory()
    }
  },listener)

  function exportPNG(portrait) {
    settings.open=false
    const width=portrait ? 1200 : 1600
    const height=portrait ? 1600 : 1080
    const renderCamera=camera.camera.clone()
    renderCamera.aspect=width/height
    if (portrait) {
      const target=new Vector3(0,.83,0)
      renderCamera.position.set(5.3,5.7,12.9)
      renderCamera.lookAt(target)
    }
    renderCamera.updateProjectionMatrix()
    const image=document.createElement('canvas')
    image.width=width
    image.height=height
    const context=image.getContext('2d')
    paintSky(context,width,height,clock.sample(),elapsed)
    const ratio=renderer.getPixelRatio()
    renderer.setPixelRatio(1)
    try {
      renderer.setSize(width,height,false)
      atmospheric.update(clock.sample(),elapsed,economy,renderCamera.aspect)
      render(renderCamera)
      context.drawImage(canvas,0,0,width,height)
    } finally {
      renderer.setPixelRatio(ratio)
      resize()
    }
    image.toBlob(blob=>{
      if (!blob) { say('The image could not be exported. Try again.'); return }
      const url=URL.createObjectURL(blob)
      const link=document.createElement('a')
      link.href=url
      link.download=`little-planet-${formatHour(clock.hour).replace(':','')}${portrait?'-3x4':''}.png`
      link.click()
      setTimeout(()=>URL.revokeObjectURL(url),3000)
    },'image/png')
  }
  useControl('png',()=>exportPNG(false))
  useControl('cover',()=>exportPNG(true))

  function tick(now) {
    frame=0
    if (document.hidden) return
    frame=requestAnimationFrame(tick)
    if (!last) last=now-16.67
    const interval=now-last
    if (economy && interval<28 && !camera.transition) return
    last=now
    const delta=Math.min(.05,interval/1000)
    if (!economy && quality.value==='auto') {
      stepCount+=1
      if (interval>36) slowFrames+=1
      if (stepCount===180) {
        if (slowFrames>112) { throttled=true; setEconomy() }
        stepCount=0
        slowFrames=0
      }
    }
    if (!reduced) elapsed+=delta
    clock.update(delta,routine.clockRateLimit(clock.hour))
    const storyMotion=currentStory.update(delta,landmarks)
    const mood=clock.sample()
    const inspection=currentStory.current?.name
    const coverTime=roseNeedsCover(clock.hour)
    if (roseNight && !coverTime) currentStory.glass=null
    roseNight=coverTime
    const routineAction=routine.update(delta,clock.hour,{
      enabled:!currentStory.playback, transitioning:Boolean(clock.transition) || timelinePointer!==null || now<inputSettlesAt,
      manualCover:currentStory.glass!==null,
    })
    const action=routineAction ? { ...storyMotion,...routineAction } : storyMotion
    dailyBloom=Math.max(action.bloom ?? 0,dailyBloom)
    const shouldProtect=coverTime && !routine.awaitingCover
    if (shouldProtect!==protectByClock) {
      protectByClock=shouldProtect
      updateGlassButton(mood)
    }
    const moving=Boolean(currentStory.playback || clock.transition || clock.playing || camera.transition || routineAction)
    traveler.setState(action.pose || mood.chapter.pose)
    landmarks.rose.update(delta,elapsed,{
      motion:!reduced, bloom:Math.max(currentStory.roseBloom,dailyBloom,action.roseTurn*.12), glow:action.glow,
      protectedRose:(currentStory.glass ?? protectByClock) && action.drop<.006, low:economy, settle:reduced,
      selected:inspection==='rose', delivery:action.delivery,
    })
    const rose=landmarks.rose
    const coverApproach=action.delivery ? (1-action.delivery.advance)*.80 : 0
    const routeEnd=rose.root.localToWorld(roseDestination.set(action.delivery ? -.70 : -.69,0,.15+coverApproach))
    const look=action.delivery ? rose.coverCenter(roseGaze) : rose.root.position
    traveler.update(delta,elapsed,{
      ...action, motion:!reduced, rim:holdGlass, routeEnd:routeEnd.normalize(), look,
    })
    particles(action.time ?? currentStory.playback?.time ?? elapsed,action,traveler,landmarks.rose,economy)
    atmospheric.update(mood,elapsed,economy,camera.camera.aspect)
    camera.update(delta)
    if (inspection==='traveler' && !camera.transition && camera.mode==='detail') {
      traveler.anchor.getWorldPosition(trackTarget)
      trackTarget.y+=.72
      trackDelta.subVectors(trackTarget,camera.orbit.target).multiplyScalar(1-Math.exp(-delta*5))
      camera.orbit.target.add(trackDelta)
      camera.camera.position.add(trackDelta)
      camera.orbit.update()
    }
    const activity=routineAction?.routine ?? ''
    if (activity!==(viewport.dataset.activity ?? '')) {
      viewport.dataset.activity=activity
      needsFrame=true
    }

    if (firstFrame || clock.hour!==previousHour || now-shadowTime>80 && (!reduced || moving)) {
      renderer.shadowMap.needsUpdate=true
      shadowTime=now
    }
    readClock(mood)
    const direction=Math.atan2(camera.camera.position.x,camera.camera.position.z)
    if (skyStamp<0 || clock.hour!==previousHour || Math.abs(direction-skyHeading)>.009 || !reduced && now-skyStamp>105) {
      paintSky(skyContext,sky.width,sky.height,mood,elapsed,direction)
      skyHeading=direction
      skyStamp=now
    }
    if (!reduced || moving || needsFrame || firstFrame) {
      render(camera.camera)
      needsFrame=false
    }
    previousHour=clock.hour
    if (firstFrame) {
      firstFrame=false
      viewport.dataset.ready='true'
    }
  }
  function wake() {
    if (document.hidden) {
      if (frame) cancelAnimationFrame(frame)
      frame=0
      last=0
    } else if (!frame) frame=requestAnimationFrame(tick)
  }
  function restored() {
    renderer.shadowMap.needsUpdate=true
    needsFrame=true
    wake()
  }
  document.addEventListener('visibilitychange',wake,listener)
  canvas.addEventListener('webglcontextrestored',restored,listener)
  cleanup=()=>{
    cancelAnimationFrame(frame)
    observer.disconnect()
    camera.dispose()
    disposeAssets(scene)
    disposeAssets(atmospheric.skyScene)
    renderer.dispose()
    canvas.remove()
  }
  wake()
}

bindAudio()
try {
  mount()
} catch (error) {
  cleanup()
  paintSky(skyContext,sky.width=innerWidth,sky.height=innerHeight,clock.sample())
  const poster=new Image()
  poster.src=fallback
  poster.alt='The traveler, his rose and three volcanoes at dusk.'
  viewport.replaceChildren(poster)
  for (const panel of [byId('clock-panel'),document.querySelector('.discover'),document.querySelector('.hero-actions'),byId('time-travel'),settings]) panel.hidden=true
  say('Static preview. Enable WebGL 2 to explore the planet.',0)
  console.warn('Little Planet: WebGL 2 unavailable',error)
}
if (import.meta.hot) import.meta.hot.dispose(()=>{
  signalController.abort()
  clearTimeout(noteTimer)
  cleanup()
})
