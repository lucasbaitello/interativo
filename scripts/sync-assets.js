// Copia imagens de ./img para ./public/img e (opcionalmente) gera manifest.json com lista de luzes
// Como usar:
// 1) Coloque suas imagens em ./img/<ambiente>/luzes ou diretamente em ./img/luzes
// 2) Rode: node scripts/sync-assets.js
// 3) As imagens serão copiadas para ./public/img/... e podem ser usadas pelo Viewer
// Para gerar um manifest customizado, adapte este script conforme sua estrutura de pastas.
// Comentário: ajuste os caminhos de origem/destino se mudar a estrutura.
import fs from 'fs'
import path from 'path'

const ROOT = process.cwd()
const SRC_IMG_DIR = path.join(ROOT, 'img')
const SRC_LUZES_DIR = path.join(SRC_IMG_DIR, 'luzes')
const PUBLIC_DIR = path.join(ROOT, 'public')
const PUBLIC_IMG_DIR = path.join(PUBLIC_DIR, 'img')
const PUBLIC_LUZES_DIR = path.join(PUBLIC_IMG_DIR, 'luzes')

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true })
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest))
  fs.copyFileSync(src, dest)
}

function main() {
  ensureDir(PUBLIC_DIR)
  ensureDir(PUBLIC_IMG_DIR)
  ensureDir(PUBLIC_LUZES_DIR)

  // Copia logo e ícone
  const logoSrc = path.join(SRC_IMG_DIR, 'logo.avif')
  const iconSrc = path.join(SRC_IMG_DIR, 'icon.png')
  if (fs.existsSync(logoSrc)) copyFile(logoSrc, path.join(PUBLIC_IMG_DIR, 'logo.avif'))
  if (fs.existsSync(iconSrc)) copyFile(iconSrc, path.join(PUBLIC_IMG_DIR, 'icon.png'))

  // Copia luzes e gera manifest
  const manifest = []
  if (fs.existsSync(SRC_LUZES_DIR)) {
    const files = fs.readdirSync(SRC_LUZES_DIR)
    for (const f of files) {
      const src = path.join(SRC_LUZES_DIR, f)
      const dest = path.join(PUBLIC_LUZES_DIR, f)
      const stat = fs.statSync(src)
      if (stat.isFile()) {
        copyFile(src, dest)
        manifest.push(f)
      }
    }
  } else {
    console.error('Diretório ./img/luzes não encontrado. Verifique a pasta de origem.')
  }

  fs.writeFileSync(path.join(PUBLIC_DIR, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8')
  console.log('Assets sincronizados e manifest.json gerado com', manifest.length, 'itens.')
}

main()