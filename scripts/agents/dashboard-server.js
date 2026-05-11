/**
 * dashboard-server.js
 * HTTP + WebSocket server on port 3456.
 * Serves agent-dashboard.html and broadcasts agent events.
 */

import http    from 'http'
import fs      from 'fs'
import path    from 'path'
import { fileURLToPath } from 'url'
import { WebSocketServer } from 'ws'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const HTML_PATH = path.resolve(__dirname, '../../public/agent-dashboard.html')
const PORT      = 3456

let wss    = null
let server = null
const clients = new Set()

export function startServer() {
  return new Promise((resolve, reject) => {
    server = http.createServer((req, res) => {
      if (req.url === '/' || req.url === '/agent-dashboard.html') {
        const html = fs.readFileSync(HTML_PATH, 'utf8')
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end(html)
      } else {
        res.writeHead(404)
        res.end('Not found')
      }
    })

    wss = new WebSocketServer({ server })

    wss.on('connection', (ws) => {
      clients.add(ws)
      ws.on('close', () => clients.delete(ws))
    })

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        // Port busy — kill the stale process and retry once
        console.warn(`[dashboard] Port ${PORT} in use — retrying in 1s…`)
        setTimeout(() => {
          server.close()
          server = null
          wss    = null
          startServer().then(resolve).catch(reject)
        }, 1000)
      } else {
        reject(err)
      }
    })

    server.listen(PORT, () => {
      resolve(`http://localhost:${PORT}`)
    })
  })
}

export function stopServer() {
  return new Promise((resolve) => {
    if (!server) return resolve()
    for (const ws of clients) {
      try { ws.close() } catch {}
    }
    server.close(() => resolve())
  })
}

export function broadcast(type, payload = {}) {
  const msg = JSON.stringify({ type, ...payload, ts: Date.now() })
  for (const ws of clients) {
    if (ws.readyState === 1 /* OPEN */) {
      ws.send(msg)
    }
  }
}
