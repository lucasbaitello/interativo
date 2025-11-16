import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useState } from 'react'
import SphereLayer from '../components/SphereLayer'
import LightControls from '../components/LightControls'
import { sortLights } from '../lib/utils'
import * as THREE from 'three'

export default function Viewer() {
  const [files, setFiles] = useState([])
  const [values, setValues] = useState({}) // intensidade 0..10 por arquivo
  const [showFinal, setShowFinal] = useState(true)
  const [collapsed, setCollapsed] = useState(false)

  // Carrega manifest com lista de arquivos em /public/img/luzes
  useEffect(() => {
    fetch('/manifest.json')
      .then(r => r.json())
      .then(list => {
        const sorted = sortLights(list)
        setFiles(sorted)
        // estado inicial: intensidade 5 para todas as luzes
        const v = {}
        for (const f of sorted) {
          if (!/FINAL\.[a-zA-Z]+$/.test(f)) v[f] = 5
        }
        setValues(v)
      })
      .catch(() => {
        console.warn('manifest.json não encontrado. Rode: npm run sync-assets')
      })
  }, [])

  const baseUrl = '/img/luzes/'
  const baseFile = useMemo(() => files.find(f => /FINAL\.[a-zA-Z]+$/.test(f)), [files])
  const lightFiles = useMemo(() => files.filter(f => !/FINAL\.[a-zA-Z]+$/.test(f)), [files])

  const handleChange = (file, val) => setValues(prev => ({ ...prev, [file]: val }))
  const currentBlending = THREE.AdditiveBlending

  return (
    <div className="h-screen w-screen overflow-hidden">
      <Canvas
        camera={{ position: [0, 0, 0.01], fov: 75 }}
        onCreated={(state) => {
          // Acúmulo em espaço linear para reduzir ruído em adição de camadas
          state.gl.outputColorSpace = THREE.LinearSRGBColorSpace
          state.gl.toneMapping = THREE.NoToneMapping
        }}
      >
        {/* Base: luzes */}
        {lightFiles.map(f => (
          <SphereLayer key={f} url={`${baseUrl}${f}`} blending={currentBlending} opacity={(values[f] ?? 10) / 10} renderOrder={0} />
        ))}

        {/* Overlay FINAL: não faz parte da pilha de efeitos, sobrepõe quando ativo */}
        {showFinal && baseFile && (
          <SphereLayer url={`${baseUrl}${baseFile}`} blending={THREE.NormalBlending} opacity={1} renderOrder={1000} />
        )}

        {/* Controles de câmera para navegação 360° */}
        <OrbitControls enablePan={false} enableZoom={false} rotateSpeed={0.5} />
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

      {/* Botões utilitários futuros podem ser adicionados aqui */}
    </div>
  )
}