import * as THREE from 'three'

export default function Hotspot({ position = [0, 0, 0], debugActive = false, onClick, shape = 'sphere', size = 0.2 }) {
  return (
    <mesh
      position={position}
      onClick={onClick}
      onPointerOver={() => (document.body.style.cursor = 'pointer')}
      onPointerOut={() => (document.body.style.cursor = 'default')}
      renderOrder={2000}
    >
      {shape === 'box' ? (
        <boxGeometry args={[size, size, size]} />
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