import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// When deploying to GitHub Pages the app is served from
// https://<user>.github.io/financeapp/, so assets need the "/financeapp/" base.
// Locally (dev/preview) we keep the root base. Override with VITE_BASE if needed.
// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: process.env.VITE_BASE ?? (command === 'build' ? '/financeapp/' : '/'),
}))
