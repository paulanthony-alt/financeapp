import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Emits dist/sw.js: the service worker template with the list of every built file
// (so the whole app is cached offline) and a build id that changes when any file does.
function serviceWorker() {
  const PUBLIC_FILES = ['manifest.webmanifest', 'favicon.svg', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png']
  return {
    name: 'finpilot-service-worker',
    apply: 'build',
    enforce: 'post',
    generateBundle(_options, bundle) {
      const files = [...new Set(['index.html', ...Object.keys(bundle).filter((f) => f !== 'sw.js'), ...PUBLIC_FILES])].sort()
      const template = readFileSync(new URL('./pwa/sw.template.js', import.meta.url), 'utf8')
      const build = createHash('sha1').update(files.join('|') + template).digest('hex').slice(0, 10)
      const source = template.replace('__BUILD__', build).replace('__PRECACHE__', JSON.stringify(files))
      if (source.includes('__BUILD__') || source.includes('__PRECACHE__')) {
        throw new Error('service worker template still has an unfilled placeholder')
      }
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

// When deploying to GitHub Pages the app is served from
// https://<user>.github.io/financeapp/, so assets need the "/financeapp/" base.
// Locally (dev/preview) we keep the root base. Override with VITE_BASE if needed.
// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), serviceWorker()],
  build: {
    rollupOptions: {
      output: {
        // React and the chart library get their own long-cached files, so tabs that
        // don't draw charts (Goals) never download Recharts.
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return 'react'
          return 'recharts' // chart library and its dependencies
        },
      },
    },
  },
  base: process.env.VITE_BASE ?? (command === 'build' ? '/financeapp/' : '/'),
}))
