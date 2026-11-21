import { MathUtils, Vector3 } from 'three'
import { roseWater } from './DailyRoutine.js'

const smooth = (x) => MathUtils.smoothstep(x,0,1)
const focus = new Vector3()
const surfaceNormal = new Vector3()
const farSide = new Vector3()
const sunsetTarget = new Vector3(.16,2.55,-.25)

export const entries = {
  traveler: {
    label:'Traveler', title:'The traveler',
    description:'At dawn he tends his rose. In daylight he walks the planet, and at night he tucks the rose under glass.',
    voice:'I walk the same small world each day. The rose makes it feel different every morning.',
  },
  rose: {
    label:'Rose', title:'A rose of his own',
    description:'A little time and a little water, every morning.', action:'Water the rose',
    voice:'I straighten my petals when I hear his footsteps. I hope he thinks I always look like this.',
  },
  sheep: {
    label:'Sheep box', title:'A box for a sheep',
    description:'A sheep lives in this box. Its shape is up to you.',
    voice:'Outside, I’m a little wooden box. Inside, I’m as wide as the pasture you imagine.',
  },
  'volcano-one': {
    label:'High crater', title:'The high crater',
    description:'A warm wisp rises from the seam of the taller active volcano.',
    voice:'My rim catches the first light. By evening, I can see the shadow of his chair cross the grass.',
  },
  'volcano-two': {
    label:'Warm crater', title:'The warm crater',
    description:'A little ember warms the rim of the lower active volcano.',
    voice:'I keep a small ember under my stones. It comes in handy when the night turns cold.',
  },
  'volcano-three': {
    label:'Sleeping crater', title:'The sleeping crater',
    description:'Its crater is cool, with layers of slate and violet.',
    voice:'My fire went out long ago. The stars still come to see me.',
  },
  'seed-one': {
    label:'Sprout 1', title:'The first baobab sprout',
    description:'A baobab seedling has taken root beside the path.', action:'Lift the sprout',
    voice:'I came up between two stones. My roots are only just beginning to look for room.',
  },
  'seed-two': {
    label:'Sprout 2', title:'The second baobab sprout',
    description:'This young baobab leans toward the open sky.', action:'Lift the sprout',
    voice:'I lean toward the light on this side of the planet. A little more sun, and I could grow right past the path.',
  },
  'seed-three': {
    label:'Sprout 3', title:'The third baobab sprout',
    description:'A baobab seedling grows in the shadow of the rocks.', action:'Lift the sprout',
    voice:'The rocks keep me in shade. I’ve been stretching one leaf at a time toward the open sky.',
  },
  sunset: { title:'A sunset together', description:'Watch the gold fade to violet from behind his chair.' },
  showcase: { title:'A day on B-612', description:'From the first glimpse of the planet to its rose, sunset and stars.' },
}

export class StorySequence {
  constructor(clock,camera,changed) {
    this.clock=clock
    this.camera=camera
    this.changed=changed
    this.current=null
    this.playback=null
    this.roseBloom=0
    this.cleared=0
    this.glass=null
  }
  inspect(root) {
    if (this.playback) this.stop()
    const id=root.userData.landmark
    const name=id.startsWith('seed-') ? 'seed' : id
    this.current={ id, name, root, finished:name==='seed' && !root.visible }
    root.getWorldPosition(focus)
    if (name==='traveler' || name==='rose') {
      focus.y+=name==='traveler' ? .72 : .42
      this.camera.setView('detail',focus,name==='traveler' ? -.43 : .16)
    } else {
      surfaceNormal.copy(focus).normalize()
      focus.addScaledVector(surfaceNormal,id.startsWith('volcano-') ? .54 : .23)
      const axis=surfaceNormal.z<-.15
        ? farSide.set(surfaceNormal.x,.51,surfaceNormal.z).normalize()
        : undefined
      this.camera.setView('detail',focus,-.21,axis)
    }
    this.changed(this)
  }
  action() {
    const scene=this.current
    if (!scene || this.playback || scene.finished) return
    if (scene.name==='rose') this.begin('rose',5.2)
    if (scene.name==='seed') this.begin('seed',1.35)
  }
  begin(name, duration) {
    if (this.playback) this.stop()
    if (name === 'sunset' || name === 'showcase') this.current={ name, finished:false }
    this.playback={ name, duration, time:0, priorHour:this.clock.hour, priorPlay:this.clock.playing, cue:-1 }
    this.clock.playing=false
    if (name==='sunset') {
      this.clock.travel(18.5,2.7)
      this.camera.setView('sunset',sunsetTarget)
    }
    if (name==='showcase') {
      this.clock.set(12)
      this.camera.setView('arrival')
    }
    this.changed(this)
  }
  stop(restoreTime = true) {
    if (this.playback) {
      const sprout=this.playback.sprout
      if (sprout) {
        sprout.position.y=0
        sprout.rotation.z=0
        sprout.scale.setScalar(1)
      }
      this.clock.playing=this.playback.priorPlay
      if (restoreTime && ['sunset','showcase'].includes(this.playback.name)) {
        this.clock.travel(this.playback.priorHour,1.3)
      }
    }
    this.playback=null
    this.current=null
    this.camera.setView('home')
    this.changed(this)
  }
  update(dt, landmarks) {
    const story=this.playback
    const state={ movement:0, action:0, drop:0, glow:0, soil:0, root:null, pose:null, roseTurn:0 }
    if (!story) return state
    story.time=Math.min(story.duration,story.time+dt)
    const t=story.time
    if (story.name==='rose' || (story.name==='showcase' && t>6 && t<11.2)) {
      const water=story.name==='rose' ? t : t-6
      Object.assign(state,roseWater(water))
      state.roseTurn=smooth(water/1.4)
      this.roseBloom=Math.max(this.roseBloom,smooth((water-2.35)/1.9)*.94)
    }
    if (story.name==='seed' && this.current) {
      const root=this.current.root
      const seed=landmarks.seedlings.find(entry=>entry.root===root).sprout
      story.sprout=seed
      const lift=smooth(t/1.31)
      seed.position.y=lift*.68
      seed.scale.setScalar(1-lift*.93)
      seed.rotation.z=lift*.43
      state.root=root
      state.soil=Math.sin(Math.PI*lift)
      if (t>=story.duration) {
        root.visible=false
        this.cleared+=1
      }
    }
    if (story.name==='sunset') {
      state.pose=t<13 ? 'WatchingSunset' : 'LookingAtStars'
      if (t>3.3) this.clock.set(18.5 + 2.25*smooth((t-3.3)/(story.duration-3.3)))
    }
    if (story.name==='showcase') {
      const cue=t<2 ? 0 : t<6 ? 1 : t<11.3 ? 2 : t<18.8 ? 3 : 4
      if (cue!==story.cue) {
        story.cue=cue
        if (cue===1) this.camera.setView('arc')
        if (cue===2) {
          landmarks.rose.root.getWorldPosition(focus)
          focus.y+=.51
          this.camera.setView('detail',focus,1.1)
        }
        if (cue===3) {
          this.clock.travel(18.5,3.2)
          this.camera.setView('sunset',sunsetTarget)
        }
        if (cue===4) {
          this.clock.travel(22,3.3)
          this.camera.setView('home')
        }
      }
      if (cue===3) state.pose='WatchingSunset'
      if (cue===4) state.pose='LookingAtStars'
    }
    if (t>=story.duration) {
      this.playback=null
      this.clock.playing=story.priorPlay
      if (this.current) this.current.finished=true
      this.camera.setView('home')
      this.changed(this)
    }
    return state
  }
}
