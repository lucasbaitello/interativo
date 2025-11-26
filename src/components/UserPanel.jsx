import { sanitizeLabel } from '../lib/utils'
import SliderBar from './SliderBar'

// Ajuste aqui o espaçamento horizontal entre o slider de Luz do Dia e os botões
const DAYLIGHT_BUTTONS_GAP_PX = 18

export default function UserPanel({ open, onToggle, values, onChange, lightsState, onPresetAll, onTurnOffExceptDaylight, onOpenAdjustments, isFullscreen, onToggleFullscreen, viewMode, viewModePermission, onToggleViewMode }) {
  const dimmables = Object.keys(lightsState || {}).filter(f => lightsState[f]?.dimmerizavel)

  const isFinalMode = viewMode === 'final'
  const canToggleMode = viewModePermission === 'both'

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center z-50 pointer-events-auto select-none no-caret">
      {open && (
        <button
          onClick={onToggle}
          className="mr-2 w-8 h-8 rounded-full flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
          aria-label="Colapsar painel"
        >
          <i className="bi bi-chevron-right" />
        </button>
      )}

      <aside
        className={
          open
            ? 'w-36 glass rounded-[70px] p-3 shadow-2xl shadow-black/40 text-shadow max-h-[70vh] overflow-y-auto scroll-thin transition-all duration-500 ease-in-out flex flex-col items-center'
            : 'w-6 h-6 flex items-center justify-center cursor-pointer transition-all duration-300 opacity-40 hover:opacity-100 hover:bg-black/20 rounded-full'
        }
        onClick={!open ? onToggle : undefined}
      >
        {open ? (
          <>
            {/* Toggle de Modo (Render Final / Luzes) - Só aparece se permitido 'both' */}
            {canToggleMode && (
              <div className="mb-4 w-full flex justify-center">
                <button
                  onClick={onToggleViewMode}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-all border border-white/5 shadow-lg"
                  title={isFinalMode ? "Mudar para Ajuste de Luzes" : "Mudar para Visualização 360"}
                >
                  <i className={`bi bi-${isFinalMode ? 'image' : 'sliders'} text-white text-sm`} />
                  <span className="text-[10px] font-medium text-white/90 uppercase tracking-wide">
                    {isFinalMode ? '360' : 'Luzes'}
                  </span>
                </button>
              </div>
            )}

            {/* Slider vertical de Luz do Dia com ações rápidas à direita */}
            <div className="mb-4">
              {/* Ajuste de espaçamento entre slider vertical e botões à direita */}
              <div className="flex items-center justify-center" style={{ gap: `${DAYLIGHT_BUTTONS_GAP_PX}px` }}>

                {/* Centro: slider vertical (SÓ MOSTRA NO MODO LUZES) */}
                {!isFinalMode && (
                  <div className="flex flex-col items-center">
                    <i className="bi bi-sun text-white/70 text-xs mb-1 pointer-events-none cursor-default" />
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={values.__daylight ?? 50}
                      onChange={e => onChange('__daylight', parseFloat(e.target.value))}
                      className="range-daylight range-vertical"
                      style={{ '--progress': `${values.__daylight ?? 50}%` }}
                    />
                    <i className="bi bi-moon text-white/70 text-xs mt-1 pointer-events-none cursor-default" />
                  </div>
                )}

                {/* Direita: ícones (preset on, off, ajustes) */}
                <div className="flex flex-col items-center gap-2">
                  {!isFinalMode && (
                    <>
                      <button
                        className="w-7 h-7 rounded-full bg-white/12 hover:bg-white/20 flex items-center justify-center shadow dark-glow"
                        title="Acender todas com preset"
                        aria-label="Acender todas com preset"
                        onClick={onPresetAll}
                      >
                        <i className="bi bi-lightbulb-fill text-white text-sm text-glow-dark" />
                      </button>
                      <button
                        className="w-7 h-7 rounded-full bg-white/12 hover:bg-white/20 flex items-center justify-center shadow dark-glow"
                        title="Apagar todas exceto luz do dia"
                        aria-label="Apagar todas exceto luz do dia"
                        onClick={onTurnOffExceptDaylight}
                      >
                        <i className="bi bi-lightbulb-off text-white text-sm text-glow-dark" />
                      </button>
                    </>
                  )}

                  <button
                    className="w-7 h-7 rounded-full bg-white/12 hover:bg-white/20 flex items-center justify-center shadow dark-glow"
                    title="Abrir ajustes avançados"
                    aria-label="Abrir ajustes avançados"
                    onClick={onOpenAdjustments}
                    onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); onOpenAdjustments && onOpenAdjustments(); }}
                    type="button"
                  >
                    <i className="bi bi-sliders text-white text-sm text-glow-dark" />
                  </button>
                  <button
                    className="w-7 h-7 rounded-full bg-white/12 hover:bg-white/20 flex items-center justify-center shadow dark-glow"
                    title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                    aria-label={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
                    onClick={onToggleFullscreen}
                    type="button"
                  >
                    <i className={`bi bi-${isFullscreen ? 'fullscreen-exit' : 'fullscreen'} text-white text-sm text-glow-dark`} />
                  </button>
                </div>
              </div>
            </div>

            {/* Sliders compactos: layout padronizado independentemente da quantidade */}
            {/* SÓ MOSTRA NO MODO LUZES */}
            {!isFinalMode && (
              <div className={dimmables.length ? 'space-y-3 pb-6 w-full' : 'pb-2 w-full'}>
                {dimmables.map((f) => (
                  <div key={f}>
                    <div className="text-[11px] truncate text-neutral-200 cursor-default text-shadow">{sanitizeLabel(f)}</div>
                    <div className="flex items-center gap-2">
                      <SliderBar
                        value={values[f] ?? 50}
                        min={0}
                        max={100}
                        step={1}
                        onChange={(v) => onChange(f, v)}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <i className="bi bi-list text-white text-xl drop-shadow-md" />
        )}
      </aside>
    </div>
  )
}