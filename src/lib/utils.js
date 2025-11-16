// Utilidades para sanitizar nomes e agrupar luzes

// Remove caracteres especiais ., _, -, transforma em maiúsculas e trim
export function sanitizeLabel(filename) {
  const base = filename.replace(/^.*[\\/]/, '')
  const noExt = base.replace(/\.[^/.]+$/, '')
  const cleaned = noExt.replace(/[._-]+/g, ' ')
  // Remove prefixos numéricos do início para ocultar números nos rótulos
  const noPrefix = cleaned.replace(/^\s*\d+\s*/, '')
  return noPrefix.trim().toUpperCase()
}

// Extrai número inicial do nome (grupo), ex: "3 - spot_led.png" => 3
export function extractGroup(filename) {
  const base = filename.replace(/^.*[\\/]/, '')
  const m = base.match(/^(\d+)/)
  return m ? m[1] : 'OUTROS'
}

// Agrupa por número inicial
export function groupByNumber(files) {
  const groups = {}
  for (const f of files) {
    const g = extractGroup(f)
    if (!groups[g]) groups[g] = []
    groups[g].push(f)
  }
  return groups
}

// Ordena: FINAL primeiro, depois por grupo numérico
export function sortLights(files) {
  const finalFirst = files.sort((a, b) => {
    const af = /FINAL\.[a-zA-Z]+$/.test(a)
    const bf = /FINAL\.[a-zA-Z]+$/.test(b)
    if (af && !bf) return -1
    if (!af && bf) return 1
    return a.localeCompare(b)
  })
  return finalFirst
}