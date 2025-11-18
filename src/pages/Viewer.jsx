import { Canvas, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import { useEffect, useMemo, useRef, useState } from 'react'
import SphereLayer from '../components/SphereLayer'
import LightControls from '../components/LightControls'
import UserPanel from '../components/UserPanel'
import Hotspot from '../components/Hotspot'
import { sortLights, sanitizeLabel } from '../lib/utils'
import * as THREE from 'three'

export default function Viewer() {
  const [files, setFiles] = useState([])
// Personalização: defina valores padrão por arquivo aqui (ex.: 5)
const [values, setValues] = useState({}) // intensidade 0..10 por arquivo
  const [showFinal, setShowFinal] = useState(false)
  const [collapsed, setCollapsed] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const lastClickRef = useRef(0)
  const [debugClick, setDebugClick] = useState(false)
  const [hotspots, setHotspots] = useState([])
  const [editingHotspotId, setEditingHotspotId] = useState(null)
  const [menuSelection, setMenuSelection] = useState({})
  const [lightsState, setLightsState] = useState({})
  const [daylightTargets, setDaylightTargets] = useState([]) // arquivos controlados pelo slider Luz do Dia
  const containerRef = useRef(null)
  const canvasElRef = useRef(null)
  const [userPanelOpen, setUserPanelOpen] = useState(true)
  const [temperature, setTemperature] = useState(0) // -40..40
  const [presetData, setPresetData] = useState(null)
  const [adjustmentsOpen, setAdjustmentsOpen] = useState(false)
  const [adjustments, setAdjustments] = useState({ saturation: 1, contrast: 1, gamma: 1, brightness: 1, highlights: 0, denoise: 0 })

  // Carrega estado salvo imediatamente, antes do manifest, para evitar perda visual após refresh
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('viewerState') || '{}')
      if (saved) {
        if (saved.values) setValues(saved.values)
        if (saved.lightsState) setLightsState(saved.lightsState)
        if (Array.isArray(saved.hotspots)) setHotspots(saved.hotspots)
        if (typeof saved.debugClick === 'boolean') setDebugClick(saved.debugClick)
        if (typeof saved.showFinal === 'boolean') setShowFinal(saved.showFinal)
        if (Array.isArray(saved.daylightTargets)) setDaylightTargets(saved.daylightTargets)
        if (saved.adjustments) setAdjustments(prev => ({ ...prev, ...saved.adjustments }))
      }
    } catch {}
  }, [])

  // Auto-carregamento de preset se existir (prioriza preset sobre localStorage e defaults)
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        // Ajuste aqui o caminho do preset padrão
        // Exemplo: '/presets/luzes/viewerState.json' (coloque seu arquivo lá)
        const r = await fetch('/presets/luzes/viewerState.json', { cache: 'no-store' })
        if (r.ok) {
          const preset = await r.json()
          if (cancelled) return
          setPresetData(preset)
          if (preset.values) setValues(prev => ({ ...prev, ...preset.values }))
          if (preset.lightsState) {
            setLightsState(prev => {
              const next = { ...prev }
              for (const f of Object.keys(preset.lightsState)) {
                const src = preset.lightsState[f] || {}
                next[f] = {
                  ...prev[f],
                  ...src,
                  pontos: Array.isArray(src.pontos) ? src.pontos : (prev[f]?.pontos || [])
                }
              }
              return next
            })
          }
          if (Array.isArray(preset.hotspots)) setHotspots(preset.hotspots)
          if (typeof preset.debugClick === 'boolean') setDebugClick(preset.debugClick)
          if (typeof preset.showFinal === 'boolean') setShowFinal(preset.showFinal)
          if (Array.isArray(preset.daylightTargets)) setDaylightTargets(preset.daylightTargets)
        }
      } catch (e) {
        console.warn('Preset padrão não encontrado ou inválido:', e)
      }
    })()
    return () => { cancelled = true }
  }, [])

  // Carrega manifest com lista de arquivos em /public/img/luzes
  useEffect(() => {
    fetch('/manifest.json')
      .then(r => r.json())
      .then(list => {
        const sorted = sortLights(list)
        setFiles(sorted)
        // estado inicial: intensidade 50 (0–100) para todas as luzes
        const v = {}
        const ls = {}
        const defaultDaylightTargets = []
        for (const f of sorted) {
          if (!/FINAL\.[a-zA-Z]+$/.test(f)) {
            v[f] = 50
            ls[f] = {
              nome: sanitizeLabel(f),
              estado: true,
              dimmerizavel: false, // padrão desativado
              valor: 50,
              pontos: []
            }
            const s = sanitizeLabel(f)
            if (s === 'DOME' || s === 'DOME 2' || s === 'REFORCO DO SOL') {
              defaultDaylightTargets.push(f)
            }
          }
        }
        // Mescla com persistência local, se existir
        try {
          const saved = JSON.parse(localStorage.getItem('viewerState') || '{}')
          const vMerged = { ...v, ...(saved?.values || {}) }
          if (vMerged.__daylight == null) vMerged.__daylight = saved?.values?.__daylight ?? 50
          const lsMerged = { ...ls }
          if (saved?.lightsState) {
            for (const f of Object.keys(lsMerged)) {
              lsMerged[f] = { ...lsMerged[f], ...(saved.lightsState[f] || {}) }
              if (!Array.isArray(lsMerged[f].pontos)) lsMerged[f].pontos = []
            }
          }
          setValues(vMerged)
          setLightsState(lsMerged)
          if (Array.isArray(saved?.hotspots)) setHotspots(saved.hotspots)
          if (typeof saved?.debugClick === 'boolean') setDebugClick(saved.debugClick)
          if (typeof saved?.showFinal === 'boolean') setShowFinal(saved.showFinal)
          setDaylightTargets(Array.isArray(saved?.daylightTargets) ? saved.daylightTargets : defaultDaylightTargets)
        } catch {
          setValues(v)
          setLightsState(ls)
          setDaylightTargets(defaultDaylightTargets)
        }
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

  const handleChange = (file, val) => {
    if (file === '__daylight') {
      // Aplicar controle simultâneo conforme configuração do desenvolvedor
      const targets = daylightTargets.length ? daylightTargets : []
      setValues(prev => {
        const next = { ...prev, __daylight: val }
        for (const t of targets) next[t] = val
        return next
      })
    } else {
      setValues(prev => ({ ...prev, [file]: val }))
      // Ao ajustar sliders dimerizáveis, ligue a luz automaticamente
      setLightsState(prev => {
        const cur = prev[file] || {}
        if (cur.dimmerizavel) {
          return { ...prev, [file]: { ...cur, estado: true, valor: val } }
        }
        return { ...prev, [file]: { ...cur, valor: val } }
      })
    }
  }
  const currentBlending = THREE.AdditiveBlending

  // Converte temperatura para um "tint" multiplicativo: positivo = mais quente; negativo = mais frio
  const tintColor = useMemo(() => {
    const clamp = (n, min, max) => Math.min(Math.max(n, min), max)
    const t = clamp(temperature, -40, 40)
    if (t === 0) return '#ffffff'
    if (t > 0) {
      const k = t / 40 // 0..1
      const r = 1.0
      const g = 1.0 - 0.15 * k
      const b = 1.0 - 0.30 * k
      const c = new THREE.Color(r, g, b)
      return c
    } else {
      const k = (-t) / 40 // 0..1
      const r = 1.0 - 0.20 * k
      const g = 1.0 - 0.10 * k
      const b = 1.0
      const c = new THREE.Color(r, g, b)
      return c
    }
  }, [temperature])

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

  // Adiciona hotspot na superfície da esfera ao clicar em modo debug
  const addHotspot = (point) => {
    const id = (self.crypto && self.crypto.randomUUID) ? self.crypto.randomUUID() : `${Date.now()}-${Math.floor(Math.random()*1e6)}`
    setHotspots(prev => [...prev, { id, position: [point.x, point.y, point.z], lights: [], shape: 'sphere', size: 0.2 }])
    setEditingHotspotId(id)
    const initialSel = {}
    for (const f of files.filter(f => !/FINAL\.[a-zA-Z]+$/.test(f))) initialSel[f] = false
    setMenuSelection(initialSel)
  }

  const assignLightsToHotspot = () => {
    if (!editingHotspotId) return
    const selected = Object.keys(menuSelection).filter(f => menuSelection[f])
    // Atualiza luzes do hotspot
    setHotspots(prev => prev.map(h => h.id === editingHotspotId ? { ...h, lights: selected } : h))
    // Reconciliar pontos nas luzes: adiciona aos selecionados (sem duplicar) e remove dos não selecionados
    setLightsState(prev => {
      const next = { ...prev }
      for (const f of Object.keys(next)) {
        const pts = Array.isArray(next[f]?.pontos) ? next[f].pontos : []
        const has = pts.includes(editingHotspotId)
        if (selected.includes(f)) {
          // garantir único
          next[f] = { ...next[f], pontos: has ? pts : [...pts, editingHotspotId] }
        } else {
          // remover se existir
          next[f] = { ...next[f], pontos: pts.filter(id => id !== editingHotspotId) }
        }
      }
      return next
    })
    setEditingHotspotId(null)
  }

  const onHotspotClick = (hotspot) => {
    if (debugClick) {
      setEditingHotspotId(hotspot.id)
      const initialSel = {}
      for (const f of files.filter(f => !/FINAL\.[a-zA-Z]+$/.test(f))) initialSel[f] = hotspot.lights?.includes(f) || false
      setMenuSelection(initialSel)
    } else {
      setLightsState(prev => {
        const next = { ...prev }
        for (const f of hotspot.lights || []) {
          const cur = next[f] || { estado: true, dimmerizavel: true, valor: values[f] ?? 50, nome: sanitizeLabel(f), pontos: [] }
          const novoEstado = !cur.estado
          next[f] = { ...cur, estado: novoEstado }
          // Para luzes não dimerizáveis, o slider define valor absoluto;
          // ao ligar/desligar não alteramos o valor (apenas estado).
        }
        return next
      })
    }
  }

  const toggleDimmerizavel = (file) => {
    setLightsState(prev => ({
      ...prev,
      [file]: { ...prev[file], dimmerizavel: !(prev[file]?.dimmerizavel !== false) }
    }))
  }

  const unlinkHotspotFromLight = (file, hotspotId) => {
    // Remove o link da luz
    setLightsState(prev => ({
      ...prev,
      [file]: { ...prev[file], pontos: (prev[file]?.pontos || []).filter(id => id !== hotspotId) }
    }))
    // Remove a luz do hotspot
    setHotspots(prev => prev.map(h => h.id === hotspotId ? { ...h, lights: (h.lights || []).filter(f => f !== file) } : h))
  }

  // Persistência: salva alterações relevantes no localStorage
  useEffect(() => {
    try {
      const payload = {
        values,
        lightsState,
        hotspots,
        debugClick,
        showFinal,
        daylightTargets,
        adjustments
      }
      localStorage.setItem('viewerState', JSON.stringify(payload))
    } catch (e) {
      console.warn('Falha ao salvar viewerState no localStorage:', e)
    }
  }, [values, lightsState, hotspots, debugClick, showFinal, daylightTargets, adjustments])

  // Aplica filtros CSS globais (saturação, contraste, gama aprox., destaque e redução de ruído)
  useEffect(() => {
    const el = canvasElRef.current
    if (!el) return
    const { saturation = 1, contrast = 1, gamma = 1, brightness = 1, highlights = 0, denoise = 0 } = adjustments || {}
    const brightnessFromGamma = Math.pow(gamma, -0.5)
    const contrastAdj = contrast * (1 + (highlights || 0) * 0.25)
    const brightnessAdj = brightnessFromGamma * brightness * (1 + (highlights || 0) * 0.12)
    const blurPx = Math.max(0, denoise || 0)
    const filter = `saturate(${saturation}) contrast(${contrastAdj}) brightness(${brightnessAdj}) ${blurPx > 0 ? `blur(${blurPx}px)` : ''}`.trim()
    el.style.filter = filter
  }, [adjustments])

  return (
    <div ref={containerRef} className="h-screen w-screen overflow-hidden relative">
      <Canvas
        camera={{ position: [0, 0, 1], fov: 75, near: 0.000001, far: 2000000 }}
        onCreated={(state) => {
          // Acúmulo em espaço linear para reduzir ruído em adição de camadas
/* Renderização em espaço linear para acumulação aditiva mais suave */
state.gl.outputColorSpace = THREE.LinearSRGBColorSpace
state.gl.toneMapping = THREE.NoToneMapping
          canvasElRef.current = state.gl.domElement
        }}
      >
        {/* Base: luzes */}
        {lightFiles.map(f => {
          const estadoOn = lightsState?.[f]?.estado !== false
          const opacity = estadoOn ? (values[f] ?? 50) / 100 : 0
          return (
            <SphereLayer key={f} url={`${baseUrl}${f}`} blending={currentBlending} opacity={opacity} renderOrder={0} tint={tintColor} />
          )
        })}

        {/* Esfera de picking invisível para capturar coordenadas quando em modo debug */}
        <mesh
          onDoubleClick={(e) => {
            if (!debugClick) return
            if (editingHotspotId) return
            addHotspot(e.point)
          }}
          renderOrder={-100}
          scale={[-1, 1, 1]}
        >
          <sphereGeometry args={[10, 64, 64]} />
          <meshBasicMaterial side={THREE.BackSide} transparent opacity={0} depthWrite={false} />
        </mesh>

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

        {/* Hotspots */}
        {hotspots.map(h => (
          <Hotspot
            key={h.id}
            position={h.position}
            debugActive={debugClick}
            onClick={() => onHotspotClick(h)}
            onMove={(pos) => setHotspots(prev => prev.map(x => x.id === h.id ? { ...x, position: pos } : x))}
            shape={h.shape}
            size={h.size}
            sizeX={h.sizeX}
            sizeY={h.sizeY}
            radius={10}
          />
        ))}
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
        debugClick={debugClick}
        onToggleDebugClick={() => setDebugClick(v => !v)}
        lightsState={lightsState}
        hotspots={hotspots}
        onToggleDimmerizavel={toggleDimmerizavel}
        onUnlinkHotspot={unlinkHotspotFromLight}
        daylightTargets={daylightTargets}
        onUpdateDaylightTargets={(targets) => setDaylightTargets(targets)}
      />

      {/* Janela flutuante de Ajustes Avançados */}
      {adjustmentsOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50" onClick={() => setAdjustmentsOpen(false)} />
          <div className="fixed right-20 top-1/2 -translate-y-1/2 w-80 glass rounded-2xl p-4 z-50 shadow-2xl shadow-black/40">
            <div className="flex items-center justify-between mb-2">
              <div className="text-white/90 text-sm font-medium">Ajustes avançados</div>
              <button className="w-8 h-8 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center" onClick={() => setAdjustmentsOpen(false)} aria-label="Fechar ajustes"><i className="bi bi-x text-white" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-[11px] text-neutral-200 mb-1">Temperatura de cor</div>
                <input type="range" min={-40} max={40} step={1} value={temperature} onChange={e => setTemperature(parseFloat(e.target.value))} className="w-full range-thick" style={{ '--progress': `${(temperature + 40) / 80 * 100}%` }} />
              </div>
              <div>
                <div className="text-[11px] text-neutral-200 mb-1">Saturação</div>
                <input type="range" min={0} max={2} step={0.01} value={adjustments.saturation} onChange={e => setAdjustments(a => ({ ...a, saturation: parseFloat(e.target.value) }))} className="w-full range-thick" style={{ '--progress': `${(adjustments.saturation / 2) * 100}%` }} />
              </div>
              <div>
                <div className="text-[11px] text-neutral-200 mb-1">Contraste</div>
                <input type="range" min={0.5} max={2} step={0.01} value={adjustments.contrast} onChange={e => setAdjustments(a => ({ ...a, contrast: parseFloat(e.target.value) }))} className="w-full range-thick" style={{ '--progress': `${((adjustments.contrast - 0.5) / 1.5) * 100}%` }} />
              </div>
              <div>
                <div className="text-[11px] text-neutral-200 mb-1">Gama</div>
                <input type="range" min={0.5} max={2} step={0.01} value={adjustments.gamma} onChange={e => setAdjustments(a => ({ ...a, gamma: parseFloat(e.target.value) }))} className="w-full range-thick" style={{ '--progress': `${((adjustments.gamma - 0.5) / 1.5) * 100}%` }} />
              </div>
              <div>
                <div className="text-[11px] text-neutral-200 mb-1">Brilho</div>
                <input type="range" min={0.5} max={1.5} step={0.01} value={adjustments.brightness} onChange={e => setAdjustments(a => ({ ...a, brightness: parseFloat(e.target.value) }))} className="w-full range-thick" style={{ '--progress': `${((adjustments.brightness - 0.5) / 1.0) * 100}%` }} />
              </div>
              <div>
                <div className="text-[11px] text-neutral-200 mb-1">Highlight burn</div>
                <input type="range" min={0} max={1} step={0.01} value={adjustments.highlights} onChange={e => setAdjustments(a => ({ ...a, highlights: parseFloat(e.target.value) }))} className="w-full range-thick" style={{ '--progress': `${(adjustments.highlights) * 100}%` }} />
              </div>
              <div>
                <div className="text-[11px] text-neutral-200 mb-1">Redução de ruído</div>
                <input type="range" min={0} max={4} step={0.1} value={adjustments.denoise} onChange={e => setAdjustments(a => ({ ...a, denoise: parseFloat(e.target.value) }))} className="w-full range-thick" style={{ '--progress': `${(adjustments.denoise / 4) * 100}%` }} />
              </div>
              <div className="pt-2 flex justify-end">
                <button className="px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-shadow" onClick={() => { setAdjustments({ saturation: 1, contrast: 1, gamma: 1, brightness: 1, highlights: 0, denoise: 0 }); setTemperature(0) }}>restaurar padrão</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Painel do Usuário: Luz do Dia + sliders compactos */}
      <UserPanel
        open={userPanelOpen}
        onToggle={() => setUserPanelOpen(v => !v)}
        values={values}
        onChange={handleChange}
        lightsState={lightsState}
        onPresetAll={() => {
          if (presetData) {
            if (presetData.values) setValues(prev => ({ ...prev, ...presetData.values }))
            setLightsState(prev => {
              const next = { ...prev }
              for (const f of Object.keys(next)) {
                next[f] = { ...next[f], estado: true }
              }
              if (presetData.lightsState) {
                for (const f of Object.keys(presetData.lightsState)) {
                  next[f] = { ...next[f], ...presetData.lightsState[f], estado: true }
                }
              }
              return next
            })
          } else {
            setLightsState(prev => {
              const next = { ...prev }
              for (const f of Object.keys(next)) next[f] = { ...next[f], estado: true }
              return next
            })
          }
        }}
        onTurnOffExceptDaylight={() => {
          const targets = daylightTargets
          setLightsState(prev => {
            const next = { ...prev }
            for (const f of Object.keys(next)) {
              const keep = targets.includes(f)
              next[f] = { ...next[f], estado: keep }
            }
            return next
          })
        }}
        onOpenAdjustments={() => setAdjustmentsOpen(true)}
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

      {/* Menu flutuante para selecionar luzes do hotspot (centralizado + overlay cinza) */}
      {editingHotspotId && (
        <>
          <div className="fixed inset-0 bg-gray-800/50 z-40" />
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="glass rounded-xl p-4 w-80 shadow-2xl shadow-black/60 text-shadow">
              <div className="mb-2 text-sm font-semibold">Associar luzes ao ponto</div>
              {/* opções do ponto: forma e tamanho */}
              <div className="mb-3 grid grid-cols-2 gap-2 text-xs">
                <label className="flex flex-col">
                  <span>Forma</span>
                  <select
                    value={hotspots.find(h => h.id === editingHotspotId)?.shape || 'sphere'}
                    onChange={e => setHotspots(prev => prev.map(h => h.id === editingHotspotId ? { ...h, shape: e.target.value } : h))}
                    className="bg-white/10 rounded px-2 py-1"
                  >
                    <option value="sphere">Esfera</option>
                    <option value="box">Quadrado</option>
                  </select>
                </label>
                <label className="flex flex-col">
                  <span>Tamanho</span>
                  <input
                    type="range"
                    min={0.1}
                    max={0.6}
                    step={0.05}
                    value={hotspots.find(h => h.id === editingHotspotId)?.size || 0.2}
                    onChange={e => setHotspots(prev => prev.map(h => h.id === editingHotspotId ? { ...h, size: parseFloat(e.target.value) } : h))}
                  />
                </label>
                {/* Para quadrado, controle independente de largura/altura para formar retângulos */}
                {hotspots.find(h => h.id === editingHotspotId)?.shape === 'box' && (
                  <div className="col-span-2 grid grid-cols-2 gap-2">
                    <label className="flex flex-col">
                      <span>Largura</span>
                      <input
                        type="range"
                        min={0.1}
                        max={1.2}
                        step={0.05}
                        value={hotspots.find(h => h.id === editingHotspotId)?.sizeX ?? hotspots.find(h => h.id === editingHotspotId)?.size ?? 0.2}
                        onChange={e => setHotspots(prev => prev.map(h => h.id === editingHotspotId ? { ...h, sizeX: parseFloat(e.target.value) } : h))}
                      />
                    </label>
                    <label className="flex flex-col">
                      <span>Altura</span>
                      <input
                        type="range"
                        min={0.1}
                        max={1.2}
                        step={0.05}
                        value={hotspots.find(h => h.id === editingHotspotId)?.sizeY ?? hotspots.find(h => h.id === editingHotspotId)?.size ?? 0.2}
                        onChange={e => setHotspots(prev => prev.map(h => h.id === editingHotspotId ? { ...h, sizeY: parseFloat(e.target.value) } : h))}
                      />
                    </label>
                  </div>
                )}
              </div>
              <div className="max-h-56 overflow-auto space-y-2">
                {files.filter(f => !/FINAL\.[a-zA-Z]+$/.test(f)).map(f => (
                  <label key={f} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={menuSelection[f] || false}
                      onChange={e => setMenuSelection(prev => ({ ...prev, [f]: e.target.checked }))}
                    />
                    <span>{sanitizeLabel(f)}</span>
                  </label>
                ))}
              </div>
              <div className="mt-3 flex gap-2 justify-between">
                <button onClick={() => {
                  const id = editingHotspotId
                  // remove referências e o próprio ponto
                  setLightsState(prev => {
                    const next = { ...prev }
                    Object.keys(next).forEach(f => {
                      next[f] = { ...next[f], pontos: (next[f]?.pontos || []).filter(pid => pid !== id) }
                    })
                    return next
                  })
                  setHotspots(prev => prev.filter(h => h.id !== id))
                  setEditingHotspotId(null)
                }} className="px-3 py-1 rounded-md bg-red-500/70 hover:bg-red-500 text-xs shadow-lg">
                  <i className="bi bi-x-circle text-white mr-1" /> Apagar ponto
                </button>
                <button onClick={assignLightsToHotspot} className="px-3 py-1 rounded-md bg-white/15 hover:bg-white/25 text-xs">Confirmar</button>
                <button onClick={() => setEditingHotspotId(null)} className="px-3 py-1 rounded-md bg-white/10 hover:bg-white/20 text-xs">Cancelar</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}