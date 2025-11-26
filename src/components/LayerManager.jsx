import { useState, useEffect } from 'react'
import { sanitizeLabel } from '../lib/utils'

export default function LayerManager({ layers, setLayers, values, setValues, onClose }) {
    const [draggedItem, setDraggedItem] = useState(null)

    const handleDragStart = (e, index) => {
        setDraggedItem(index)
        e.dataTransfer.effectAllowed = "move"
    }

    const handleDragOver = (e, index) => {
        e.preventDefault()
        if (draggedItem === null) return
        if (draggedItem !== index) {
            const newLayers = [...layers]
            const item = newLayers[draggedItem]
            newLayers.splice(draggedItem, 1)
            newLayers.splice(index, 0, item)
            setLayers(newLayers)
            setDraggedItem(index)
        }
    }

    const handleDragEnd = () => {
        setDraggedItem(null)
    }

    const toggleVisibility = (file) => {
        setValues(prev => ({
            ...prev,
            [file]: prev[file] > 0 ? 0 : 100
        }))
    }

    return (
        <div className="fixed z-[100] top-20 right-20 w-80 bg-black/90 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden text-white max-h-[80vh]">
            <div className="h-12 flex items-center justify-between px-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-2">
                    <i className="bi bi-layers text-blue-400"></i>
                    <span className="text-sm font-bold">Gerenciador de Camadas</span>
                </div>
                <button onClick={onClose} className="text-white/40 hover:text-white"><i className="bi bi-x-lg"></i></button>
            </div>

            <div className="p-2 overflow-y-auto custom-scrollbar space-y-1 flex-1">
                <div className="text-[10px] text-white/40 px-2 pb-2 uppercase font-bold tracking-wider">
                    Arraste para reordenar (Topo = Renderiza por último)
                </div>
                {layers.map((file, index) => {
                    const isFinal = /FINAL/.test(file)
                    const isVisible = (values[file] ?? 0) > 0

                    return (
                        <div
                            key={file}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={(e) => handleDragOver(e, index)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-3 p-2 rounded border border-white/5 cursor-move transition-colors ${draggedItem === index ? 'bg-blue-500/20 border-blue-500/50' : 'hover:bg-white/5 bg-black/20'}`}
                        >
                            <div className="text-white/20"><i className="bi bi-grip-vertical"></i></div>

                            <div className="flex-1 min-w-0">
                                <div className={`text-xs font-medium truncate ${isFinal ? 'text-yellow-400' : 'text-white/80'}`}>
                                    {sanitizeLabel(file)}
                                </div>
                                <div className="text-[10px] text-white/30 truncate">{file}</div>
                            </div>

                            <button
                                onClick={() => toggleVisibility(file)}
                                className={`w-6 h-6 rounded flex items-center justify-center transition-colors ${isVisible ? 'text-green-400 bg-green-400/10' : 'text-white/20 hover:text-white/60'}`}
                            >
                                <i className={`bi bi-eye${isVisible ? '' : '-slash'}`}></i>
                            </button>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
