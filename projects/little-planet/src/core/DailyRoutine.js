import { CatmullRomCurve3, MathUtils, Vector3 } from 'three'
import { chairLocation } from '../models/createTraveler.js'

const smooth = (x) => MathUtils.smoothstep(x,0,1)
const traverse = new CatmullRomCurve3([
  chairLocation, [-.53,.84,.32], [-.58,.68,.53], [-.26,.66,.74], [.14,.62,.78],
  [.52,.62,.60], [.68,.71,.37], [.50,.86,.10], [.15,.99,.09], chairLocation,
].map(coordinates=>new Vector3(...coordinates).normalize()))

const pathDirection = new Vector3()
const pathAhead = new Vector3()
const carePace = 1.2
const waterStart = 5.83
const coverStart = 20.65
const patrolStart = .74
const patrolArrival = 19.3
const patrolDuration = 20.1
const patrolRamp = .075

const schedules = [
  { name:'water', start:waterStart, end:7.50, duration:5.6*carePace, label:'Watering the rose', sample:t=>roseWater(t/carePace) },
  { name:'patrol', start:10.4, end:15.6, duration:patrolDuration, label:'Walking the planet', sample:patrol },
  { name:'cover', start:coverStart, end:22.8, finishBy:24, duration:7.25*carePace, label:'Tucking in the rose', sample:t=>coverRose(t/carePace) },
]

export function roseNeedsCover(hour) {
  return hour>=coverStart || hour<waterStart
}

export function roseWater(t) {
  const movement=smooth(t/1.38)*(1-smooth((t-4.21)/1.32))
  const action=smooth((t-1.43)/.61)*(1-smooth((t-3.57)/.70))
  return {
    movement, action, drop:action, glow:Math.sin(Math.PI*smooth((t-2.3)/1.6))*.94,
    bloom:smooth((t-2.3)/2.0)*.75,
    pose: t>1.38 && t<4.21 ? 'WateringRose' : 'Walking',
    gait:.82*(smoothWindow(t,0,.27,1.05,1.38)+smoothWindow(t,4.21,4.49,5.26,5.53)),
  }
}

function coverRose(t) {
  const moving=t<1.58 || t>5.49
  const move=smooth(t/1.58)*(1-smooth((t-5.49)/1.58))
  const advance=smooth((t-2.83)/1.52)
  const lift=1.16*smooth((t-2.02)/1.00)*(1-smooth((t-4.32)/1.06))
  const grip=smooth((t-1.74)/.52)*(1-smooth((t-5.14)/.38))
  return {
    movement:move, pose:moving ? 'Walking' : 'CoveringRose',
    gait:.78*(smoothWindow(t,0,.32,1.22,1.58)+smoothWindow(t,5.49,5.80,6.72,7.07)),
    delivery:{ advance,lift }, grip,
  }
}

function patrol(t) {
  const progress=MathUtils.clamp((t-patrolStart)/(patrolArrival-patrolStart),0,1)
  const u=patrolDistance(progress)
  const next=Math.min(1,u+.014)
  traverse.getPointAt(u,pathDirection).normalize()
  traverse.getPointAt(next,pathAhead).normalize()
  const rampTime=patrolRamp*(patrolArrival-patrolStart)
  return {
    pose: t<patrolStart || t>=patrolArrival ? 'Standing' : 'Walking',
    direction:pathDirection, ahead:pathAhead,
    gait:smoothWindow(t,patrolStart,patrolStart+rampTime,patrolArrival-rampTime,patrolArrival),
  }
}

function patrolDistance(progress) {
  const ramp=patrolRamp
  const span=1-ramp
  if (progress<ramp) return progress**2/(2*ramp*span)
  if (progress>span) return 1-(1-progress)**2/(2*ramp*span)
  return (progress-ramp/2)/span
}

function smoothWindow(t, start, settle, finish, end) {
  return smooth((t-start)/(settle-start))*(1-smooth((t-finish)/(end-finish)))
}

export class DailyRoutine {
  constructor() {
    this.reset()
  }
  reset() {
    this.active=null
    this.window=null
    this.completed=false
    this.stableTime=0
  }
  get label() { return this.active?.schedule.label ?? '' }
  get awaitingCover() { return this.window?.name==='cover' && !this.completed }

  clockRateLimit(hour) {
    if (!this.active) return Infinity
    const {schedule,time}=this.active
    const next=schedules[(schedules.indexOf(schedule)+1)%schedules.length]
    // Faster clock settings must leave room to finish the current animation.
    const hoursLeft=MathUtils.euclideanModulo((schedule.finishBy ?? next.start)-hour,24)
    return Math.max(0,hoursLeft-.08)/(schedule.duration-time)
  }

  update(delta,hour,{ enabled, transitioning, manualCover = false }) {
    const currentWindow=schedules.find(schedule=>hour>=schedule.start && hour<schedule.end) ?? null
    if (currentWindow!==this.window) {
      this.window=currentWindow
      this.completed=false
      this.stableTime=0
    }
    if (!enabled || (manualCover && (currentWindow?.name==='cover' || this.active?.schedule.name==='cover'))) {
      this.active=null
      this.stableTime=0
      return null
    }
    this.stableTime=transitioning ? 0 : this.stableTime+delta
    if (!this.active && currentWindow && !this.completed && this.stableTime>.27) {
      this.active={ schedule:currentWindow,time:0 }
    }
    const active=this.active
    if (!active) return null
    active.time+=delta
    const { schedule,time }=active
    if (time>=schedule.duration) {
      this.completed=schedule===this.window
      this.active=null
      return null
    }
    return { ...schedule.sample(time), routine:schedule.name, time }
  }
}
