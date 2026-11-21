import { BufferGeometry, CatmullRomCurve3, Color, Float32BufferAttribute, LatheGeometry, Shape, ShapeGeometry, Vector2, Vector3 } from 'three'
import { material, mesh, oval, sweep } from './modeling.js'

function surface(rows, columns, sample, reverse = false) {
  const positions=[], colors=[], indices=[]
  for (let row=0; row<=rows; row++) {
    for (let col=0; col<=columns; col++) {
      const [x,y,z,color]=sample(col/columns,row/rows)
      positions.push(x,y,z)
      if (color) colors.push(color.r,color.g,color.b)
      if (col<columns && row<rows) {
        const a=row*(columns+1)+col
        if (reverse) indices.push(a,a+columns+1,a+1,a+1,a+columns+1,a+columns+2)
        else indices.push(a,a+1,a+columns+1,a+1,a+columns+2,a+columns+1)
      }
    }
  }
  const geometry=new BufferGeometry()
  geometry.setAttribute('position',new Float32BufferAttribute(positions,3))
  if (colors.length) geometry.setAttribute('color',new Float32BufferAttribute(colors,3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function headGeometry() {
  const profile=[
    [0,-.222],[.060,-.220],[.097,-.200],[.130,-.169],[.166,-.113],
    [.185,-.055],[.193,.014],[.184,.093],[.150,.158],[.103,.201],[0,.222],
  ]
  const curve=new CatmullRomCurve3(profile.map(([r,y])=>new Vector3(r,y,0)))
  const geometry=new LatheGeometry(curve.getPoints(29).map(p=>new Vector2(Math.max(0,p.x),p.y)),42)
  const points=geometry.attributes.position
  const colors=[]
  const base=new Color('#f0b58f'), blush=new Color('#d58977'), shadow=new Color('#dba082')
  const tint=new Color()
  for(let i=0;i<points.count;i++) {
    const x=points.getX(i), y=points.getY(i)
    const z=points.getZ(i)
    const face=z>0 ? z*.94 + Math.exp(-((y+.016)**2*32))*z*.10 : z*1.01
    const rosiness=Math.exp(-((Math.abs(x)-.108)**2*540+(y+.056)**2*840+(face-.158)**2*750))*.49
    tint.copy(base).lerp(blush,rosiness).lerp(shadow,Math.max(0,-y-.085)*1.35)
    colors.push(tint.r,tint.g,tint.b)
    points.setXYZ(i,x,y,face)
  }
  geometry.setAttribute('color',new Float32BufferAttribute(colors,3))
  geometry.computeVertexNormals()
  return geometry
}

function tress(head, surfaceMaterial, controls, width, depth, tint, lit) {
  const path=new CatmullRomCurve3(controls.map(values=>new Vector3(...values)))
  const p=new Vector3(), tangent=new Vector3(), right=new Vector3(), normal=new Vector3()
  const up=new Vector3(0,0,1)
  const color=new Color()
  const geometry=surface(25,12,(u,t)=>{
    path.getPoint(t,p)
    path.getTangent(t,tangent)
    right.crossVectors(tangent,up).normalize()
    normal.crossVectors(right,tangent).normalize()
    const angle=u*Math.PI*2
    const spread=Math.max(.055,Math.sin(Math.PI*(.16+.84*t))**.74)
    const ridge=1+Math.sin(u*8*Math.PI+t*1.5)*.063
    p.addScaledVector(right,Math.cos(angle)*width*spread*ridge)
    p.addScaledVector(normal,Math.sin(angle)*depth*spread)
    color.copy(tint).lerp(lit,.22+Math.max(0,Math.sin(angle))*.57)
    return [p.x,p.y,p.z,color]
  },true)
  mesh(head,geometry,surfaceMaterial)
}

export function sculptHead(head) {
  const skin = material('#f2b48f',{ roughness:.67 })
  const softShadow = material('#df9c7f')
  const lashes = material('#53433b',{ roughness:.68 })
  const iris = material('#586258',{ roughness:.31 })
  const dark = material('#282c29',{ roughness:.26 })
  const eyeWhite = material('#ead5ba',{ roughness:.45 })
  const glint = material('#fff3d9',{ emissive:'#d9c9b2',emissiveIntensity:.17 })
  const scalpMaterial = material('#ba793e',{ roughness:.72 })
  const lockMaterial = material('#ffffff',{ vertexColors:true,roughness:.64 })
  mesh(head,headGeometry(),material('#ffffff',{ vertexColors:true, roughness:.68 }))
  oval(head,skin,[0,-.037,.177],[.027,.028,.034])
  oval(head,softShadow,[0,-.048,.194],[.023,.012,.017])
  sweep(head,lashes,[[-.025,-.099,.157],[.001,-.102,.164],[.023,-.095,.162]],.0036,12)

  const outline=new Shape()
  outline.moveTo(-.035,0)
  outline.quadraticCurveTo(-.021,.031,.006,.026)
  outline.quadraticCurveTo(.027,.024,.036,.005)
  outline.quadraticCurveTo(.014,-.016,-.007,-.015)
  outline.quadraticCurveTo(-.024,-.014,-.035,0)
  const eyes=[]
  for(const side of [-1,1]) {
    oval(head,skin,[side*.183,-.028,-.029],[.035,.052,.028]).rotation.z=-side*.10
    oval(head,softShadow,[side*.201,-.030,-.010],[.014,.029,.010])
    const eyeGroup=oval(head,softShadow,[side*.075,.017,.166],[.043,.025,.009])
    eyeGroup.rotation.y=side*.30
    const eye=mesh(head,new ShapeGeometry(outline,12),eyeWhite,side*.076,.018,.177)
    eye.rotation.y=side*.28
    oval(eye,iris,[.004,.004,.006],[.021,.022,.009])
    oval(eye,dark,[.005,.004,.012],[.011,.014,.005])
    oval(eye,glint,[-.002,.012,.017],[.005,.005,.002])
    sweep(eye,lashes,[[-.034,.003,.002],[-.013,.023,.002],[.010,.026,.003],[.034,.010,.001]],.0048,12)
    eyes.push(eye)
    sweep(head,scalpMaterial,
      [[side*.042,.062,.176],[side*.076,.076,.178],[side*.110,.066,.162]], .006,12)
    for (let i=0;i<3;i++) {
      oval(head,softShadow,[side*(.090+i*.011),-.048-(i%2)*.008,.176-i*.008],[.0032,.0026,.0014])
    }
  }

  const hair=surface(23,48,(u,v)=>{
    const a=u*Math.PI*2
    const front=Math.max(0,Math.sin(a))
    const edge=1.90-.43*front
    const p=.001+v*edge
    return [Math.cos(a)*Math.sin(p)*.202,.086+Math.cos(p)*.163,Math.sin(a)*Math.sin(p)*.187-.013]
  })
  mesh(head,hair,scalpMaterial)
  const copper=new Color('#c28546')
  const honey=new Color('#dfab61')
  const tip=new Color('#f0c981')
  const locks=[
    [[-.136,.151,-.133],[-.060,.244,-.103],[-.102,.260,.005],[-.171,.201,.112],[-.151,.081,.134],.059,.038],
    [[-.049,.184,-.151],[.010,.252,-.106],[-.049,.275,.006],[-.110,.229,.138],[-.099,.114,.166],.065,.044],
    [[.039,.181,-.149],[.050,.250,-.084],[.014,.265,.030],[-.047,.231,.168],[-.119,.138,.178],.065,.042],
    [[.109,.172,-.139],[.118,.243,-.054],[.085,.255,.068],[.030,.218,.178],[-.041,.155,.190],.067,.038],
    [[.140,.145,-.120],[.162,.216,-.039],[.141,.229,.077],[.080,.177,.162],[.039,.117,.187],.060,.040],
    [[.150,.105,-.119],[.198,.163,-.057],[.204,.164,.025],[.174,.107,.090],[.149,.073,.119],.051,.038],
    [[-.146,.105,-.123],[-.185,.150,-.062],[-.197,.139,.006],[-.185,.047,.058],[-.172,.018,.033],.048,.029],
    [[.052,.082,-.154],[.015,.199,-.193],[-.058,.179,-.213],[-.128,.080,-.179],[-.145,.032,-.137],.072,.038],
    [[.107,.186,-.055],[.082,.257,.006],[.040,.297,.043],[-.015,.316,.080],[-.071,.294,.113],.044,.029],
  ]
  for(const [index,lock] of locks.entries()) {
    tress(head,lockMaterial,lock.slice(0,5),lock[5],lock[6],index%3===0?copper:honey,tip)
  }
  return eyes
}
