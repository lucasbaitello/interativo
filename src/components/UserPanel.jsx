import { sanitizeLabel } from '../lib/utils'

export default function UserPanel({ open, onToggle, values, onChange, lightsState, onPresetAll, onTurnOffExceptDaylight, onOpenAdjustments }) {
  const dimmables = Object.keys(lightsState || {}).filter(f => lightsState[f]?.dimmerizavel)

  return (
    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center z-50 pointer-events-auto select-none no-caret">
      {open && (
        <button
          onClick={onToggle}
          className="mr-2 w-10 h-10 glass rounded-full shadow-lg shadow-black/40 flex items-center justify-center hover:bg-white/10 transition-colors"
          aria-label="Colapsar painel"
        >
          <i className="bi bi-arrow-right-circle-fill text-white/80" />
        </button>
      )}

      <aside
        className={
          open
            ? 'w-36 glass rounded-[70px] p-3 shadow-2xl shadow-black/40 text-shadow max-h-[70vh] overflow-y-auto scroll-thin transition-all duration-500 ease-in-out flex flex-col items-center'
            : 'w-10 h-10 glass rounded-full shadow-lg shadow-black/40 flex items-center justify-center cursor-pointer transition-all duration-500 ease-in-out'
        }
        onClick={!open ? onToggle : undefined}
      >
        {open ? (
          <>
            {/* Slider vertical de Luz do Dia com ações rápidas à direita */}
            <div className="mb-4">
              <div className="flex items-center justify-center gap-2">
                {/* Centro: slider vertical */}
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
                {/* Direita: ícones (preset on, off, ajustes) */}
                <div className="flex flex-col items-center gap-2">
                  <button
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shadow"
                    title="Acender todas com preset"
                    aria-label="Acender todas com preset"
                    onClick={onPresetAll}
                  >
                    <i className="bi bi-lightbulb-fill text-white text-sm" />
                  </button>
                  <button
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shadow"
                    title="Apagar todas exceto luz do dia"
                    aria-label="Apagar todas exceto luz do dia"
                    onClick={onTurnOffExceptDaylight}
                  >
                    <i className="bi bi-lightbulb-off text-white text-sm" />
                  </button>
                  <button
                    className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center shadow"
                    title="Abrir ajustes avançados"
                    aria-label="Abrir ajustes avançados"
                    onClick={onOpenAdjustments}
                  >
                    <i className="bi bi-sliders text-white text-sm" />
                  </button>
                </div>
              </div>
            </div>

            {/* Sliders compactos: layout padronizado independentemente da quantidade */}
            <div className={dimmables.length ? 'space-y-3 pb-6 w-full' : 'pb-2 w-full'}>
              {dimmables.map((f) => (
                <div key={f}>
                  <div className="text-[11px] truncate text-neutral-200 cursor-default">{sanitizeLabel(f)}</div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={0}
                      max={100}
                      step={1}
                      value={values[f] ?? 50}
                      onChange={e => onChange(f, parseFloat(e.target.value))}
                      className="w-full range-thin"
                      style={{ '--progress': `${values[f] ?? 50}%` }}
                    />
                    <span className="text-[10px] text-neutral-300 w-8 text-right">{Math.round(values[f] ?? 50)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center w-full h-full" aria-label="Expandir">
            <i className="bi bi-arrow-left-circle-fill text-white/80" />
          </div>
        )}
      </aside>
    </div>
  )
}