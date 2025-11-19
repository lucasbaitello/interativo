import * as THREE from 'three'
import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

export default function Hotspot({ position = [0, 0, 0], debugActive = false, onClick, onMove, onDragStart, onDragEnd, shape = 'sphere', size = 0.2, sizeX, sizeY, radius = 10 }) {
  const draggingRef = useRef(false)
  const meshRef = useRef()
  const { camera, gl } = useThree()

  // Finaliza arraste se o mouse/ponteiro for liberado fora do mesh
  useEffect(() => {
    const endDrag = () => {
      if (draggingRef.current) {
        draggingRef.current = false
        onDragEnd && onDragEnd()
      }
    }
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    window.addEventListener('pointerleave', endDrag)
    return () => {
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
      window.removeEventListener('pointerleave', endDrag)
    }
  }, [])

  // Continua o arraste mesmo fora do mesh, seguindo até o mouseup
  useEffect(() => {
    const onMove = (e) => {
      if (!draggingRef.current) return
      if (!(e.buttons & 1)) return // apenas com botão esquerdo pressionado
      const canvas = gl?.domElement || document.querySelector('canvas')
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)
      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera({ x, y }, camera)
      const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), radius)
      const target = new THREE.Vector3()
      const hit = raycaster.ray.intersectSphere(sphere, target)
      if (hit) {
        onMove && onMove([hit.x, hit.y, hit.z])
      } else {
        const v = raycaster.ray.direction.clone().normalize().multiplyScalar(radius)
        onMove && onMove([v.x, v.y, v.z])
      }
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [camera, gl, radius, onMove])

  // Sempre olhar para a câmera em cada frame
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.lookAt(camera.position)
    }
  })

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={onClick}
      onPointerDown={(e) => {
        if (!debugActive) return
        draggingRef.current = true
        e.stopPropagation()
        onDragStart && onDragStart()
      }}
      onPointerUp={() => {
        draggingRef.current = false
        onDragEnd && onDragEnd()
      }}
      onPointerMove={(e) => {
        // Move apenas enquanto clicado (botão esquerdo) e em modo debug
        if (!debugActive || !draggingRef.current || !(e.buttons & 1)) return
        e.stopPropagation()
        // Usa interseção do raio do ponteiro com a esfera para um arraste mais suave
        const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), radius)
        const target = new THREE.Vector3()
        const hit = e.ray?.intersectSphere(sphere, target)
        if (hit) {
          onMove && onMove([hit.x, hit.y, hit.z])
        } else {
          const p = e.point
          const v = new THREE.Vector3(p.x, p.y, p.z)
          if (v.lengthSq() > 0) v.normalize().multiplyScalar(radius)
          onMove && onMove([v.x, v.y, v.z])
        }
      }}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => { document.body.style.cursor = 'default' }}
      renderOrder={2000}
    >
      {shape === 'box' ? (
        // Usa um plano para evitar distorções e garantir face para a câmera
        <planeGeometry args={[sizeX ?? size, sizeY ?? size]} />
      ) : (
        <sphereGeometry args={[size, 16, 16]} />
      )}
      <meshBasicMaterial
        color={new THREE.Color('#3b82f6')}
        transparent
        opacity={debugActive ? 0.6 : 0}
        depthWrite={false}
      />
    </mesh>
  )
}