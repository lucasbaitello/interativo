import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import SphereLayer from '../components/SphereLayer'
import LightControls from '../components/LightControls'
import { sortLights } from '../lib/utils'
import * as THREE from 'three'

export default function Viewer() {
  const [files, setFiles] = useState([])
// Personalização: defina valores padrão por arquivo aqui (ex.: 5)
const [values, setValues] = useState({}) // intensidade 0..10 por arquivo
  const [showFinal, setShowFinal] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)

  // Carrega manifest com lista de arquivos em /public/img/luzes
  useEffect(() => {
    fetch('/manifest.json')
      .then(r => r.json())
      .then(list => {
        const sorted = sortLights(list)
        setFiles(sorted)
        // estado inicial: intensidade 50 (0–100) para todas as luzes
        const v = {}
        for (const f of sorted) {
          if (!/FINAL\.[a-zA-Z]+$/.test(f)) v[f] = 50
        }
        setValues(v)
      })
      .catch(() => {
        console.warn('manifest.json não encontrado. Rode: npm run sync-assets')
      })
  }, [])

  // Observa mudanças de fullscreen para atualizar estado
  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const baseUrl = '/img/luzes/'
  const baseFile = useMemo(() => files.find(f => /FINAL\.[a-zA-Z]+$/.test(f)), [files])
  const lightFiles = useMemo(() => files.filter(f => !/FINAL\.[a-zA-Z]+$/.test(f)), [files])

  const handleChange = (file, val) => setValues(prev => ({ ...prev, [file]: val }))
  const currentBlending = THREE.AdditiveBlending

  const toggleFullscreen = async () => {
    const el = containerRef.current
    try {
      if (document.fullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if (document.webkitExitFullscreen) {
          // Safari fallback
          document.webkitExitFullscreen()
        }
      } else if (el) {
        if (el.requestFullscreen) {
          await el.requestFullscreen()
        } else if (el.webkitRequestFullscreen) {
          // Safari fallback
          el.webkitRequestFullscreen()
        }
      }
    } catch (e) {
      console.warn('Falha ao alternar fullscreen:', e)
    }
  }

  // Zoom por FOV para panorama dentro da esfera
  // Você pode ajustar manualmente o zoom aqui:
  // - minFov: quanto MENOR, mais zoom-in (ex.: 1.5, 2, 3)
  // - maxFov: quanto MAIOR, mais zoom-out (ex.: 120, 140, 160)
  // - sensitivity: passo por rolagem (ex.: 0.08, 0.12, 0.16)
  function FovZoom({ minFov = 1.5, maxFov = 140, sensitivity = 0.12 }) {
    const { camera, gl } = useThree()
    useEffect(() => {
      const onWheel = (e) => {
        // Evita scroll da página ao usar zoom no canvas
        e.preventDefault()
        const direction = Math.sign(e.deltaY) // 1: afastar, -1: aproximar
        // Segure Shift para acelerar ainda mais o zoom
        const accel = e.shiftKey ? 2.5 : 1
        const step = camera.fov * sensitivity * accel
        camera.fov = THREE.MathUtils.clamp(camera.fov + direction * step, minFov, maxFov)
        camera.updateProjectionMatrix()
      }
      gl.domElement.addEventListener('wheel', onWheel, { passive: false })
      return () => gl.domElement.removeEventListener('wheel', onWheel)
    }, [camera, gl])
    return null
  }

  return (
    <div ref={containerRef} className="h-screen w-screen overflow-hidden relative">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75, near: 0.000001, far: 2000000 }}
        onCreated={(state) => {
          // Acúmulo em espaço linear para reduzir ruído em adição de camadas
/* Renderização em espaço linear para acumulação aditiva mais suave */
state.gl.outputColorSpace = THREE.LinearSRGBColorSpace
state.gl.toneMapping = THREE.NoToneMapping
        }}
      >
        {/* Base: luzes */}
        {lightFiles.map(f => (
<SphereLayer key={f} url={`${baseUrl}${f}`} blending={currentBlending} opacity={(values[f] ?? 50) / 100} renderOrder={0} />
        ))}

        {/* Overlay FINAL: não faz parte da pilha de efeitos, sobrepõe quando ativo */}
        {showFinal && baseFile && (
          <SphereLayer url={`${baseUrl}${baseFile}`} blending={THREE.NormalBlending} opacity={1} renderOrder={1000} />
        )}

        {/* Controles de câmera para navegação 360° */}
        <OrbitControls
          makeDefault
          enablePan={false}
          enableZoom={false}
          zoomSpeed={2.2}
          rotateSpeed={0.8}
          minDistance={0.00001}
          maxDistance={20000}
          enableDamping
          dampingFactor={0.06}
          target={[0, 0, 0]}
        />
        {/* Ajuste estes valores para personalizar a força do zoom FOV */}
        <FovZoom minFov={1.5} maxFov={140} sensitivity={0.12} />
      </Canvas>

      {/* HUD de controles */}
      <LightControls
        files={files}
        values={values}
        onChange={handleChange}
        showFinal={showFinal}
        onToggleFinal={() => setShowFinal(v => !v)}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(v => !v)}
      />

      {/* Botão de tela cheia (canto inferior direito) */}
      {/* Botão de tela cheia com hover-only */}
      <div className="group fixed bottom-4 right-4 z-50">
        <button
          onClick={toggleFullscreen}
          className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-lg shadow-black/40"
          aria-label={isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia'}
          title={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
        >
          {isFullscreen ? (
            <i className="bi bi-box-arrow-in-down-left text-white text-lg opacity-90 drop-shadow-lg" />
          ) : (
            <i className="bi bi-aspect-ratio text-white text-lg opacity-80 drop-shadow-lg" />
          )}
        </button>
      </div>

      {/* Área de hover para mostrar botão de sair (X) no topo quando em fullscreen */}
      {isFullscreen && (
        <div className="group fixed top-0 left-0 w-full h-12 z-50">
          <button
            onClick={toggleFullscreen}
            className="absolute right-4 top-2 w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 transition opacity-0 group-hover:opacity-100 flex items-center justify-center shadow-lg shadow-black/40"
            aria-label="Sair da tela cheia"
            title="Sair da tela cheia"
          >
            <i className="bi bi-box-arrow-in-down-left text-white opacity-90 drop-shadow-lg" />
          </button>
        </div>
      )}
    </div>
  )
}