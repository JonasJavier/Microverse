/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // El presupuesto real es ≤ 600 KB gzip de JS inicial (docs/06-roadmap.md).
    // Three.js sin minificar ya supera el aviso por defecto de 500 KB.
    chunkSizeWarningLimit: 1600,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
