export default function SliderBar({ value = 0, min = 0, max = 100, step = 1, onChange, height = 6, className = '', progressClassName = '', ariaLabel }) {
  const clamp = (n, a, b) => Math.min(Math.max(n, a), b)
  const range = max - min
  const pct = range > 0 ? ((clamp(value, min, max) - min) / range) * 100 : 0
  return (
    <div
      className={`relative w-full rounded-full bg-white/12 hover:bg-white/16 border border-white/15 hover:border-white/20 overflow-hidden dark-glow ${className}`}
      style={{ height: `${height}px` }}
    >
      <div
        className={`absolute top-0 left-0 h-full bg-gray-400/70 backdrop-blur-md border-r border-white/20 ${progressClassName}`}
        style={{ width: `${pct}%` }}
      />
      <input
        type="range"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange && onChange(parseFloat(e.target.value))}
        aria-label={ariaLabel}
      />
    </div>
  )
}