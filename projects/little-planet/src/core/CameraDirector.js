import { MathUtils, PerspectiveCamera, Vector3 } from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const homeTarget = new Vector3(0,.86,0)
const homeAxis = new Vector3(.49,.43,1).normalize()
const inspectAxis = new Vector3(.39,.28,1).normalize()
const orbitAxis = new Vector3(-.69,.51,1).normalize()
const sunsetAxis = new Vector3(-.94,.41,.81).normalize()

export class CameraDirector {
  constructor(canvas, reduced) {
    this.camera = new PerspectiveCamera(33,1,.1,90)
    this.reduced = reduced
    this.orbit = new OrbitControls(this.camera,canvas)
    this.orbit.enableDamping = !reduced
    this.orbit.dampingFactor = .092
    this.orbit.enablePan = false
    this.orbit.rotateSpeed = .67
    this.orbit.zoomSpeed = .68
    this.orbit.minDistance = 5.8
    this.orbit.maxDistance = 29
    this.orbit.minPolarAngle = .25
    this.orbit.maxPolarAngle = 2.1
    this.orbit.addEventListener('start',()=>{ this.transition=null; this.mode='orbit' })
    this.mode='home'
    this.transition=null
    this.setImmediate(homeTarget,homeAxis,15)
  }
  distance(aspect = this.camera.aspect) {
    return 14.4 * Math.max(1,.91/aspect)
  }
  setImmediate(target,axis,distance) {
    this.orbit.target.copy(target)
    this.camera.position.copy(target).addScaledVector(axis,distance)
    this.orbit.update()
  }
  resize(width,height) {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    if (this.mode === 'home' && !this.transition) this.setImmediate(homeTarget,homeAxis,this.distance())
  }
  setView(mode, target = homeTarget, offset = 0, detailAxis = inspectAxis) {
    this.mode=mode
    let axis=homeAxis
    let distance=this.distance()
    if (mode==='detail') { axis=detailAxis; distance=6.3 + offset }
    if (mode==='sunset') {
      axis=sunsetAxis
      distance=8.5*Math.max(1,.78/this.camera.aspect)
    }
    if (mode==='arc') { axis=orbitAxis; distance*=1.08 }
    if (mode==='arrival') {
      this.setImmediate(homeTarget,homeAxis,distance*1.48)
      this.mode='home'
    }
    if (this.reduced) {
      this.setImmediate(target,axis,distance)
      this.transition=null
      return
    }
    const relative=this.camera.position.clone().sub(this.orbit.target)
    const origin=relative.clone().normalize()
    const azimuth=Math.atan2(origin.x,origin.z)
    const azimuthTo=Math.atan2(axis.x,axis.z)
    this.transition={
      time:0, duration: mode==='sunset' ? 2.8 : mode==='arrival' || mode==='arc' ? 2.4 : 1.24, start:this.orbit.target.clone(), target:target.clone(),
      distanceFrom:relative.length(),distanceTo:distance,
      azimuth, turn:MathUtils.euclideanModulo(azimuthTo-azimuth+Math.PI,2*Math.PI)-Math.PI,
      polar:Math.acos(origin.y), high:Math.acos(axis.y),
    }
  }
  update(delta) {
    const t=this.transition
    if (t) {
      t.time+=delta
      const p=Math.min(1,t.time/t.duration)
      const mix=p*p*(3-2*p)
      const angle=t.azimuth+t.turn*mix
      const polar=MathUtils.lerp(t.polar,t.high,mix)
      const distance=MathUtils.lerp(t.distanceFrom,t.distanceTo,mix)
      this.orbit.target.lerpVectors(t.start,t.target,mix)
      this.camera.position.setFromSphericalCoords(distance,polar,angle).add(this.orbit.target)
      if (p===1) this.transition=null
    }
    this.orbit.update()
  }
  keyboard(event) {
    switch (event.key) {
      case 'ArrowLeft': this.orbit.rotateLeft(.12); break
      case 'ArrowRight': this.orbit.rotateLeft(-.12); break
      case 'ArrowUp': this.orbit.rotateUp(.10); break
      case 'ArrowDown': this.orbit.rotateUp(-.10); break
      case '+':
      case '=': this.orbit.dollyIn(1.12); break
      case '-': this.orbit.dollyOut(1.12); break
      default: return
    }
    this.mode='orbit'
    this.transition=null
    event.preventDefault()
  }
  dispose() { this.orbit.dispose() }
}
