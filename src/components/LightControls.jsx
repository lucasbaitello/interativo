import { sanitizeLabel, groupByNumber } from '../lib/utils'

// Painel lateral com sliders 0..10 por luz, agrupados por numeração
// Comentário: ajuste estilos e posicionamento do painel conforme a identidade visual.
export default function LightControls({ files, values, onChange, showFinal, onToggleFinal, collapsed, onToggleCollapsed }) {
  const groups = groupByNumber(files.filter(f => !/FINAL\.[a-zA-Z]+$/.test(f)))

  const asideClass = collapsed
    ? 'absolute left-4 top-4 w-10 h-10 glass rounded-full shadow-lg shadow-black/40 flex items-center justify-center cursor-pointer'
    : 'absolute left-4 top-4 bottom-4 w-80 glass rounded-2xl p-4 shadow-2xl shadow-black/40 overflow-y-auto scroll-thin'

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
            <div className="text-xs text-neutral-400">0–10 intensidade</div>
          </>
        )}
      </div>

      {/* Controles quando expandido */}
      {!collapsed && (
        <>
          {/* Seletor de blending removido conforme solicitação */}

          {/* Toggle da FINAL */}
          <div className="mb-4 flex items-center justify-between">
            <span className="text-xs">Imagem FINAL sobrepor</span>
            <button
              onClick={onToggleFinal}
              className={`px-3 py-1 rounded-lg text-xs transition ${showFinal ? 'bg-white/20' : 'bg-white/10'}`}
            >
              {showFinal ? 'Ativada' : 'Desativada'}
            </button>
          </div>

          {/* Sliders por grupo */}
          <div>
            <h2 className="text-sm font-semibold tracking-wide mb-2">Interruptores de Luz</h2>
            {Object.keys(groups).sort((a, b) => parseInt(a) - parseInt(b)).map(group => (
              <div key={group} className="mb-5">
                {/* Oculta rótulo de número do grupo para um visual mais limpo */}
                <div className="space-y-3">
                  {groups[group].map(f => (
                    <div key={f} className="flex items-center gap-3">
                      {/* Personalização: altere estilos das labels aqui (legibilidade e contraste) */}
                      <label className="text-xs flex-1 text-neutral-100 text-shadow">
                        {sanitizeLabel(f)}
                      </label>
                      {/* Slider: ajuste sensibilidade via 'step' e fallback via 'value' */}
                      <input
                        type="range"
                        min={0}
                        max={100}
                        step={1}
                        value={values[f] ?? 50}
                        onChange={e => onChange(f, parseFloat(e.target.value))}
                        className="w-32 range-gray accent-gray-400"
                      />
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