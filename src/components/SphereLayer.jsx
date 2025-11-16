import { useMemo } from 'react'
import * as THREE from 'three'

// Camada esférica com textura e blending configurável
// Comentário: ajuste o tamanho da esfera e o renderOrder conforme necessário.
export default function SphereLayer({ url, opacity = 1, blending = THREE.NormalBlending, renderOrder = 0 }) {
  const { geometry, material } = useMemo(() => {
    const geometry = new THREE.SphereGeometry(10, 64, 64)
    // Cache de textura habilitado
    THREE.Cache.enabled = true
    const loader = new THREE.TextureLoader()
    const texture = loader.load(url)
    // Usa LinearSRGB para acumular em espaço linear antes da conversão final
    texture.colorSpace = THREE.LinearSRGBColorSpace

    const material = new THREE.MeshBasicMaterial({
      map: texture,
      side: THREE.BackSide,
      transparent: true,
      depthWrite: false,
      blending,
      opacity
    })
    return { geometry, material }
  }, [url, opacity, blending])

  return (
    // Corrige inversão horizontal do panorama aplicando escala negativa no eixo X
    <mesh geometry={geometry} material={material} renderOrder={renderOrder} scale={[-1, 1, 1]} />
  )
}