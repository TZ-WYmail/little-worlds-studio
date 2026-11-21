import { Color, MathUtils, Vector3 } from 'three'

export const chapters = [
  { hour:6, name:'初醒', english:'First light', pose:'Standing', key:'#ffc8a3', sky:'#ead3ec', top:'#29223b', bottom:'#8f5869', glow:'#ec927f', sun:2.5, ambient:1.32, stars:.36 },
  { hour:12, name:'日常', english:'Daylight', pose:'Idle', key:'#fff0d0', sky:'#d1e6ff', top:'#254367', bottom:'#547487', glow:'#a2adb0', sun:3.3, ambient:1.65, stars:.09 },
  { hour:18.5, name:'日落', english:'Golden hour', pose:'WatchingSunset', key:'#ffd09b', sky:'#e2c8fc', top:'#1b182d', bottom:'#493045', glow:'#dc775d', sun:3.15, ambient:1.34, stars:.64 },
  { hour:22, name:'星夜', english:'Starlight', pose:'LookingAtStars', key:'#a4b9ff', sky:'#b5affc', top:'#0d122a', bottom:'#201d3a', glow:'#595389', sun:1.27, ambient:1.06, stars:1 },
]
const period = 24
const wrap = (value) => MathUtils.euclideanModulo(value, period)
const actors = chapters.map((entry) => ({ ...entry,
  key: new Color(entry.key), sky: new Color(entry.sky), top: new Color(entry.top),
  bottom: new Color(entry.bottom), glow: new Color(entry.glow),
}))
const cycle = [{ ...actors[3], hour:-2 }, ...actors, { ...actors[0], hour:30 }]
const tween = (value) => value * value * (3 - 2 * value)

export function formatHour(hour) {
  const minute = Math.round(wrap(hour) * 60) % 1440
  return `${String(Math.floor(minute / 60)).padStart(2,'0')}:${String(minute % 60).padStart(2,'0')}`
}

export class TimeEngine {
  constructor(hour = 18.5) {
    this.hour = wrap(hour)
    this.playing = false
    this.speed = 1
    this.transition = null
    this.light = {
      key:new Color(), sky:new Color(), top:new Color(), bottom:new Color(), glow:new Color(),
      direction:new Vector3(), sunDirection:new Vector3(),
    }
  }
  set(hour) {
    this.hour = wrap(hour)
    this.transition = null
  }
  travel(hour, duration = 1.35) {
    const difference = wrap(hour - this.hour + 12) - 12
    this.transition = { from:this.hour, difference, time:0, duration }
  }
  update(delta, maxHoursPerSecond = Infinity) {
    if (this.transition) {
      const change = this.transition
      change.time += delta
      const progress = Math.min(1, change.time / change.duration)
      this.hour = wrap(change.from + change.difference * tween(progress))
      if (progress === 1) this.transition = null
    } else if (this.playing) {
      this.hour = wrap(this.hour + delta * Math.min(.23 * this.speed,maxHoursPerSecond))
    }
  }
  sample() {
    const index = cycle.findIndex((candidate)=>candidate.hour > this.hour)
    const a = cycle[index - 1]
    const b = cycle[index]
    const blend = tween((this.hour - a.hour) / (b.hour - a.hour))
    const light = this.light
    for (const key of ['key','sky','top','bottom','glow']) light[key].copy(a[key]).lerp(b[key],blend)
    for (const key of ['sun','ambient','stars']) light[key] = MathUtils.lerp(a[key],b[key],blend)
    light.chapter = blend < .5 ? a : b
    const angle = (this.hour - 6) / 24 * Math.PI * 2
    const height = Math.sin(angle)
    light.night = MathUtils.smoothstep(-height, .00, .60)
    light.sunDirection.set(-Math.cos(angle), height * .88, -.66).normalize()
    light.direction.set(-Math.cos(angle) * (1 - 1.70 * light.night), .34 + Math.abs(height)*.89, -.53 + light.night*.18).normalize()
    return light
  }
}
