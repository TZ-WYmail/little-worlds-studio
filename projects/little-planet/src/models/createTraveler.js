import { DoubleSide, Group, LatheGeometry, MathUtils, PlaneGeometry, Quaternion, Vector2, Vector3 } from 'three'
import { block, capsule, material, mesh, oval, sweep } from './modeling.js'
import { putOnPlanet } from './createTerrain.js'
import { sculptHead } from './sculptTraveler.js'

export const chairLocation = [-.36, .93, .24]

function chair(parent) {
  const base = new Group()
  putOnPlanet(base, chairLocation)
  base.rotateY(1.19)
  parent.add(base)
  const maple = material('#a06b46')
  const amber = material('#cb985f')
  for (const side of [-1, 1]) {
    capsule(base, maple, [side * .26, .023, .23], [side * .22, .45, .17], .036)
    sweep(base, maple, [[side * .24, .03, -.31], [side * .24, .48, -.27], [side * .25, .785, -.37]], .037, 10)
    capsule(base, amber, [side * .25, .58, .22], [side * .24, .61, -.32], .033)
    capsule(base, maple, [side * .25, .42, .17], [side * .25, .58, .17], .026)
  }
  for (let index = 0; index < 4; index++) {
    block(base, index % 2 ? amber : maple, [.50, .049, .125], [0, .435, -.25 + index * .14], .018)
  }
  for (let index = 0; index < 2; index++) {
    const slat = block(base, amber, [.54, .080, .048], [0, .67 + index * .12, -.32 - index * .031], .018)
    slat.rotation.x = -.18
  }
  return base
}

const coatProfile = [[.10,-.10],[.19,-.075],[.220,.01],[.19,.18],[.228,.38],[.208,.48],[.13,.52],[.078,.54]]
const poses = {
  Idle: { height:.69, thigh:0, knee:.12, arm:-.15, elbow:-.20, tilt:0, head:.06 },
  Sitting: { height:.49, thigh:-1.51, knee:1.45, arm:-.50, elbow:-.43, tilt:-.06, head:.03 },
  WatchingSunset: { height:.49, thigh:-1.49, knee:1.46, arm:-.46, elbow:-.39, tilt:-.04, head:-.09 },
  WateringRose: { height:.61, thigh:-.38, knee:.50, arm:-.72, elbow:-.19, tilt:.16, head:.24 },
  Walking: { height:.69, thigh:-.05, knee:.15, arm:-.11, elbow:-.30, tilt:.11, head:.025 },
  CoveringRose: { height:.65, thigh:-.13, knee:.27, arm:-.84, elbow:-.64, tilt:.19, head:.21 },
  Standing: { height:.69, thigh:-.07, knee:.21, arm:-.19, elbow:-.24, tilt:.035, head:0 },
  LookingAtStars: { height:.49, thigh:-1.45, knee:1.40, arm:-.55, elbow:-.40, tilt:-.09, head:-.30 },
}

export function createTraveler(planet) {
  chair(planet)
  const anchor = new Group()
  const facing = new Group()
  const body = new Group()
  anchor.add(facing)
  facing.add(body)
  planet.add(anchor)
  const teal = material('#41686c')
  const trim = material('#70938a')
  const deepTeal = material('#344f59')
  const stitches = material('#8ca39a')
  const silk = material('#f1c377')
  const tan = material('#a57542')
  const boot = material('#564038')
  const amber = material('#e6ab50')
  const bronze = material('#bc9054', { roughness:.49, metalness:.12 })
  const skin = material('#efb48c')
  const canvas = material('#f4ce8d')
  mesh(body, new LatheGeometry(coatProfile.map(([r,y]) => new Vector2(r,y)), 28), teal)
  for (const side of [-1,1]) {
    const tail=oval(body,deepTeal,[side*.102,-.083,-.071],[.105,.128,.133])
    tail.rotation.z=side*.10
    sweep(body,stitches,[[side*.155,-.094,-.111],[side*.175,-.020,-.114],[side*.167,.077,-.121]],.006,11)
    sweep(body,trim,[[side*.124,.192,.169],[side*.175,.175,.135],[side*.179,.148,.126]],.009,11)
  }
  for (const y of [.237,.313,.392]) oval(body, bronze, [.022,y,.206],[.013,.013,.008])
  sweep(body, trim, [[-.192,.385,-.087],[0,.403,-.178],[.194,.381,-.081]], .008,14)
  capsule(body, canvas, [-.054,.19,.203],[.047,.46,.180], .047)
  sweep(body, trim, [[-.012,.49,.189],[-.087,.382,.217],[-.118,.246,.192],[-.051,.071,.200]], .016)
  sweep(body, trim, [[.063,.501,.175],[.112,.387,.215],[.097,.267,.206],[.039,.139,.193]], .015)
  block(body, tan, [.29,.063,.088], [0,.111,.152], .026)
  block(body, bronze, [.071,.069,.027], [.015,.110,.204], .013)
  capsule(body, skin, [0,.505,-.004],[0,.603,-.001], .070)

  const head = new Group()
  head.position.set(0,.718,.012)
  body.add(head)
  const eyes = sculptHead(head)
  const collar = oval(body, amber, [0,.549,.035],[.153,.062,.139])
  collar.rotation.z = .16
  oval(body, amber, [.125,.541,.114],[.070,.052,.063])
  const scarfGeometry = new PlaneGeometry(1.12,.135,29,3)
  const scarfMaterial = material('#e6a151', { side: DoubleSide, vertexColors:true, roughness:.63 })
  const scarf = mesh(body, scarfGeometry, scarfMaterial, .145,.545,.028)
  scarf.castShadow = false
  const scarfVertices = scarfGeometry.attributes.position
  const scarfColors = new Float32Array(scarfVertices.count*3)
  for (let i=0;i<scarfVertices.count;i++) {
    const y=Math.floor(i/30)
    const x=(i%30)/29
    const shade=y===0||y===3 ? .73 : .93+.06*Math.sin(x*Math.PI)
    silk.color.clone().multiplyScalar(shade).lerp(scarfMaterial.color,.66).toArray(scarfColors,i*3)
  }
  scarfGeometry.setAttribute('color',scarfVertices.clone().set(scarfColors))
  scarfMaterial.color.set('#ffffff')

  const limbs = []
  let rightHand
  for (const side of [-1, 1]) {
    const shoulder = new Group()
    shoulder.position.set(side * .193,.414,.005)
    body.add(shoulder)
    capsule(shoulder, teal, [0,-.045,0],[side * .024,-.194,.006], .064)
    const elbow = new Group()
    elbow.position.set(0,-.228,0)
    shoulder.add(elbow)
    capsule(elbow, trim, [0,-.016,0],[0,-.126,.022], .050)
    const glove=oval(elbow, skin, [0,-.169,.024],[.036,.055,.032])
    glove.rotation.x=-.28
    oval(elbow, skin, [-side*.026,-.160,.039],[.018,.027,.016])
    sweep(elbow,stitches,[[-.043,-.114,.012],[0,-.130,.052],[.040,-.114,.020]],.005,9)
    if (side === 1) rightHand = elbow

    const thigh = new Group()
    thigh.position.set(side * .105, -.057, .030)
    body.add(thigh)
    capsule(thigh, deepTeal, [0,-.032,0],[0,-.233,0], .080)
    const shin = new Group()
    shin.position.y = -.281
    thigh.add(shin)
    capsule(shin, teal, [0,-.037,.001],[0,-.228,.007], .064)
    oval(shin, boot, [0,-.278,.062], [.072,.066,.130])
    block(shin, tan, [.133,.029,.199],[0,-.328,.065],.010)
    sweep(shin,tan,[[-.053,-.277,.126],[0,-.264,.160],[.053,-.277,.126]],.0048,10)
    oval(shin,bronze,[side*.042,-.241,.067],[.012,.010,.010])
    limbs.push({ shoulder, elbow, thigh, shin, side })
  }
  const can = new Group()
  can.position.set(.045,-.213,.051)
  rightHand.add(can)
  const tin = material('#7a9b83',{ roughness:.48, metalness:.22 })
  const darkTin = material('#586e65')
  oval(can, tin, [0,-.109,0],[.120,.103,.088])
  sweep(can, bronze, [[-.076,-.060,-.062],[-.113,.018,-.058],[-.039,.048,-.040],[.040,-.030,-.041]], .015)
  sweep(can, tin, [[.080,-.135,.003],[.155,-.109,.045],[.210,-.077,.098]], .025)
  oval(can, darkTin, [.230,-.069,.120],[.023,.036,.032])
  can.visible = false
  const spout = new Vector3(.235,-.070,.121)
  const current = { ...poses.WatchingSunset }
  const chairNormal = chairLocation
  const roseNeighbor = [.22,.89,.39]
  let state = 'WatchingSunset'
  let forward=0
  let stride=0
  let yaw=1.19
  const down=new Vector3(0,-1,0)
  const baseDirection=new Vector3(...chairLocation).normalize()
  const landing=new Vector3()
  const tangent=new Vector3()
  const handGoal=new Vector3()
  const elbowGoal=new Vector3()
  const bend=new Vector3()
  const localAxis=new Vector3()
  const solvedUpper=new Quaternion()
  const solvedLower=new Quaternion()
  const upperLength=.228, lowerLength=.182

  function reach(shoulder,elbow,side,rim,weight) {
    rim(side,handGoal)
    body.worldToLocal(handGoal).sub(shoulder.position)
    const distance=MathUtils.clamp(handGoal.length(), .06, upperLength+lowerLength-.005)
    localAxis.copy(handGoal).normalize()
    const projection=(upperLength**2-lowerLength**2+distance**2)/(2*distance)
    bend.set(side*.50,-.7,-.12).addScaledVector(localAxis,-bend.dot(localAxis)).normalize()
    elbowGoal.copy(localAxis).multiplyScalar(projection).addScaledVector(bend,Math.sqrt(Math.max(0,upperLength**2-projection**2)))
    solvedUpper.setFromUnitVectors(down,elbowGoal.clone().normalize())
    const wrist=handGoal.copy(localAxis).multiplyScalar(distance).sub(elbowGoal).normalize()
    wrist.applyQuaternion(solvedLower.copy(solvedUpper).invert())
    solvedLower.setFromUnitVectors(down,wrist)
    shoulder.quaternion.slerp(solvedUpper,weight)
    elbow.quaternion.slerp(solvedLower,weight)
  }
  function setState(next) {
    if (Object.hasOwn(poses, next)) state = next
  }

  return {
    anchor,
    setState,
    pourPoint(target) { return can.localToWorld(target.copy(spout)) },
    get state() { return state },
    update(delta, seconds, { motion, movement = 0, action = 0, direction, ahead, gait = 0, routeEnd, grip = 0, rim, look } = {}) {
      const target = poses[state]
      const blend = motion ? 1 - Math.exp(-delta * 9) : 1
      for (const name of Object.keys(current)) current[name] = MathUtils.lerp(current[name],target[name],blend)
      if (routeEnd) landing.copy(routeEnd)
      else landing.fromArray(roseNeighbor)
      landing.lerp(baseDirection,1-movement)
      if (direction) landing.copy(direction)
      putOnPlanet(anchor,landing)
      let heading=MathUtils.lerp(1.19,1.49,movement)
      if (ahead || (look && (action>.01 || grip>.01))) {
        tangent.copy(ahead || look).applyQuaternion(solvedUpper.copy(anchor.quaternion).invert())
        if (Math.hypot(tangent.x,tangent.z)>.003) heading=Math.atan2(tangent.x,tangent.z)
      }
      yaw+= (MathUtils.euclideanModulo(heading-yaw+Math.PI,Math.PI*2)-Math.PI) * blend
      facing.rotation.y=yaw
      const upright = ['Idle','Standing','Walking','WateringRose','CoveringRose'].includes(state)
      forward = MathUtils.lerp(forward,upright && !direction ? .30 * (1-movement) : 0,blend)
      facing.position.set(forward*Math.sin(yaw),0,forward*Math.cos(yaw))
      stride+=delta*7.8*gait
      const walk = Math.sin(stride) * .29 * gait
      const breathe = motion ? Math.sin(seconds * 2.1) : 0
      body.position.y = current.height + breathe * .011
      body.rotation.x = current.tilt + breathe * .008
      head.rotation.x = current.head + breathe * .020
      head.rotation.y = (state==='Walking' ? Math.sin(stride*.45)*.083 : 0) + (state === 'WatchingSunset' ? .14 : 0) + (motion ? Math.sin(seconds * .64) * .055 : 0)
      const blink = motion ? Math.max(0,.17 - Math.abs((seconds % 5.6) - 4.8)) / .17 : 0
      for (const eye of eyes) eye.scale.y = 1 - .94 * blink
      for (const { shoulder, elbow, thigh, shin, side } of limbs) {
        shoulder.rotation.x = current.arm + side * walk * .50 - (side === 1 ? action * .46 : 0)
        shoulder.rotation.z = side * .09
        elbow.rotation.x = current.elbow - (side === 1 ? action * .40 : 0)
        thigh.rotation.x = current.thigh + side * walk
        shin.rotation.x = current.knee + Math.max(0, side * walk * .63)
        if (grip>0 && rim) reach(shoulder,elbow,side,rim,grip)
      }
      can.visible = state === 'WateringRose'
      can.rotation.x = action * .94
      can.rotation.z = -action * .44
      for (let i = 0; i < scarfVertices.count; i++) {
        const u = (i % 30) / 29
        const cross = .5 - Math.floor(i / 30) / 3
        const ripple = motion ? (Math.sin(seconds * 2.7 - u * 7) * .13 + Math.sin(seconds * 1.64 - u*14)*.035) * u : 0
        scarfVertices.setXYZ(i, -.79 * u, cross * (.153 - .044 * u) + .19 * u - .19 * u * u + ripple,
          -.79 * u + Math.sin(u * 3.8) * .10 + ripple * .63)
      }
      scarfVertices.needsUpdate = true
      scarfGeometry.computeVertexNormals()
    },
  }
}
