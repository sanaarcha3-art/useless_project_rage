/**
 * scripts/dev.mjs
 * ───────────────
 * Launches Vite dev server then starts Electron pointing at it.
 */
import { spawn } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

// Resolve electron binary path directly (avoids shell:true security warning)
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const electronExe = path.join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe')

// Dynamically import vite to avoid CJS deprecation warning
const { createServer } = await import('vite')

const server = await createServer({
  configFile: path.join(__dirname, '..', 'vite.config.ts'),
})
await server.listen()

const port = server.config.server.port ?? 5173
const url = `http://localhost:${port}`
console.log(`[dev] Vite ready at ${url}`)

const electron = spawn(electronExe, ['.'], {
  env: { ...process.env, VITE_DEV_SERVER_URL: url },
  stdio: 'inherit',
  shell: false,
})

electron.on('error', (err) => {
  console.error('[dev] Electron spawn error:', err.message)
  // Fall back to .cmd shim on Windows if direct exe fails
  const fallback = spawn('electron', ['.'], {
    env: { ...process.env, VITE_DEV_SERVER_URL: url },
    stdio: 'inherit',
    shell: true,
  })
  fallback.on('close', () => { server.close(); process.exit(0) })
})

electron.on('close', () => {
  server.close()
  process.exit(0)
})
