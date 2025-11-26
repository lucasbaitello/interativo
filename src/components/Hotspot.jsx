import * as THREE from 'three'
import { useEffect, useRef, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Line } from '@react-three/drei'

export default function Hotspot({
  id,
  position = [0, 0, 0],
  debugActive = false,
  onClick,
  onDragStart,
  onDragEnd,
  onMove,
  onPointUpdate, // Nova prop para atualizar pontos individuais
  shape = 'sphere',
  size = 0.2,
  width = 1,
  height = 1,
  depth = 0.1,
  rotation = 0,
  color = '#3b82f6',
  opacity = 0.6,
  points = [] // Para polígonos
}) {
  const draggingRef = useRef(false)
  const [draggingPointIndex, setDraggingPointIndex] = useState(null)
  const groupRef = useRef()
  const { camera, gl } = useThree()

  useEffect(() => {
    const endDrag = () => {
      if (draggingRef.current || draggingPointIndex !== null) {
        draggingRef.current = false
        setDraggingPointIndex(null)
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
  }, [onDragEnd, draggingPointIndex])

  useEffect(() => {
    const onPointerMove = (e) => {
      // Se não estiver arrastando nada, sai
      if (!draggingRef.current && draggingPointIndex === null) return
      if (!(e.buttons & 1)) return

      const canvas = gl?.domElement || document.querySelector('canvas')
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1)

      const raycaster = new THREE.Raycaster()
      raycaster.setFromCamera({ x, y }, camera)

      const radius = 10
      const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), radius)
      const target = new THREE.Vector3()
      const hit = raycaster.ray.intersectSphere(sphere, target)

      const newPos = hit ? [hit.x, hit.y, hit.z] : [
        raycaster.ray.direction.clone().normalize().multiplyScalar(radius).x,
        raycaster.ray.direction.clone().normalize().multiplyScalar(radius).y,
        raycaster.ray.direction.clone().normalize().multiplyScalar(radius).z
      ]

      if (draggingPointIndex !== null) {
        // Arrastando um ponto específico do polígono
        onPointUpdate && onPointUpdate(id, draggingPointIndex, newPos)
      } else {
        // Arrastando o hotspot inteiro
        onMove && onMove(newPos)
      }
    }
    window.addEventListener('pointermove', onPointerMove)
    return () => window.removeEventListener('pointermove', onPointerMove)
  }, [camera, gl, onMove, onPointUpdate, draggingPointIndex, id])

  useFrame(() => {
    if (groupRef.current && shape !== 'polygon') {
      groupRef.current.lookAt(camera.position)
    }
  })

  // Geometria customizada para o polígono
  const polygonGeometry = useMemo(() => {
    if (shape !== 'polygon' || !points || points.length < 3) return null

    // Criar geometria a partir dos pontos 3D
    const geometry = new THREE.BufferGeometry()
    const vertices = new Float32Array(points.flat())
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))

    // Triangulação simples (Fan) assumindo convexidade ou ordem correta
    const indices = []
    for (let i = 1; i < points.length - 1; i++) {
      indices.push(0, i, i + 1)
    }
    geometry.setIndex(indices)
    geometry.computeVertexNormals()

    return geometry
  }, [shape, points])

  // Linha de contorno para o polígono
  const polygonLinePoints = useMemo(() => {
    if (shape !== 'polygon' || !points) return []
    if (points.length === 0) return []
    return points.length > 2 ? [...points, points[0]] : points
  }, [shape, points])

  if (shape === 'polygon') {
    return (
      <group>
        {/* Mesh preenchido para clique */}
        {polygonGeometry && (
          <mesh
            geometry={polygonGeometry}
            onClick={(e) => {
              e.stopPropagation()
              onClick && onClick()
            }}
            onPointerDown={(e) => {
              if (!debugActive) return
              e.stopPropagation()
              // Desativado arrastar o polígono inteiro para evitar conflitos
            }}
            onPointerOver={() => (document.body.style.cursor = 'pointer')}
            onPointerOut={() => { document.body.style.cursor = 'default' }}
            renderOrder={2000}
          >
            <meshBasicMaterial
              color={color}
              transparent
              opacity={debugActive ? 0.3 : 0}
              side={THREE.DoubleSide}
              depthTest={false}
            />
          </mesh>
        )}

        {/* Linha de contorno (apenas debug) */}
        {debugActive && polygonLinePoints.length > 0 && (
          <Line
            points={polygonLinePoints}
            color={color}
            lineWidth={2}
            depthTest={false}
          />
        )}

        {/* Pontos de controle (apenas debug) */}
        {debugActive && points.map((p, i) => (
          <mesh
            key={i}
            position={p}
            onPointerDown={(e) => {
              if (!debugActive) return
              e.stopPropagation()
              setDraggingPointIndex(i)
            }}
            onPointerOver={() => (document.body.style.cursor = 'move')}
            onPointerOut={() => (document.body.style.cursor = 'default')}
          >
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshBasicMaterial color={draggingPointIndex === i ? "#fbbf24" : "white"} depthTest={false} />
          </mesh>
        ))}
      </group>
    )
  }

  return (
    <group ref={groupRef} position={position}>
      <mesh
        rotation={[0, 0, THREE.MathUtils.degToRad(rotation)]}
        onClick={(e) => {
          e.stopPropagation()
          onClick && onClick()
        }}
        onPointerDown={(e) => {
          if (!debugActive) return
          e.stopPropagation()
          draggingRef.current = true
          onDragStart && onDragStart(id)
        }}
        onPointerOver={() => (document.body.style.cursor = 'pointer')}
        onPointerOut={() => { document.body.style.cursor = 'default' }}
        renderOrder={2000}
      >
        {shape === 'box' ? (
          <boxGeometry args={[width, height, depth]} />
        ) : (
          <sphereGeometry args={[size, 32, 32]} />
        )}
        <meshBasicMaterial
          color={color}
          transparent
          opacity={debugActive ? opacity : 0}
          depthWrite={false}
        />
      </mesh>
      {debugActive && (
        <mesh>
          <sphereGeometry args={[0.05, 16, 16]} />
          <meshBasicMaterial color="white" />
        </mesh>
      )}
    </group>
  )
}