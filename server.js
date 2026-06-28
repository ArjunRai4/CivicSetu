// Tiny dependency-free static file server for the production build.
// Cloud Run sets $PORT (default 8080); we listen on it and serve dist/.
// HashRouter means no SPA rewrite is strictly required, but we fall back to
// index.html for unknown paths so direct/deep links always resolve.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { join, extname, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = join(__dirname, 'dist')
const PORT = process.env.PORT || 8080

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8',
}

async function send(res, filePath, status = 200) {
  const data = await readFile(filePath)
  const ext = extname(filePath).toLowerCase()
  res.writeHead(status, {
    'Content-Type': MIME[ext] || 'application/octet-stream',
    'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000',
  })
  res.end(data)
}

const server = createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    let rel = normalize(urlPath).replace(/^(\.\.[/\\])+/, '')
    if (rel === '/' || rel === '') rel = '/index.html'
    const filePath = join(ROOT, rel)

    // prevent path traversal outside ROOT
    if (!filePath.startsWith(ROOT)) {
      res.writeHead(403)
      return res.end('Forbidden')
    }

    try {
      const s = await stat(filePath)
      if (s.isFile()) return await send(res, filePath)
    } catch {
      /* fall through to index.html */
    }
    // SPA fallback
    return await send(res, join(ROOT, 'index.html'))
  } catch (err) {
    res.writeHead(500)
    res.end('Internal Server Error')
    console.error(err)
  }
})

server.listen(PORT, () => {
  console.log(`CivicSetu serving dist/ on port ${PORT}`)
})
