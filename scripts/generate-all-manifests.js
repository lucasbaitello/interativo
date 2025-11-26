import fs from 'fs'
import path from 'path'

const PUBLIC_IMG_DIR = path.join(process.cwd(), 'public', 'img')

function generateManifestForDir(dirPath) {
    if (!fs.existsSync(dirPath)) return

    const files = fs.readdirSync(dirPath)
    const images = files.filter(f => /\.(png|jpg|jpeg|webp|avif)$/i.test(f))

    if (images.length > 0) {
        const manifestPath = path.join(dirPath, 'manifest.json')
        fs.writeFileSync(manifestPath, JSON.stringify(images, null, 2))
        console.log(`Manifesto gerado para ${path.basename(dirPath)}: ${images.length} imagens.`)
    }
}

function main() {
    if (!fs.existsSync(PUBLIC_IMG_DIR)) {
        console.error('Pasta public/img não encontrada.')
        return
    }

    const items = fs.readdirSync(PUBLIC_IMG_DIR)

    // Gera para a raiz de img/luzes se existir (legado)
    generateManifestForDir(path.join(PUBLIC_IMG_DIR, 'luzes'))

    // Gera para cada subpasta
    for (const item of items) {
        const fullPath = path.join(PUBLIC_IMG_DIR, item)
        if (fs.statSync(fullPath).isDirectory()) {
            generateManifestForDir(fullPath)
        }
    }
}

main()
