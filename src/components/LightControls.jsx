import { sanitizeLabel, groupByNumber } from '../lib/utils'

// Painel lateral com sliders 0..10 por luz, agrupados por numeração
// Comentário: ajuste estilos e posicionamento do painel conforme a identidade visual.
export default function LightControls({ files, values, onChange, showFinal, onToggleFinal, collapsed, onToggleCollapsed, debugClick, onToggleDebugClick, lightsState, hotspots, onToggleDimmerizavel, onUnlinkHotspot }) {
  const groups = groupByNumber(files.filter(f => !/FINAL\.[a-zA-Z]+$/.test(f)))

  const asideClass = collapsed
    ? 'absolute left-4 top-4 w-10 h-10 glass rounded-full shadow-lg shadow-black/40 flex items-center justify-center cursor-pointer text-shadow select-none no-caret'
    : 'absolute left-4 top-4 bottom-4 w-96 glass rounded-2xl p-4 shadow-2xl shadow-black/40 overflow-y-auto scroll-thin text-shadow select-none no-caret'

  return (
    <aside className={asideClass} onClick={collapsed ? onToggleCollapsed : undefined}>
      {/* Cabeçalho com colapsar/expandir */}
      <div className={collapsed ? 'flex items-center justify-center w-full h-full' : 'flex items-center justify-between mb-3'}>
        {collapsed ? (
          // Quando colapsado, mostrar apenas uma bolinha clicável
          <div className="w-6 h-6 rounded-full bg-white/20" aria-label="Expandir controles" />
        ) : (
          <>
            <button
              onClick={onToggleCollapsed}
              className={'px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition text-xs'}
              aria-label={'Colapsar controles'}
            >
              Compactar
            </button>
            <button
              onClick={() => {
                const payload = { values, lightsState, hotspots, debugClick, showFinal }
                fetch('/save-config', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(payload)
                })
                  .then(async (r) => {
                    const ct = r.headers.get('content-type') || ''
                    if (ct.includes('application/json')) {
                      return r.json()
                    } else {
                      const txt = await r.text()
                      return { ok: r.ok, error: txt || 'Resposta vazia do servidor' }
                    }
                  })
                  .then(res => {
                    alert(res.ok ? 'Configurações salvas em public/config/viewerState.json' : `Falha ao salvar: ${res.error}`)
                  })
                  .catch(e => alert(`Erro ao salvar: ${e}`))
              }}
              className={'px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition text-xs'}
              aria-label={'Salvar configurações no projeto'}
              title={'Salvar config em public/config/viewerState.json'}
            >
              Salvar config
            </button>
            <button
              onClick={() => {
                // Baixar preset local: gera arquivo viewerState.json para colocar em public/presets/<ambiente>/
                const payload = { values, lightsState, hotspots, debugClick, showFinal }
                const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = 'viewerState.json'
                document.body.appendChild(a)
                a.click()
                document.body.removeChild(a)
                URL.revokeObjectURL(url)
              }}
              className={'ml-2 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 transition text-xs'}
              aria-label={'Baixar preset local'}
              title={'Baixar viewerState.json para colocar em public/presets/<ambiente>/'}
            >
              Baixar preset
            </button>
          </>
        )}
      </div>

      {/* Controles quando expandido */}
      {!collapsed && (
        <>
          {/* Seletor de blending removido conforme solicitação */}

          {/* Toggle da FINAL (estilo iOS, padrão visual) */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-shadow">Imagem FINAL</span>
            <button
              onClick={onToggleFinal}
              aria-label={showFinal ? 'Desativar Imagem FINAL' : 'Ativar Imagem FINAL'}
              className={`relative w-10 h-5 rounded-full transition shadow-lg shadow-black/40 ${showFinal ? 'bg-gray-400' : 'bg-white/15'}`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${showFinal ? 'translate-x-5' : 'translate-x-0'}`}
              />
            </button>
          </div>

          {/* Toggle: Adicionar pontos (modo desenvolvedor) — padronizado */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-shadow">Adicionar pontos</span>
            <button
              onClick={onToggleDebugClick}
              aria-label={debugClick ? 'Desativar adicionar pontos' : 'Ativar adicionar pontos'}
              className={`relative w-10 h-5 rounded-full transition shadow-lg shadow-black/40 ${debugClick ? 'bg-gray-400' : 'bg-white/15'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${debugClick ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Sliders por grupo */}
          <div>
            <h2 className="text-sm font-semibold tracking-wide mb-2">Interruptores de Luz</h2>
            {Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b)).map(group => (
              <div key={group} className="mb-5">
                {/* Oculta rótulo de número do grupo para um visual mais limpo */}
                <div className="space-y-4">
                  {groups[group].map(f => (
                    <div key={f} className="space-y-2">
                      {/* Linha de cabeçalho: nome, estado e toggle dimerizável */}
                      <div className="flex items-center gap-3">
                        <label className="text-xs flex-1 text-neutral-100 cursor-default">
                          {sanitizeLabel(f)}
                        </label>
                        <span className="text-[10px] text-neutral-300 w-10 text-right cursor-default">
                          {lightsState?.[f]?.estado ? 'On' : 'Off'}
                        </span>
                        <button
                          onClick={() => onToggleDimmerizavel(f)}
                          aria-label={(lightsState?.[f]?.dimmerizavel) ? 'Desativar dimerizável' : 'Ativar dimerizável'}
                          className={`relative w-10 h-5 rounded-full transition shadow-lg shadow-black/40 ${lightsState?.[f]?.dimmerizavel ? 'bg-gray-400' : 'bg-white/15'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${lightsState?.[f]?.dimmerizavel ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      {/* Linha dedicada: slider mais espesso para precisão e valor ao lado */}
                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min={0}
                          max={100}
                          step={1}
                          value={values[f] ?? 50}
                          onChange={e => onChange(f, parseFloat(e.target.value))}
                          className="flex-1 range-thick"
                          style={{ '--progress': `${values[f] ?? 50}%` }}
                        />
                        <span className="text-[10px] text-neutral-300 w-12 text-right">{Math.round(values[f] ?? 50)}%</span>
                      </div>

                      {/* 6. coordenadas: lista dos pontos ligados + apagar links */}
                      <div className="pl-2">
                        <div className="text-[11px] text-neutral-300 mb-1">Interruptores: {(lightsState?.[f]?.pontos || []).length}</div>
                        <div className="space-y-1">
                          {(lightsState?.[f]?.pontos || []).map(id => {
                            const h = (hotspots || []).find(x => x.id === id)
                            const pos = h?.position || [0,0,0]
                            const fmt = (n) => (typeof n === 'number' ? n.toFixed(2) : n)
                            return (
                              <div key={id} className="flex items-center gap-2 text-[11px]">
                                <span className="text-neutral-200">({fmt(pos[0])}, {fmt(pos[1])}, {fmt(pos[2])})</span>
                                <button
                                  onClick={() => onUnlinkHotspot(f, id)}
                                  className="ml-auto px-2 py-0.5 rounded bg-red-500/70 hover:bg-red-500 text-white shadow-md flex items-center gap-1"
                                >
                                  <i className="bi bi-x-circle" />
                                  apagar
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </aside>
  )
}