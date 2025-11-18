import { sanitizeLabel } from '../lib/utils'

export default function UserPanel({ open, onToggle, values, onChange, lightsState }) {
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
            ? 'w-36 glass rounded-[70px] p-3 shadow-2xl shadow-black/40 text-shadow max-h-[70vh] overflow-y-auto scroll-thin transition-all duration-500 ease-in-out'
            : 'w-10 h-10 glass rounded-full shadow-lg shadow-black/40 flex items-center justify-center cursor-pointer transition-all duration-500 ease-in-out'
        }
        onClick={!open ? onToggle : undefined}
      >
        {open ? (
          <>
            {/* Slider vertical de Luz do Dia com gradiente interno e ícones discretos */}
            <div className="mb-4">
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
            </div>

            {/* Sliders compactos: duas linhas por luz (nome em cima, slider fino abaixo) */}
            {/* Ajuste manual: aumente/diminua o padding inferior (pb-16) para evitar que as bordas arredondadas cortem a informação do último slider */}
            <div className="space-y-3 pb-10">
              {dimmables.map((f, idx) => (
                <div key={f} className={idx === dimmables.length - 1 ? 'mb-40' : ''}>
                  {/* Ajuste de margem do último slider: aumente/diminua 'mb-8' acima conforme necessário */}
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