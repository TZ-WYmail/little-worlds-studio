import { CanvasTexture, Group, Mesh, MeshBasicMaterial, PlaneGeometry, ShadowMaterial } from 'three'

export function createContactShadow() {
  const stage = new Group()
  const receiver = new Mesh(new PlaneGeometry(120, 120), new ShadowMaterial({
    color: '#141327', opacity: 0.23, depthWrite: false,
  }))
  receiver.rotation.x = -Math.PI / 2
  receiver.position.y = -1.006
  receiver.receiveShadow = true
  stage.add(receiver)

  const textureCanvas = document.createElement('canvas')
  textureCanvas.width = textureCanvas.height = 256
  const context = textureCanvas.getContext('2d')
  const gradient = context.createRadialGradient(128, 128, 30, 128, 128, 128)
  gradient.addColorStop(0, 'rgba(21, 19, 41, 0.82)')
  gradient.addColorStop(0.64, 'rgba(21, 19, 41, 0.64)')
  gradient.addColorStop(1, 'rgba(21, 19, 41, 0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 256, 256)
  const contact = new Mesh(new PlaneGeometry(19.6, 14.6), new MeshBasicMaterial({
    map: new CanvasTexture(textureCanvas), depthWrite: false, transparent: true, toneMapped: false,
  }))
  contact.rotation.x = -Math.PI / 2
  contact.position.set(0.35, -0.996, 0.27)
  stage.add(contact)
  return stage
}
