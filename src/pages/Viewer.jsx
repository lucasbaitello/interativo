import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls, Line } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import SphereLayer from '../components/SphereLayer'
import LightControls from '../components/LightControls'
import UserPanel from '../components/UserPanel'
import SliderBar from '../components/SliderBar'
import Hotspot from '../components/Hotspot'
import Portal from '../components/Portal'
import HotspotEditor from '../components/HotspotEditor'
import LayerManager from '../components/LayerManager'
import EnvironmentSelector from '../components/EnvironmentSelector'
import { useEnvironment } from '../hooks/useEnvironment'
import { sortLights, sanitizeLabel } from '../lib/utils'
import * as THREE from 'three'

// Componente auxiliar para gerenciar câmera (salvar/carregar)
function CameraController({ saveTrigger, onSaveCamera, loadData }) {
  const { camera, gl } = useThree()
  const controlsRef = useRef()

  // Salvar câmera quando solicitado
  useEffect(() => {
    if (saveTrigger > 0) {
      const pos = camera.position.toArray()
      // OrbitControls target
      const target = controlsRef.current?.target?.toArray() || [0, 0, 0]
      onSaveCamera({ position: pos, target })
    }
  }, [saveTrigger, onSaveCamera])

  // Carregar câmera quando loadData mudar
  useEffect(() => {
    if (loadData && loadData.camera) {
      if (loadData.camera.position) {
        camera.position.fromArray(loadData.camera.position)
      }
      if (loadData.camera.target && controlsRef.current) {
        controlsRef.current.target.fromArray(loadData.camera.target)
      }
      camera.updateProjectionMatrix()
      controlsRef.current?.update()
    }
  }, [loadData, camera])

  return <OrbitControls ref={controlsRef} makeDefault enablePan={false} enableZoom={false} zoomSpeed={2.2} rotateSpeed={0.6} enableDamping dampingFactor={0.1} />
}

// Componente auxiliar para o cursor de desenho
function DrawingCursor({ isDrawing }) {
  const { camera, raycaster, pointer } = useThree()
  const cursorRef = useRef()

  useFrame(() => {
    if (!isDrawing || !cursorRef.current) return

    raycaster.setFromCamera(pointer, camera)
    const target = new THREE.Vector3()
    // Intersectar com uma esfera virtual de raio 10 (mesma do background)
    const sphere = new THREE.Sphere(new THREE.Vector3(0, 0, 0), 10)
    const hit = raycaster.ray.intersectSphere(sphere, target)

    if (hit) {
      cursorRef.current.position.copy(hit)
      cursorRef.current.lookAt(0, 0, 0) // Apontar para o centro
    } else {
      // Fallback se não intersectar (raro dentro da esfera)
      const v = raycaster.ray.direction.clone().normalize().multiplyScalar(10)
      cursorRef.current.position.copy(v)
      cursorRef.current.lookAt(0, 0, 0)
    }
  })

  if (!isDrawing) return null

  return (
    <mesh ref={cursorRef} renderOrder={9999}>
      <ringGeometry args={[0.1, 0.15, 32]} />
      <meshBasicMaterial color="yellow" depthTest={false} transparent opacity={0.8} side={THREE.DoubleSide} />
    </mesh>
  )
}

export default function Viewer() {
  const [files, setFiles] = useState([])
  const [layers, setLayers] = useState([])
  const [values, setValues] = useState({})
  const [collapsed, setCollapsed] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [debugClick, setDebugClick] = useState(false)
  const [showLayerManager, setShowLayerManager] = useState(false)

  // 'lights' = Modo Luzes (Padrão), 'final' = Modo Imagem Final
  const [viewMode, setViewMode] = useState('lights')

  // Permissão de modo de visualização: 'final_only', 'lights_only', 'both'
  const [viewModePermission, setViewModePermission] = useState('final_only')

  // Filtros de exibição de hotspots no modo debug
  const [visibleHotspotTypes, setVisibleHotspotTypes] = useState({
    switch: true,
    portal: true,
    swap: true
  })

  const [hotspots, setHotspots] = useState([])
  const [editingHotspotId, setEditingHotspotId] = useState(null)
  const [lightsState, setLightsState] = useState({})
  const [daylightTargets, setDaylightTargets] = useState([])
  const containerRef = useRef(null)
  const canvasElRef = useRef(null)
  const [userPanelOpen, setUserPanelOpen] = useState(true)

  const [presetData, setPresetData] = useState(null)
  const [adjustmentsOpen, setAdjustmentsOpen] = useState(false)
  // Ajustes: temperature substitui gamma, bloom adicionado
  const [adjustments, setAdjustments] = useState({
    saturation: 1,
    contrast: 1,
    brightness: 1,
    highlights: 0,
    denoise: 0,
    temperature: 0,
    bloomIntensity: 0
  })
  const [adjustmentsPos, setAdjustmentsPos] = useState(() => ({ x: 20, y: 20 }))
  const draggingAdjustRef = useRef(false)
  const dragOffsetRef = useRef({ x: 0, y: 0 })
  const adjustmentsModalRef = useRef(null)
  const [draggingHotspot, setDraggingHotspot] = useState(false)
  const [availableEnvs, setAvailableEnvs] = useState([])

  // Estado para desenho de polígono
  const [isDrawing, setIsDrawing] = useState(false)

  const [saveTrigger, setSaveTrigger] = useState(0)
  const saveActionType = useRef(null)

  const { currentEnv, envConfig, setCurrentEnv } = useEnvironment()

  // Carregar lista de ambientes
  useEffect(() => {
    fetch('/environments.json')
      .then(r => r.json())
      .then(setAvailableEnvs)
      .catch(() => { })
  }, [])

  // Carregar estado local (UI + ViewMode)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('viewerState') || '{}')
      if (saved) {
        if (typeof saved.debugClick === 'boolean') setDebugClick(saved.debugClick)
        if (saved.adjustments) setAdjustments(prev => ({ ...prev, ...saved.adjustments }))
        if (saved.viewMode) setViewMode(saved.viewMode)
      }
    } catch { }
  }, [])

  // Salvar estado local
  useEffect(() => {
    try {
      const payload = {
        debugClick,
        adjustments,
        viewMode
      }
      localStorage.setItem('viewerState', JSON.stringify(payload))
    } catch (e) { }
  }, [debugClick, adjustments, viewMode])


  // Lógica Principal de Carregamento: Manifesto + Preset
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      // 1. Carregar Manifesto
      let manifestFiles = []
      try {
        const manifestPath = envConfig?.imgPath ? `${envConfig.imgPath}/manifest.json` : '/manifest.json'
        const r = await fetch(`${manifestPath}?t=${Date.now()}`)
        if (r.ok) {
          manifestFiles = await r.json()
        } else {
          console.warn('Manifest não encontrado ou erro ao carregar')
        }
      } catch (e) {
        console.warn('Erro ao buscar manifest:', e)
      }

      if (cancelled) return

      // 2. Carregar Preset
      let preset = null
      try {
        const presetPath = envConfig?.presetPath || `/presets/${currentEnv}/viewerState.json`
        const r = await fetch(presetPath, { cache: 'no-store' })
        if (r.ok) {
          preset = await r.json()
        }
      } catch (e) {
        console.warn('Preset não encontrado ou erro:', e)
      }

      if (cancelled) return

      // 3. Definir lista de arquivos
      let finalFileList = []
      if (manifestFiles.length > 0) {
        finalFileList = sortLights(manifestFiles)
      } else if (preset) {
        const filesFromPreset = new Set()
        if (preset.values) Object.keys(preset.values).forEach(k => { if (k !== '__daylight') filesFromPreset.add(k) })
        if (preset.lightsState) Object.keys(preset.lightsState).forEach(k => filesFromPreset.add(k))
        finalFileList = sortLights(Array.from(filesFromPreset))
      }

      setFiles(finalFileList)

      // 4. Inicializar Estados
      const defaultValues = {}
      const defaultLightsState = {}
      const defaultDaylightTargets = []

      finalFileList.forEach(f => {
        const isFinal = /FINAL/.test(f)
        defaultValues[f] = isFinal ? 0 : 50

        if (!isFinal) {
          defaultLightsState[f] = { nome: sanitizeLabel(f), estado: true, dimmerizavel: false, valor: 50, pontos: [] }
          if (['DOME', 'DOME 2', 'REFORCO DO SOL'].includes(sanitizeLabel(f))) {
            defaultDaylightTargets.push(f)
          }
        }
      })

      // Definir ordem inicial das camadas
      let initialLayers = [...finalFileList]
      if (preset && preset.layers && Array.isArray(preset.layers)) {
        const savedOrder = preset.layers.filter(f => finalFileList.includes(f))
        const newFiles = finalFileList.filter(f => !savedOrder.includes(f))
        initialLayers = [...savedOrder, ...newFiles]
      } else {
        initialLayers.sort((a, b) => {
          const aFinal = /FINAL/.test(a)
          const bFinal = /FINAL/.test(b)
          if (aFinal && !bFinal) return 1
          if (!aFinal && bFinal) return -1
          return 0
        })
      }
      setLayers(initialLayers)

      // Aplicar Preset
      if (preset) {
        setPresetData(preset)
        setValues({ ...defaultValues, ...(preset.values || {}) })

        const mergedLightsState = { ...defaultLightsState }
        if (preset.lightsState) {
          Object.keys(preset.lightsState).forEach(k => {
            if (mergedLightsState[k]) {
              mergedLightsState[k] = { ...mergedLightsState[k], ...preset.lightsState[k] }
            } else {
              mergedLightsState[k] = preset.lightsState[k]
            }
          })
        }
        setLightsState(mergedLightsState)

        if (Array.isArray(preset.daylightTargets)) {
          setDaylightTargets(preset.daylightTargets)
        } else {
          setDaylightTargets(defaultDaylightTargets)
        }

        let loadedHotspots = []
        if (Array.isArray(preset.hotspots)) {
          loadedHotspots = preset.hotspots.map(h => ({ ...h, type: h.type || 'switch' }))
        }
        if (Array.isArray(preset.portals)) {
          const migratedPortals = preset.portals.map(p => ({
            ...p,
            type: 'portal',
            icon: 'geo-alt-fill',
            color: '#ffffff'
          }))
          loadedHotspots = [...loadedHotspots, ...migratedPortals]
        }
        setHotspots(loadedHotspots)

        // Carregar permissão de modo de visualização
        let permission = 'final_only'
        if (preset.viewModePermission) {
          permission = preset.viewModePermission
        } else if (typeof preset.allowLightAdjustment === 'boolean') {
          // Migração de legado
          permission = preset.allowLightAdjustment ? 'both' : 'final_only'
        }
        setViewModePermission(permission)

        // Inicialização do viewMode baseada na permissão
        if (!debugClick) {
          if (permission === 'final_only') {
            setViewMode('final')
          } else if (permission === 'lights_only') {
            setViewMode('lights')
          } else if (permission === 'both' && preset.viewMode) {
            setViewMode(preset.viewMode)
          }
        }

      } else {
        setPresetData(null)
        setValues(defaultValues)
        setLightsState(defaultLightsState)
        setDaylightTargets(defaultDaylightTargets)
        setHotspots([])
        setViewModePermission('final_only')
      }
    }

    loadData()

    return () => { cancelled = true }
  }, [currentEnv, envConfig])

  const finalImages = useMemo(() => {
    return files.filter(f => /FINAL/.test(f))
  }, [files])

  const baseUrl = envConfig?.imgPath ? `${envConfig.imgPath}/` : '/img/luzes/'
  const lightFiles = useMemo(() => files.filter(f => !/FINAL/.test(f)), [files])

  const tintColor = useMemo(() => {
    const clamp = (n, min, max) => Math.min(Math.max(n, min), max)
    const t = clamp(adjustments.temperature || 0, -40, 40)
    if (t === 0) return '#ffffff'
    if (t > 0) {
      const k = t / 40; return new THREE.Color(1.0, 1.0 - 0.15 * k, 1.0 - 0.30 * k)
    } else {
      const k = (-t) / 40; return new THREE.Color(1.0 - 0.20 * k, 1.0 - 0.10 * k, 1.0)
    }
  }, [adjustments.temperature])

  const toggleFullscreen = async () => {
    const el = containerRef.current
    if (!el) return
    if (!document.fullscreenElement) el.requestFullscreen().catch(console.warn)
    else document.exitFullscreen().catch(console.warn)
    setIsFullscreen(!document.fullscreenElement)
  }

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  function FovZoom({ minFov = 1.5, maxFov = 140, sensitivity = 0.12 }) {
    const { camera, gl } = useThree()
    useEffect(() => {
      const onWheel = (e) => {
        e.preventDefault()
        const direction = Math.sign(e.deltaY)
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

  const addPoint = (point) => {
    if (isDrawing && editingHotspotId) {
      // Adicionar ponto ao polígono existente
      setHotspots(prev => prev.map(h => {
        if (h.id === editingHotspotId) {
          const currentPoints = h.points || []
          return { ...h, points: [...currentPoints, [point.x, point.y, point.z]] }
        }
        return h
      }))
      return
    }

    const id = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`
    setHotspots(prev => [...prev, {
      id,
      type: 'switch',
      position: [point.x, point.y, point.z],
      lights: [],
      shape: 'sphere',
      size: 0.2,
      width: 1, height: 1, depth: 0.1,
      color: '#3b82f6',
      points: [] // Para polígonos
    }])
    setEditingHotspotId(id)
  }

  const handleHotspotClick = (h) => {
    if (debugClick) {
      setEditingHotspotId(h.id)
    } else {
      if (h.type === 'switch') {
        // Modo FINAL: Bloqueia interruptores de luz
        if (viewMode === 'final') return

        setLightsState(prev => {
          const next = { ...prev }
          for (const f of h.lights || []) {
            const cur = next[f] || { estado: true, dimmerizavel: true, valor: values[f] ?? 50, nome: sanitizeLabel(f), pontos: [] }
            next[f] = { ...cur, estado: !cur.estado }
          }
          return next
        })
      } else if (h.type === 'portal') {
        // Portais funcionam em ambos os modos
        if (h.targetEnvironment) setCurrentEnv(h.targetEnvironment)
      } else if (h.type === 'swap') {
        // Modo LUZES: Bloqueia troca de camadas FINAL
        if (viewMode === 'lights') return

        // Suporte a múltiplas imagens (Cycle)
        const targets = h.targetImages && h.targetImages.length > 0 ? h.targetImages : (h.targetImage ? [h.targetImage] : [])

        if (targets.length > 0) {
          // Encontrar qual imagem está ativa atualmente
          const activeIndex = targets.findIndex(img => (values[img] || 0) > 0)

          // Calcular próxima imagem
          let nextIndex = 0
          if (activeIndex !== -1) {
            nextIndex = (activeIndex + 1) % targets.length
          }

          const nextImage = targets[nextIndex]

          // Desativar todas as outras do grupo e ativar a próxima
          setValues(prev => {
            const next = { ...prev }
            targets.forEach(t => next[t] = 0) // Apaga todas do grupo
            next[nextImage] = 100 // Acende a próxima
            return next
          })
        }
      }
    }
  }

  const handlePointUpdate = (hotspotId, pointIndex, newPos) => {
    setHotspots(prev => prev.map(h => {
      if (h.id === hotspotId) {
        const newPoints = [...(h.points || [])]
        newPoints[pointIndex] = newPos
        return { ...h, points: newPoints }
      }
      return h
    }))
  }

  const handleMove = (pos) => {
    if (editingHotspotId && !isDrawing) {
      setHotspots(prev => prev.map(h => h.id === editingHotspotId ? { ...h, position: pos } : h))
    }
  }

  const handleUpdateHotspot = (id, data) => {
    // Se mudar para polígono, força a posição para 0,0,0 para que os pontos (que são world-space) fiquem corretos
    if (data.shape === 'polygon') {
      data.position = [0, 0, 0]
    }
    setHotspots(prev => prev.map(h => h.id === id ? { ...h, ...data } : h))
  }

  const handleDeleteHotspot = (id) => {
    setHotspots(prev => prev.filter(h => h.id !== id))
    setEditingHotspotId(null)
    setIsDrawing(false)
  }

  const handleDuplicateHotspot = (id) => {
    const original = hotspots.find(h => h.id === id)
    if (!original) return
    const newId = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}`
    const offset = 0.5
    const newPoint = {
      ...original,
      id: newId,
      position: [original.position[0] + offset, original.position[1], original.position[2] + offset]
    }
    setHotspots(prev => [...prev, newPoint])
    setEditingHotspotId(newId)
  }

  const handleTurnOffExceptDaylight = () => {
    const nextValues = { ...values }
    const nextState = { ...lightsState }
    for (const file of files) {
      if (!daylightTargets.includes(file) && !/FINAL/.test(file)) {
        nextValues[file] = 0
        if (nextState[file]) nextState[file] = { ...nextState[file], estado: false }
      }
    }
    setValues(nextValues)
    setLightsState(nextState)
  }

  const handlePresetAll = () => {
    if (presetData && presetData.values) {
      setValues(prev => ({ ...prev, ...presetData.values }))
      if (presetData.lightsState) {
        setLightsState(prev => {
          const next = { ...prev }
          for (const k in presetData.lightsState) {
            next[k] = { ...next[k], ...presetData.lightsState[k] }
          }
          return next
        })
      }
    } else {
      const next = { ...values }
      const nextState = { ...lightsState }
      for (const f of files) {
        if (!/FINAL/.test(f)) {
          next[f] = 100
          if (nextState[f]) nextState[f] = { ...nextState[f], estado: true }
        } else {
          next[f] = 0
        }
      }
      setValues(next)
      setLightsState(nextState)
    }
  }

  useEffect(() => {
    const el = canvasElRef.current
    if (!el) return
    const { saturation, contrast, brightness, highlights, denoise } = adjustments
    // Gamma removido do CSS filter
    const cAdj = contrast * (1 + highlights * 0.25)
    const bAdj = brightness * (1 + highlights * 0.12)
    const blur = Math.max(0, denoise)
    el.style.filter = `saturate(${saturation}) contrast(${cAdj}) brightness(${bAdj}) ${blur > 0 ? `blur(${blur}px)` : ''}`
  }, [adjustments])

  useEffect(() => {
    if (adjustmentsOpen && adjustmentsModalRef.current) {
      const el = adjustmentsModalRef.current
      const rect = el.getBoundingClientRect()
      setAdjustmentsPos({
        x: Math.max(20, Math.min(window.innerWidth - 20 - rect.width, window.innerWidth / 2 - rect.width / 2)),
        y: Math.max(20, Math.min(window.innerHeight - 20 - rect.height, window.innerHeight / 2 - rect.height / 2))
      })
    }
  }, [adjustmentsOpen])

  // Lógica de arrastar o menu de ajustes
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (draggingAdjustRef.current) {
        setAdjustmentsPos({
          x: e.clientX - dragOffsetRef.current.x,
          y: e.clientY - dragOffsetRef.current.y
        })
      }
    }
    const handlePointerUp = () => { draggingAdjustRef.current = false }

    if (adjustmentsOpen) {
      window.addEventListener('pointermove', handlePointerMove)
      window.addEventListener('pointerup', handlePointerUp)
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [adjustmentsOpen])

  // BUG FIX: Wrapped in useCallback to prevent re-triggering
  const handleCameraCaptured = useCallback((camData) => {
    const payload = {
      values,
      lightsState,
      hotspots,
      debugClick,
      daylightTargets,
      adjustments,
      camera: camData,
      layers,
      viewModePermission, // Salvar a permissão (3 vias)
      viewMode // Salvar o modo de visualização atual
    }

    if (saveActionType.current === 'save') {
      fetch('/save-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
        .then(async (r) => {
          if (r.ok) alert('Preset salvo com sucesso!')
          else alert('Erro ao salvar no servidor.')
        })
        .catch(e => alert('Erro ao salvar: ' + e))
    } else if (saveActionType.current === 'download') {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'viewerState.json'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
    // IMPORTANTE: Resetar o trigger para evitar loops
    setSaveTrigger(0)
  }, [values, lightsState, hotspots, debugClick, daylightTargets, adjustments, layers, viewModePermission, viewMode])

  const triggerSave = () => {
    saveActionType.current = 'save'
    setSaveTrigger(t => t + 1)
  }

  const triggerDownload = () => {
    saveActionType.current = 'download'
    setSaveTrigger(t => t + 1)
  }

  const toggleViewMode = () => {
    // Se a permissão for 'final_only' ou 'lights_only', não permite alternar (exceto em debug)
    if (!debugClick) {
      if (viewModePermission === 'final_only') return
      if (viewModePermission === 'lights_only') return
    }
    setViewMode(prev => prev === 'lights' ? 'final' : 'lights')
  }

  // Traduções para o menu de ajustes
  const adjustmentLabels = {
    saturation: 'Saturação',
    contrast: 'Contraste',
    brightness: 'Brilho',
    highlights: 'Realces',
    denoise: 'Redução de Ruído',
    temperature: 'Temperatura de Cor',
    bloomIntensity: 'Bloom Intensidade'
  }

  return (
    <div ref={containerRef} className="h-screen w-screen overflow-hidden relative">
      <div className="absolute top-4 left-4 z-50">
        <EnvironmentSelector currentEnvironment={currentEnv} onEnvironmentChange={setCurrentEnv} />
      </div>

      {debugClick && (
        <div className="absolute top-4 right-20 z-50 flex gap-2">
          <button
            onClick={() => setShowLayerManager(!showLayerManager)}
            className="bg-black/50 hover:bg-black/70 text-white p-2 rounded-lg backdrop-blur border border-white/10"
            title="Gerenciar Camadas"
          >
            <i className="bi bi-layers"></i>
          </button>
        </div>
      )}

      <Canvas
        camera={{ position: [0, 0, 1], fov: 75 }}
        onCreated={(state) => {
          state.gl.outputColorSpace = THREE.LinearSRGBColorSpace
          state.gl.toneMapping = THREE.NoToneMapping
          canvasElRef.current = state.gl.domElement
        }}
      >
        <EffectComposer disableNormalPass>
          <Bloom
            luminanceThreshold={0.6}
            luminanceSmoothing={0.9}
            intensity={adjustments.bloomIntensity || 0}
          />
        </EffectComposer>

        {/* Renderização Condicional Baseada em viewMode */}
        {layers.map((f, index) => {
          const isFinal = /FINAL/.test(f)
          const isMainFinal = /FINAL\.[a-zA-Z]+$/.test(f) || f === 'FINAL.png'

          let opacity = 0

          if (viewMode === 'final') {
            // Modo FINAL:
            if (!isFinal) {
              opacity = 0
            } else if (isMainFinal) {
              opacity = 1 // Base sempre visível no modo final
            } else {
              opacity = (values[f] ?? 0) / 100
            }
          } else {
            // Modo LUZES:
            if (isFinal) {
              opacity = 0
            } else {
              opacity = (values[f] ?? 0) / 100
              if (lightsState[f]?.estado === false) opacity = 0
            }
          }

          const blending = isFinal ? THREE.NormalBlending : THREE.AdditiveBlending

          return (
            <SphereLayer
              key={f}
              url={`${baseUrl}${f}`}
              blending={blending}
              opacity={opacity}
              tint={tintColor}
              renderOrder={index}
            />
          )
        })}

        <mesh
          onClick={(e) => {
            if (debugClick && isDrawing && editingHotspotId) {
              addPoint(e.point)
            }
          }}
          onDoubleClick={(e) => {
            if (!debugClick) return
            if (isDrawing) return
            if (editingHotspotId) return
            addPoint(e.point)
          }}
          renderOrder={-100} scale={[-1, 1, 1]}
        >
          <sphereGeometry args={[10, 64, 64]} />
          <meshBasicMaterial side={THREE.BackSide} transparent opacity={0} depthWrite={false} />
        </mesh>

        <CameraController
          saveTrigger={saveTrigger}
          onSaveCamera={handleCameraCaptured}
          loadData={presetData}
        />
        <FovZoom />

        <DrawingCursor isDrawing={isDrawing} />

        {hotspots.map(h => {
          // Filtragem de Hotspots baseada no viewMode
          if (viewMode === 'final' && h.type === 'switch' && !debugClick) return null
          if (viewMode === 'lights' && h.type === 'swap' && !debugClick) return null

          // Filtros de exibição no modo debug
          if (debugClick && !visibleHotspotTypes[h.type]) return null

          if (h.type === 'portal') {
            return (
              <Portal
                key={h.id}
                id={h.id}
                position={h.position}
                targetEnvironment={h.targetEnvironment}
                label={h.label || 'Portal'}
                icon={h.icon || 'geo-alt-fill'}
                color={h.color || '#ffffff'}
                opacity={h.opacity ?? 1}
                scale={h.scale || 1}
                debugMode={debugClick}
                onPortalClick={() => handleHotspotClick(h)}
                onDragStart={() => { setDraggingHotspot(true); setEditingHotspotId(h.id) }}
                onDragEnd={() => setDraggingHotspot(false)}
                onMove={handleMove}
              />
            )
          }
          else {
            return (
              <Hotspot
                key={h.id}
                id={h.id}
                position={h.position}
                debugActive={debugClick}
                onClick={() => handleHotspotClick(h)}
                selected={editingHotspotId === h.id}
                shape={h.shape}
                size={h.size}
                width={h.width}
                height={h.height}
                depth={h.depth}
                rotation={h.rotation}
                color={h.type === 'swap' ? '#10b981' : (h.color || '#3b82f6')}
                onDragStart={() => { setDraggingHotspot(true); setEditingHotspotId(h.id) }}
                onDragEnd={() => setDraggingHotspot(false)}
                onMove={handleMove}
                onPointUpdate={handlePointUpdate}
                points={h.points}
              />
            )
          }
        })}
      </Canvas>

      <UserPanel
        open={userPanelOpen}
        onToggle={() => setUserPanelOpen(!userPanelOpen)}
        values={values}
        onChange={(f, v) => {
          if (f === '__daylight') {
            const next = { ...values, __daylight: v }
            daylightTargets.forEach(t => next[t] = v)
            setValues(next)
          } else {
            setValues(p => ({ ...p, [f]: v }))
            if (lightsState[f]?.dimmerizavel) setLightsState(p => ({ ...p, [f]: { ...p[f], estado: true, valor: v } }))
          }
        }}
        lightsState={lightsState}
        onPresetAll={handlePresetAll}
        onTurnOffExceptDaylight={handleTurnOffExceptDaylight}
        onOpenAdjustments={() => setAdjustmentsOpen(true)}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        viewMode={viewMode}
        viewModePermission={viewModePermission} // Nova prop
        onToggleViewMode={toggleViewMode} // Nova prop para o usuário alternar
      />

      <LightControls
        files={lightFiles}
        values={values}
        lightsState={lightsState}
        onChange={(f, v) => setValues(p => ({ ...p, [f]: v }))}
        onToggleDimmerizavel={(f) => setLightsState(p => ({ ...p, [f]: { ...p[f], dimmerizavel: !p[f].dimmerizavel } }))}
        onUnlinkHotspot={(f, id) => {
          setLightsState(p => ({ ...p, [f]: { ...p[f], pontos: p[f].pontos.filter(x => x !== id) } }))
          setHotspots(p => p.map(h => h.id === id ? { ...h, lights: h.lights.filter(x => x !== f) } : h))
        }}
        debugMode={debugClick}
        onToggleDebugClick={() => setDebugClick(!debugClick)}
        collapsed={collapsed}
        onToggleCollapsed={() => setCollapsed(!collapsed)}
        showFinal={viewMode === 'final'}
        onToggleFinal={toggleViewMode}
        daylightTargets={daylightTargets}
        onUpdateDaylightTargets={setDaylightTargets}
        onSave={triggerSave}
        onDownload={triggerDownload}
        viewModePermission={viewModePermission}
        onChangeViewModePermission={(perm) => {
          setViewModePermission(perm)
          // Atualizar viewMode imediatamente ao mudar permissão
          if (perm === 'final_only') setViewMode('final')
          if (perm === 'lights_only') setViewMode('lights')
        }}
        visibleHotspotTypes={visibleHotspotTypes}
        onToggleHotspotVisibility={(type) => setVisibleHotspotTypes(prev => ({ ...prev, [type]: !prev[type] }))}
      />

      {showLayerManager && debugClick && (
        <LayerManager
          layers={layers}
          setLayers={setLayers}
          values={values}
          setValues={setValues}
          onClose={() => setShowLayerManager(false)}
        />
      )}

      {debugClick && editingHotspotId && (
        <HotspotEditor
          hotspot={hotspots.find(h => h.id === editingHotspotId)}
          files={lightFiles}
          availableEnvs={availableEnvs}
          finalImages={finalImages}
          onUpdate={handleUpdateHotspot}
          onDelete={handleDeleteHotspot}
          onDuplicate={handleDuplicateHotspot}
          onClose={() => setEditingHotspotId(null)}
          isDrawing={isDrawing}
          onToggleDrawing={() => setIsDrawing(!isDrawing)}
        />
      )}

      {adjustmentsOpen && (
        <div
          ref={adjustmentsModalRef}
          className="fixed z-[100] w-80 glass rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          style={{ left: adjustmentsPos.x, top: adjustmentsPos.y, maxHeight: '80vh' }}
          onPointerDown={(e) => {
            // Permite arrastar clicando em qualquer lugar que não seja interativo (input/button)
            if (['INPUT', 'BUTTON', 'I'].includes(e.target.tagName)) return
            draggingAdjustRef.current = true
            const rect = adjustmentsModalRef.current.getBoundingClientRect()
            dragOffsetRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
          }}
        >
          <div className="h-12 flex items-center justify-between px-4 border-b border-white/10 cursor-move bg-white/5">
            <span className="text-sm font-medium text-white/90 text-shadow">Ajustes</span>
            <button onClick={() => setAdjustmentsOpen(false)} className="w-6 h-6 rounded-full flex items-center justify-center text-white/40 hover:bg-white/10"><i className="bi bi-x"></i></button>
          </div>
          <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar">
            {Object.entries(adjustments).map(([k, v]) => {
              let min = 0, max = 2, step = 0.05
              if (k === 'temperature') { min = -40; max = 40; step = 1 }
              if (k === 'bloomIntensity') { min = 0; max = 5; step = 0.1 }

              return (
                <div key={k} className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="capitalize text-white/60 text-shadow">{adjustmentLabels[k] || k}</span>
                    <span className="text-white/40">{v.toFixed(2)}</span>
                  </div>
                  <SliderBar value={v} min={min} max={max} step={step} onChange={(val) => setAdjustments(p => ({ ...p, [k]: val }))} />
                </div>
              )
            })}
            <button
              onClick={() => setAdjustments({ saturation: 1, contrast: 1, brightness: 1, highlights: 0, denoise: 0, temperature: 0, bloomIntensity: 0 })}
              className="w-full py-2 mt-2 text-xs font-medium text-red-200/80 bg-red-500/20 rounded-lg hover:bg-red-500/30 transition shadow-sm"
              style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}
            >
              Resetar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}