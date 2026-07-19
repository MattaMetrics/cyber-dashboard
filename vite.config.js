import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

const BLUEPRINT_EXPORT_DIR = 'C:\\Users\\Legion\\Desktop\\Temp Client Blueprints'

function blueprintExportPlugin() {
  return {
    name: 'blueprint-export-api',
    configureServer(server) {
      server.middlewares.use('/api/export-blueprint', (req, res, next) => {
        if (req.method !== 'POST') {
          next()
          return
        }

        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          try {
            const { fileName, content } = JSON.parse(body || '{}')
            if (!fileName || typeof content !== 'string') {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, error: 'Missing fileName or content' }))
              return
            }

            const safeName = path.basename(String(fileName)).replace(/[<>:"/\\|?*]/g, '_')
            fs.mkdirSync(BLUEPRINT_EXPORT_DIR, { recursive: true })
            const fullPath = path.join(BLUEPRINT_EXPORT_DIR, safeName)
            fs.writeFileSync(fullPath, content, 'utf8')

            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, path: fullPath }))
          } catch (error) {
            res.statusCode = 500
            res.end(JSON.stringify({ ok: false, error: error.message }))
          }
        })
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), blueprintExportPlugin()],
})
