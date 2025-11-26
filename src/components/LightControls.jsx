import { sanitizeLabel, groupByNumber } from '../lib/utils'
import SliderBar from './SliderBar'

export default function LightControls({
  files,
  values,
  onChange,
  showFinal,
  onToggleFinal,
  collapsed,
  onToggleCollapsed,
  debugMode,
  onToggleDebugClick,
  lightsState,
  hotspots,
  onToggleDimmerizavel,
  onUnlinkHotspot,
  daylightTargets = [],
  onUpdateDaylightTargets,
  onSave,
  onDownload,
  viewModePermission,
  onChangeViewModePermission,
  visibleHotspotTypes,
  onToggleHotspotVisibility
}) {
  const groups = groupByNumber(files.filter(f => !/FINAL\.[a-zA-Z]+$/.test(f)))

  const asideClass = collapsed
    ? 'absolute left-4 top-24 w-10 h-10 flex items-center justify-center cursor-pointer text-shadow select-none no-caret z-40 opacity-0 hover:opacity-100 transition-opacity duration-300'
    : 'absolute left-4 top-24 bottom-4 w-96 glass rounded-2xl p-4 shadow-2xl shadow-black/40 overflow-y-auto scroll-thin text-shadow select-none no-caret z-40'

  return (
    <aside className={asideClass} onClick={collapsed ? onToggleCollapsed : undefined}>
      <div className={collapsed ? 'flex items-center justify-center w-full h-full' : 'flex items-center justify-between mb-3'}>
        {collapsed ? (
          <div className="w-6 h-6 rounded-full bg-white/20" aria-label="Expandir controles" />
        ) : (
          <>
            <button
              onClick={onToggleCollapsed}
              className={'px-2 py-1 rounded-lg bg-white/12 hover:bg-white/20 transition text-xs text-shadow dark-glow'}
              aria-label={'Colapsar controles'}
            >
              Compactar
            </button>
            <div className="flex gap-2">
              <button
                onClick={onSave}
                className={'px-2 py-1 rounded-lg bg-white/12 hover:bg-white/20 transition text-xs text-shadow dark-glow'}
                title={'Salvar config em public/config/viewerState.json'}
              >
                Salvar
              </button>
              <button
                onClick={onDownload}
                className={'px-2 py-1 rounded-lg bg-white/12 hover:bg-white/20 transition text-xs text-shadow dark-glow'}
                title={'Baixar viewerState.json'}
              >
                Baixar
              </button>
            </div>
          </>
        )}
      </div>

      {!collapsed && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-shadow">Imagem FINAL</span>
            <button
              onClick={onToggleFinal}
              className={`relative w-10 h-5 rounded-full transition shadow-lg shadow-black/40 ${showFinal ? 'bg-gray-400' : 'bg-white/15'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${showFinal ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs text-shadow">Modo Editor (Pontos)</span>
            <button
              onClick={onToggleDebugClick}
              className={`relative w-10 h-5 rounded-full transition shadow-lg shadow-black/40 ${debugMode ? 'bg-blue-500' : 'bg-white/15'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${debugMode ? 'translate-x-5' : 'translate-x-0'}`} />
            </button>
          </div>

          {/* Filtros de Visibilidade de Hotspots (Apenas em Debug) */}
          {debugMode && visibleHotspotTypes && (
            <div className="mb-4 p-2 bg-white/5 rounded-lg border border-white/10">
              <div className="text-[10px] uppercase tracking-wider text-white/50 mb-2 font-bold">Exibir Hotspots</div>
              <div className="flex gap-2">
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleHotspotTypes.switch}
                    onChange={() => onToggleHotspotVisibility('switch')}
                    className="accent-blue-500"
                  />
                  <span>Luzes</span>
                </label>
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleHotspotTypes.portal}
                    onChange={() => onToggleHotspotVisibility('portal')}
                    className="accent-white"
                  />
                  <span>Portais</span>
                </label>
                <label className="flex items-center gap-1 text-xs cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleHotspotTypes.swap}
                    onChange={() => onToggleHotspotVisibility('swap')}
                    className="accent-green-500"
                  />
                  <span>Trocas</span>
                </label>
              </div>
            </div>
          )}

          {/* Seletor de Permissão de Visualização */}
          <div className="mb-4 p-2 bg-white/5 rounded-lg border border-white/10">
            <div className="text-[10px] uppercase tracking-wider text-white/50 mb-2 font-bold">Permissão do Usuário</div>
            <div className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="viewModePermission"
                  value="final_only"
                  checked={viewModePermission === 'final_only'}
                  onChange={() => onChangeViewModePermission('final_only')}
                  className="accent-blue-500"
                />
                <span>Somente Render Final</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="viewModePermission"
                  value="lights_only"
                  checked={viewModePermission === 'lights_only'}
                  onChange={() => onChangeViewModePermission('lights_only')}
                  className="accent-blue-500"
                />
                <span>Somente Ajustes de Luzes</span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="radio"
                  name="viewModePermission"
                  value="both"
                  checked={viewModePermission === 'both'}
                  onChange={() => onChangeViewModePermission('both')}
                  className="accent-blue-500"
                />
                <span>Ambos (Toggle)</span>
              </label>
            </div>
          </div>

          <div className="mb-5">
            <h3 className="text-sm font-semibold tracking-wide mb-2">Luzes controladas pela Luz do Dia</h3>
            <div className="grid grid-cols-2 gap-2">
              {files.filter(f => !/FINAL\.[a-zA-Z]+$/.test(f)).map(f => {
                const checked = daylightTargets.includes(f)
                return (
                  <label key={f} className="flex items-center gap-2 text-xs">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        if (!onUpdateDaylightTargets) return
                        const set = new Set(daylightTargets)
                        if (e.target.checked) set.add(f)
                        else set.delete(f)
                        onUpdateDaylightTargets(Array.from(set))
                      }}
                    />
                    <span>{sanitizeLabel(f)}</span>
                  </label>
                )
              })}
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold tracking-wide mb-2">Interruptores de Luz</h2>
            {Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b)).map(group => (
              <div key={group} className="mb-5">
                <div className="space-y-4">
                  {groups[group].map(f => (
                    <div key={f} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <label className="text-xs flex-1 text-neutral-100 cursor-default">
                          {sanitizeLabel(f)}
                        </label>
                        <span className="text-[10px] text-neutral-300 w-10 text-right cursor-default">
                          {lightsState?.[f]?.estado ? 'On' : 'Off'}
                        </span>
                        <button
                          onClick={() => onToggleDimmerizavel(f)}
                          className={`relative w-10 h-5 rounded-full transition shadow-lg shadow-black/40 ${lightsState?.[f]?.dimmerizavel ? 'bg-gray-400' : 'bg-white/15'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${lightsState?.[f]?.dimmerizavel ? 'translate-x-5' : 'translate-x-0'}`} />
                        </button>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 dark-glow">
                          <SliderBar
                            value={values[f] ?? 50}
                            min={0}
                            max={100}
                            step={1}
                            onChange={(v) => onChange(f, v)}
                            height={10}
                            ariaLabel={`Ajustar ${sanitizeLabel(f)}`}
                          />
                        </div>
                        <span className="text-[10px] text-neutral-300 w-12 text-right">{Math.round(values[f] ?? 50)}%</span>
                      </div>

                      <div className="pl-2">
                        <div className="text-[11px] text-neutral-300 mb-1">Interruptores: {(lightsState?.[f]?.pontos || []).length}</div>
                        <div className="space-y-1">
                          {(lightsState?.[f]?.pontos || []).map(id => {
                            const h = (hotspots || []).find(x => x.id === id)
                            if (!h) return null
                            const pos = h.position || [0, 0, 0]
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