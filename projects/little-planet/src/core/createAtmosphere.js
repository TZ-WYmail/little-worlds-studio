import {
  CanvasTexture, Color, DirectionalLight, Group, HemisphereLight, MathUtils, Mesh, MeshBasicMaterial, Scene, SphereGeometry,
  Sprite, SpriteMaterial, SRGBColorSpace,
} from 'three'
import { seededRandom } from './seededRandom.js'

const random = seededRandom(612)
const stars = Array.from({ length: 470 }, (_,index) => ({
  x:random(), y:random(), weight:random() ** 2, phase:random() * 6.28, marked:index < 14,
}))
const constellation = [[.78,.11],[.806,.137],[.844,.104],[.878,.165],[.909,.140]]
const lunar = new Color('#ecdcce')
const duskFill = new Color('#f8dfd3')
const nightFill = new Color('#aabbe9')

function haze(context,width,height,x,y,size,color,strength) {
  const cx = x * width
  const cy = y * height
  const r = size * Math.min(width,height)
  const glow = context.createRadialGradient(cx,cy,0,cx,cy,r)
  glow.addColorStop(0,`#${color.getHexString()}${Math.round(strength*255).toString(16).padStart(2,'0')}`)
  glow.addColorStop(1,`#${color.getHexString()}00`)
  context.fillStyle=glow
  context.fillRect(0,0,width,height)
}

export function paintSky(context, width, height, mood, seconds = 0, perspective = 0) {
  const backdrop = context.createLinearGradient(0,0,width*.54,height)
  backdrop.addColorStop(0,mood.top.getStyle())
  backdrop.addColorStop(.66,mood.bottom.getStyle())
  backdrop.addColorStop(1,mood.top.getStyle())
  context.fillStyle=backdrop
  context.fillRect(0,0,width,height)
  const origin = width / height > 1.42 ? .77 : .70
  haze(context,width,height,origin+perspective*.018,.48,.66,mood.glow,.60)
  haze(context,width,height,.22,.06,.62,mood.top,.62)
  haze(context,width,height,origin-.05,.77,.52,mood.glow,.16)
  for (const star of stars) {
    const x = MathUtils.euclideanModulo(star.x+perspective*.015*(.55+star.weight),1) * width
    const y = star.y * height
    const radius = .36 + star.weight * 1.12
    const shimmer = .88 + .12*Math.sin(seconds*.65+star.phase)
    context.globalAlpha = (.14+star.weight*.56) * mood.stars * shimmer
    context.fillStyle = star.weight > .68 ? '#fff2cd' : '#d7d4ec'
    context.beginPath()
    context.arc(x,y,radius,0,Math.PI*2)
    context.fill()
    if (star.marked && star.weight > .49) {
      context.fillRect(x-radius*2.1,y-.36,radius*4.2,.72)
      context.fillRect(x-.36,y-radius*2.1,.72,radius*4.2)
    }
  }
  context.globalAlpha=mood.stars*.25
  context.lineWidth=.8
  context.strokeStyle='#e4c3b1'
  context.beginPath()
  for (const [index,[x,y]] of constellation.entries()) {
    const px = (x + perspective*.011)*width
    const py = y*height
    if (index===0) context.moveTo(px,py)
    else context.lineTo(px,py)
  }
  context.stroke()
  context.globalAlpha=1
  if (mood.night > .62 && seconds % 28.0 > 24.9 && seconds % 28.0 < 26.4) {
    const d=(seconds%28-24.9)/1.5
    const x=width*(.90-.25*d), y=height*(.19+.15*d)
    const trail=context.createLinearGradient(x,y,x+width*.06,y-height*.036)
    trail.addColorStop(0,'#ffead5be')
    trail.addColorStop(1,'#ffead500')
    context.strokeStyle=trail
    context.lineWidth=1.6*Math.sin(Math.PI*d)
    context.beginPath()
    context.moveTo(x,y)
    context.lineTo(x+width*.06,y-height*.036)
    context.stroke()
  }
}

function glowTexture() {
  const canvas = document.createElement('canvas')
  canvas.width=canvas.height=128
  const context=canvas.getContext('2d')
  const light=context.createRadialGradient(64,64,2,64,64,62)
  light.addColorStop(0,'rgba(255,255,255,.93)')
  light.addColorStop(.29,'rgba(255,255,255,.46)')
  light.addColorStop(.57,'rgba(255,255,255,.12)')
  light.addColorStop(1,'rgba(255,255,255,0)')
  context.fillStyle=light
  context.fillRect(0,0,128,128)
  const texture=new CanvasTexture(canvas)
  texture.colorSpace=SRGBColorSpace
  return texture
}

export function createAtmosphere(scene, volcanoes, economy) {
  const skyScene = new Scene()
  const hemi = new HemisphereLight('#e0daff','#8b6655',1.4)
  const key = new DirectionalLight('#ffcf9f',3)
  key.castShadow = true
  Object.assign(key.shadow.camera,{left:-5.4,right:5.4,top:5.1,bottom:-5.1,near:.1,far:27})
  key.shadow.mapSize.setScalar(economy ? 768 : 1536)
  key.shadow.normalBias=.027
  key.shadow.bias=-.00014
  key.shadow.radius=3
  const fill=new DirectionalLight('#f8dfd3',1.36)
  fill.position.set(-4,2,7)
  scene.add(key,hemi,fill)
  const lightMap=glowTexture()
  function celestial(r, color, haloSize) {
    const group=new Group()
    const disk = new Mesh(new SphereGeometry(r,36,24),new MeshBasicMaterial({
      color, transparent:true, toneMapped:false, depthWrite:false,
    }))
    const glow = new Sprite(new SpriteMaterial({map:lightMap,color,opacity:.4,depthWrite:false,transparent:true,toneMapped:false}))
    glow.scale.set(haloSize,haloSize,1)
    group.add(glow,disk)
    skyScene.add(group)
    return {group,disk,glow}
  }
  const sun=celestial(.44,'#ffd7a0',3.3)
  const moon=celestial(.31,'#ebdfd7',2.65)
  const moonPaper=document.createElement('canvas')
  moonPaper.width=256
  moonPaper.height=128
  const dust=moonPaper.getContext('2d')
  dust.fillStyle='#f6eddf'
  dust.fillRect(0,0,256,128)
  const mottles=seededRandom(99)
  for (let i=0; i<54; i++) {
    const x=mottles()*256, y=mottles()*128, r=2+mottles()*11
    const mare=dust.createRadialGradient(x,y,0,x,y,r)
    mare.addColorStop(0,'#85748557')
    mare.addColorStop(.58,'#8c7e7950')
    mare.addColorStop(1,'#8c7e7900')
    dust.fillStyle=mare
    dust.fillRect(x-r,y-r,r*2,r*2)
  }
  const moonMap=new CanvasTexture(moonPaper)
  moonMap.colorSpace=SRGBColorSpace
  moon.disk.material.map=moonMap
  moon.disk.rotation.y=.85
  const minorBody = new Mesh(new SphereGeometry(.145,20,12),new MeshBasicMaterial({ color:'#b898a3',transparent:true,opacity:.41,toneMapped:false }))
  minorBody.position.set(-3.84,1.8,-4.1)
  skyScene.add(minorBody)
  const smoke = volcanoes.filter(peak=>peak.active).map(({root})=>{
    const puffs=Array.from({length:5},()=>{
      const puff=new Sprite(new SpriteMaterial({map:lightMap,color:'#edc6ad',opacity:.18,transparent:true,depthWrite:false}))
      root.add(puff)
      return puff
    })
    return puffs
  })
  return {
    skyScene,
    update(mood, seconds, low, aspect) {
      key.color.copy(mood.key)
      key.position.copy(mood.direction).multiplyScalar(13)
      key.intensity=mood.sun
      hemi.color.copy(mood.sky)
      hemi.intensity=mood.ambient
      fill.intensity=1.03+mood.night*.13
      fill.color.copy(duskFill).lerp(nightFill,mood.night)
      const night=MathUtils.smoothstep(mood.night,.36,.82)
      const sunAltitude=mood.sunDirection.y
      const dayDisk=1-night
      const width=MathUtils.clamp(aspect/1.43,.66,1)
      sun.group.position.set(mood.sunDirection.x*4.35*width,sunAltitude*3.0+3.33,-4.05)
      moon.group.position.set((3.15+mood.sunDirection.x*.26)*width,2.0-sunAltitude*1.35,-4.7)
      sun.group.visible=dayDisk>.02
      moon.group.visible=night>.02
      sun.disk.material.color.copy(mood.key)
      sun.disk.material.opacity=dayDisk
      sun.glow.material.color.copy(mood.key)
      sun.glow.material.opacity=dayDisk*.67
      moon.disk.material.color.copy(lunar)
      moon.disk.material.opacity=night
      moon.glow.material.color.copy(mood.sky)
      moon.glow.material.opacity=night*.35
      for (const [index, peak] of volcanoes.entries()) {
        if (peak.active) {
          peak.lava.emissiveIntensity=.48+mood.night*.84+Math.sin(seconds*1.83+index)*.085
          peak.lavaGlow.intensity=.047 + mood.night * .73
        }
      }
      for (const [index,puffs] of smoke.entries()) {
        for (const [i,puff] of puffs.entries()) {
          const p = MathUtils.euclideanModulo(seconds*.19+i*.195+index*.38,1)
          puff.visible=!low || i<2
          puff.position.set(Math.sin(p*3.8+index)*.29*p,.93+p*.98,p*p*.23)
          const size=.21+p*.38
          puff.scale.set(size*(1+p*.45),size,1)
          puff.material.opacity=Math.sin(p*Math.PI)*(.14+mood.night*.065)
        }
      }
    },
  }
}
