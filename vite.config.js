import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    configureServer(server) {
      // Middleware para salvar configurações no disco durante o dev
      server.middlewares.use('/save-config', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }
        let body = ''
        req.on('data', (chunk) => { body += chunk })
        req.on('end', () => {
          try {
            const data = JSON.parse(body || '{}')
            const dir = path.resolve(process.cwd(), 'public', 'config')
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
            const filePath = path.join(dir, 'viewerState.json')
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, path: filePath }))
          } catch (e) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: String(e) }))
          }
        })
      })
    }
  },
  build: {
    outDir: 'dist'
  }
})