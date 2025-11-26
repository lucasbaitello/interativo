import { useState, useRef, useEffect } from 'react'
import { sanitizeLabel } from '../lib/utils'

// Lista de ícones disponíveis para Portais
const PORTAL_ICONS = [
    'geo-alt', 'geo-alt-fill',
    'pin', 'pin-fill',
    'record-circle', 'circle-fill',
    'caret-down', 'caret-down-fill',
    'door-open', 'door-open-fill',
    'arrow-right-circle', 'box-arrow-in-right'
]

export default function HotspotEditor({
    hotspot,
    files,
    availableEnvs,
    finalImages,
    onUpdate,
    onDelete,
    onDuplicate,
    onClose,
    isDrawing,
    onToggleDrawing
}) {
    const [position, setPosition] = useState({ x: 100, y: 100 })
    const [isDragging, setIsDragging] = useState(false)
    const dragOffset = useRef({ x: 0, y: 0 })
    const [colorHistory, setColorHistory] = useState(['#ffffff', '#000000', '#ff00ff', '#0000ff'])

    const handlePointerDown = (e) => {
        setIsDragging(true)
        dragOffset.current = {
            x: e.clientX - position.x,
            y: e.clientY - position.y
        }
    }

    useEffect(() => {
        const handlePointerMove = (e) => {
            if (isDragging) {
                setPosition({
                    x: e.clientX - dragOffset.current.x,
                    y: e.clientY - dragOffset.current.y
                })
            }
        }
        const handlePointerUp = () => setIsDragging(false)

        if (isDragging) {
            window.addEventListener('pointermove', handlePointerMove)
            window.addEventListener('pointerup', handlePointerUp)
        }
        return () => {
            window.removeEventListener('pointermove', handlePointerMove)
            window.removeEventListener('pointerup', handlePointerUp)
        }
    }, [isDragging])

    if (!hotspot) return null

    const updateField = (field, value) => {
        onUpdate(hotspot.id, { [field]: value })
    }

    const addColorToHistory = (color) => {
        if (!colorHistory.includes(color)) {
            setColorHistory(prev => [color, ...prev].slice(0, 10))
        }
    }

    return (
        <div
            className="fixed z-[100] w-80 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden text-white"
            style={{ left: position.x, top: position.y, maxHeight: '85vh' }}
        >
            <div
                className="h-10 flex items-center justify-between px-4 border-b border-white/10 cursor-move bg-white/5 select-none"
                onPointerDown={handlePointerDown}
            >
                <div className="flex items-center gap-2">
                    <i className="bi bi-pencil-square text-blue-400"></i>
                    <span className="text-sm font-bold">Editar Ponto</span>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white"><i className="bi bi-x-lg"></i></button>
            </div>

            <div className="p-4 overflow-y-auto custom-scrollbar space-y-4">

                <div className="space-y-1">
                    <label className="text-xs text-white/50 uppercase font-bold">Tipo de Interação</label>
                    <div className="flex bg-white/10 rounded-lg p-1">
                        {['switch', 'portal', 'swap'].map(type => (
                            <button
                                key={type}
                                onClick={() => updateField('type', type)}
                                className={`flex-1 py-1 text-xs rounded-md transition-all ${hotspot.type === type ? 'bg-blue-600 text-white shadow' : 'text-white/60 hover:bg-white/10'}`}
                            >
                                {type === 'switch' && 'Luz'}
                                {type === 'portal' && 'Portal'}
                                {type === 'swap' && 'Troca'}
                            </button>
                        ))}
                    </div>
                </div>

                {hotspot.type === 'switch' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs text-white/50 uppercase font-bold">Forma & Dimensões</label>
                            <select
                                value={hotspot.shape || 'sphere'}
                                onChange={(e) => updateField('shape', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs outline-none"
                            >
                                <option value="sphere">Esfera (Padrão)</option>
                                <option value="box">Cubo / Retângulo</option>
                                <option value="polygon">Polígono (Livre)</option>
                            </select>

                            {hotspot.shape === 'polygon' ? (
                                <div className="space-y-2 bg-blue-500/10 p-2 rounded border border-blue-500/20">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-blue-200">Desenhar Área</span>
                                        <button
                                            onClick={onToggleDrawing}
                                            className={`px-2 py-1 rounded text-xs font-bold transition ${isDrawing ? 'bg-red-500 hover:bg-red-600 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'}`}
                                        >
                                            {isDrawing ? 'Parar Desenho' : 'Iniciar Desenho'}
                                        </button>
                                    </div>
                                    <div className="text-[10px] text-white/60">
                                        {isDrawing
                                            ? 'Clique na cena para adicionar pontos ao polígono.'
                                            : `${(hotspot.points || []).length} pontos definidos.`}
                                    </div>
                                    {(hotspot.points || []).length > 0 && (
                                        <button
                                            onClick={() => updateField('points', [])}
                                            className="w-full py-1 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] rounded"
                                        >
                                            Limpar Pontos
                                        </button>
                                    )}
                                </div>
                            ) : hotspot.shape === 'box' ? (
                                <div className="space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-[10px] text-white/40">Largura</span>
                                            <input type="number" step="0.1" value={hotspot.width || 1} onChange={(e) => updateField('width', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs" />
                                        </div>
                                        <div>
                                            <span className="text-[10px] text-white/40">Altura</span>
                                            <input type="number" step="0.1" value={hotspot.height || 1} onChange={(e) => updateField('height', parseFloat(e.target.value))} className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs" />
                                        </div>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-white/40">Rotação (Inclinação)</span>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="range" min="-180" max="180" step="1"
                                                value={hotspot.rotation || 0}
                                                onChange={(e) => updateField('rotation', parseFloat(e.target.value))}
                                                className="flex-1 accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                            />
                                            <span className="text-xs w-8 text-right">{hotspot.rotation || 0}°</span>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div>
                                    <span className="text-[10px] text-white/40">Tamanho</span>
                                    <input
                                        type="range" min="0.1" max="2.0" step="0.1"
                                        value={hotspot.size || 0.2}
                                        onChange={(e) => updateField('size', parseFloat(e.target.value))}
                                        className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer mt-1"
                                    />
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-white/50 uppercase font-bold">Luzes Associadas</label>
                            <div className="max-h-32 overflow-y-auto bg-black/20 rounded border border-white/5 p-2 space-y-1 custom-scrollbar">
                                {files.filter(f => !/FINAL/.test(f)).map(f => (
                                    <label key={f} className="flex items-center gap-2 text-xs hover:bg-white/5 p-1 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={(hotspot.lights || []).includes(f)}
                                            onChange={(e) => {
                                                const current = hotspot.lights || []
                                                const next = e.target.checked
                                                    ? [...current, f]
                                                    : current.filter(l => l !== f)
                                                updateField('lights', next)
                                            }}
                                            className="accent-blue-500"
                                        />
                                        <span className="truncate">{sanitizeLabel(f)}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {hotspot.type === 'portal' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs text-white/50 uppercase font-bold">Destino</label>
                            <select
                                value={hotspot.targetEnvironment || ''}
                                onChange={(e) => updateField('targetEnvironment', e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded px-2 py-1 text-xs outline-none"
                            >
                                <option value="">Selecione um ambiente...</option>
                                {availableEnvs.map(env => (
                                    <option key={env.id} value={env.id}>{env.label || env.id}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-white/50 uppercase font-bold">Ícone</label>
                            <div className="grid grid-cols-6 gap-2 bg-black/20 p-2 rounded border border-white/5">
                                {PORTAL_ICONS.map(icon => (
                                    <button
                                        key={icon}
                                        onClick={() => updateField('icon', icon)}
                                        className={`aspect-square flex items-center justify-center rounded hover:bg-white/10 transition ${hotspot.icon === icon ? 'bg-blue-600 text-white' : 'text-white/60'}`}
                                    >
                                        <i className={`bi bi-${icon}`}></i>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-white/50 uppercase font-bold">Cor & Opacidade</label>
                            <div className="flex gap-2 items-center">
                                <input
                                    type="color"
                                    value={hotspot.color || '#ffffff'}
                                    onChange={(e) => {
                                        updateField('color', e.target.value)
                                        addColorToHistory(e.target.value)
                                    }}
                                    className="w-8 h-8 rounded cursor-pointer bg-transparent border-0 p-0"
                                />
                                <div className="flex-1">
                                    <input
                                        type="range" min="0" max="1" step="0.1"
                                        value={hotspot.opacity ?? 1}
                                        onChange={(e) => updateField('opacity', parseFloat(e.target.value))}
                                        className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                    />
                                </div>
                                <span className="text-xs w-8 text-right">{((hotspot.opacity ?? 1) * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex gap-1 flex-wrap">
                                {colorHistory.map(c => (
                                    <button
                                        key={c}
                                        onClick={() => updateField('color', c)}
                                        className="w-4 h-4 rounded-full border border-white/20"
                                        style={{ backgroundColor: c }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-xs text-white/50 uppercase font-bold">Tamanho</label>
                            <input
                                type="range" min="0.5" max="5.0" step="0.1"
                                value={hotspot.scale || 1}
                                onChange={(e) => updateField('scale', parseFloat(e.target.value))}
                                className="w-full accent-blue-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                            />
                        </div>
                    </>
                )}

                {hotspot.type === 'swap' && (
                    <>
                        <div className="space-y-2">
                            <label className="text-xs text-white/50 uppercase font-bold">Imagens de Destino (Ciclo)</label>
                            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar border border-white/5 rounded p-1">
                                {finalImages.length === 0 ? (
                                    <div className="text-xs text-red-400 p-2">Nenhuma imagem FINAL encontrada além da padrão. Adicione arquivos como 'FINAL_NOITE.png' na pasta.</div>
                                ) : (
                                    finalImages.map(img => {
                                        const selected = (hotspot.targetImages || [hotspot.targetImage]).includes(img)
                                        return (
                                            <label key={img} className={`flex items-center gap-2 text-xs hover:bg-white/5 p-2 rounded cursor-pointer border ${selected ? 'border-green-500/50 bg-green-500/10' : 'border-white/5'}`}>
                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={(e) => {
                                                        const current = hotspot.targetImages || (hotspot.targetImage ? [hotspot.targetImage] : [])
                                                        let next = []
                                                        if (e.target.checked) {
                                                            next = [...current, img]
                                                        } else {
                                                            next = current.filter(i => i !== img)
                                                        }
                                                        // Atualiza targetImages (array) e mantém targetImage (string) como fallback para o primeiro
                                                        onUpdate(hotspot.id, {
                                                            targetImages: next,
                                                            targetImage: next.length > 0 ? next[0] : null
                                                        })
                                                    }}
                                                    className="accent-green-500"
                                                />
                                                <span className="truncate">{img}</span>
                                            </label>
                                        )
                                    })
                                )}
                            </div>
                        </div>
                        <div className="text-xs text-white/60 bg-blue-500/10 p-2 rounded border border-blue-500/20">
                            <i className="bi bi-info-circle mr-1"></i>
                            Selecione múltiplas imagens para criar um ciclo. Cada clique alternará para a próxima imagem selecionada.
                        </div>
                    </>
                )}

                <div className="pt-4 mt-4 border-t border-white/10 flex gap-2">
                    <button
                        onClick={() => onDuplicate(hotspot.id)}
                        className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded text-xs font-medium transition flex items-center justify-center gap-2"
                    >
                        <i className="bi bi-files"></i> Duplicar
                    </button>
                    <button
                        onClick={() => onDelete(hotspot.id)}
                        className="flex-1 py-2 bg-red-500/20 hover:bg-red-500/40 text-red-200 rounded text-xs font-medium transition flex items-center justify-center gap-2"
                    >
                        <i className="bi bi-trash"></i> Deletar
                    </button>
                </div>
            </div>
        </div>
    )
}
