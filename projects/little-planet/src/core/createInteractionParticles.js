import { DodecahedronGeometry, InstancedMesh, MeshStandardMaterial, Object3D, Vector3 } from 'three'
import { seededRandom } from './seededRandom.js'

export function createInteractionParticles(scene) {
  const water = new InstancedMesh(new DodecahedronGeometry(1,0),new MeshStandardMaterial({
    color:'#a8d1e1', roughness:.18, metalness:.12, emissive:'#80a5bc', emissiveIntensity:.14,
  }),18)
  const soil = new InstancedMesh(new DodecahedronGeometry(1,0),new MeshStandardMaterial({
    color:'#a17855', roughness:.9,
  }),17)
  water.frustumCulled=soil.frustumCulled=false
  water.visible=soil.visible=false
  scene.add(water,soil)
  const pose=new Object3D()
  const random=seededRandom(384)
  const offset=new Vector3()
  const directions=Array.from({length:soil.count},()=>new Vector3(random()-.5,.38+random()*.74,random()-.5))
  const rose=new Vector3()
  const spout=new Vector3()
  return (seconds, action, traveler, landmark, economy) => {
    water.visible=action.drop>.035
    soil.visible=action.soil>.035
    if (water.visible) {
      landmark.root.getWorldPosition(rose)
      rose.y+=.2
      traveler.pourPoint(spout)
      water.count=economy ? 10 : 18
      for (let i=0;i<water.count;i++) {
        const p=(seconds*2.35+i/water.count)%1
        pose.position.lerpVectors(spout,rose,p*p*.55+p*.45)
        pose.position.y+=Math.sin(p*Math.PI)*.104
        pose.position.x+=Math.sin(i*2.9)*p*.06
        pose.scale.set(.015*(1-p*.4),.026*(1-p*.31),.015*(1-p*.4))
        pose.rotation.z=p*2.1
        pose.updateMatrix()
        water.setMatrixAt(i,pose.matrix)
      }
      water.instanceMatrix.needsUpdate=true
    }
    if (soil.visible) {
      const base=action.root.getWorldPosition(offset)
      for (let i=0;i<soil.count;i++) {
        pose.position.copy(base).addScaledVector(directions[i],action.soil*.34)
        pose.scale.setScalar(.028*action.soil)
        pose.updateMatrix()
        soil.setMatrixAt(i,pose.matrix)
      }
      soil.instanceMatrix.needsUpdate=true
    }
  }
}
