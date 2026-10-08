/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    // `npm run dev:poll`: en Windows, el vigilante nativo pierde cambios hechos por
    // herramientas que reemplazan el archivo entero (agentes, sed -i). El polling no.
    watch: mode === 'poll' ? { usePolling: true, interval: 150 } : undefined,
  },
  build: {
    // El presupuesto real es ≤ 600 KB gzip de JS inicial (docs/06-roadmap.md).
    // Three.js sin minificar ya supera el aviso por defecto de 500 KB.
    chunkSizeWarningLimit: 1600,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}))
