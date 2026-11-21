export function disposeAssets(root, extraMaterials = []) {
  const geometries = new Set()
  const materials = new Set(extraMaterials)
  root.traverse((object) => {
    if (object.isLight) object.shadow?.dispose()
    if (!object.isMesh && !object.isSprite && !object.isLine) return
    if (object.isMesh || object.isLine) geometries.add(object.geometry)
    if (object.isReflector) {
      object.dispose()
      return
    }
    const meshMaterials = Array.isArray(object.material) ? object.material : [object.material]
    for (const material of meshMaterials) materials.add(material)
    if (object.isInstancedMesh) object.dispose()
  })

  const textures = new Set()
  for (const geometry of geometries) geometry.dispose()
  for (const material of materials) {
    if (!material.isMaterial) continue
    for (const value of Object.values(material)) {
      if (value?.isTexture) textures.add(value)
    }
    material.dispose()
  }
  for (const texture of textures) texture.dispose()
}
