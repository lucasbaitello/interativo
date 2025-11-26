import { useRef, useState, useEffect } from 'react';
import { Html } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export default function Portal({
    id,
    position,
    targetEnvironment,
    label = 'Portal',
    icon = 'geo-alt-fill',
    color = '#ffffff',
    opacity = 1,
    scale = 1,
    debugMode = false,
    onPortalClick,
    onDragStart,
    onDragEnd,
    onMove,
}) {
    const meshRef = useRef();
    const [hovered, setHovered] = useState(false);
    const propsRef = useRef({ onMove });

    useEffect(() => {
        propsRef.current.onMove = onMove;
    }, [onMove]);

    const draggingRef = useRef(false);
    const { camera, gl } = useThree();

    useEffect(() => {
        const endDrag = () => {
            if (draggingRef.current) {
                draggingRef.current = false;
                onDragEnd && onDragEnd();
            }
        };
        window.addEventListener('pointerup', endDrag);
        window.addEventListener('pointercancel', endDrag);
        window.addEventListener('pointerleave', endDrag);
        return () => {
            window.removeEventListener('pointerup', endDrag);
            window.removeEventListener('pointercancel', endDrag);
            window.removeEventListener('pointerleave', endDrag);
        };
    }, [onDragEnd]);

    useEffect(() => {
        const onMoveFn = (e) => {
            if (!draggingRef.current) return;
            if (!(e.buttons & 1)) return;

            const { onMove: onMoveProp } = propsRef.current;
            if (!onMoveProp) return;

            const canvas = gl?.domElement || document.querySelector('canvas');
            if (!canvas) return;

            const rect = canvas.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
            const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);

            const raycaster = new THREE.Raycaster();
            raycaster.setFromCamera({ x, y }, camera);

            const radius = 10;
            const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), radius);
            const target = new THREE.Vector3();
            const hit = raycaster.ray.intersectSphere(sphere, target);

            if (hit) {
                onMoveProp([hit.x, hit.y, hit.z]);
            } else {
                const v = raycaster.ray.direction.clone().normalize().multiplyScalar(radius);
                onMoveProp([v.x, v.y, v.z]);
            }
        };
        window.addEventListener('pointermove', onMoveFn);
        return () => window.removeEventListener('pointermove', onMoveFn);
    }, [camera, gl]);

    const handleClick = (e) => {
        e.stopPropagation();
        if (onPortalClick) {
            onPortalClick({ id, targetEnvironment, label });
        }
    };

    const handlePointerDown = (e) => {
        if (debugMode) {
            e.stopPropagation();
            draggingRef.current = true;
            onDragStart && onDragStart(id);
        }
    };

    const handlePointerUp = (e) => {
        if (debugMode) {
            e.stopPropagation();
            draggingRef.current = false;
            onDragEnd && onDragEnd();
        }
    };

    const iconSize = 32 * scale;

    return (
        <group position={position}>
            {/* Hitbox invisível (esfera) */}
            <mesh
                ref={meshRef}
                onClick={handleClick}
                onPointerDown={handlePointerDown}
                onPointerUp={handlePointerUp}
                onPointerOver={() => setHovered(true)}
                onPointerOut={() => setHovered(false)}
            >
                <sphereGeometry args={[0.3 * scale, 16, 16]} />
                <meshBasicMaterial
                    color={debugMode ? '#ff00ff' : color}
                    transparent
                    opacity={debugMode ? 0.3 : 0}
                    depthWrite={false}
                />
            </mesh>

            {/* Elemento HTML */}
            <Html
                position={[0, 0, 0]}
                distanceFactor={10}
                style={{
                    pointerEvents: 'none',
                    userSelect: 'none',
                }}
            >
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transform: `translate(-50%, -50%) ${hovered && !debugMode ? 'translateY(-10px)' : ''}`,
                    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.27)',
                    opacity: opacity,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: color,
                    textShadow: '0 2px 8px rgba(0,0,0,0.6)'
                }}>
                    <i
                        className={`bi bi-${icon}`}
                        style={{ fontSize: `${iconSize}px`, lineHeight: 1, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                    ></i>

                    <div
                        className={`mt-1 px-2 py-1 bg-black/70 backdrop-blur-md rounded text-white text-xs whitespace-nowrap transition-all duration-300 absolute top-full ${(hovered || debugMode) ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
                            }`}
                        style={{ left: '50%', transform: 'translateX(-50%)' }}
                    >
                        {label === 'Portal' ? (targetEnvironment || 'Sem destino') : label}
                        {debugMode && <span className="opacity-50 ml-1 text-[10px]">({id.slice(0, 4)})</span>}
                    </div>
                </div>
            </Html>
        </group>
    );
}
