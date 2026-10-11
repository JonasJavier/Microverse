import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App.tsx'
// Tipografía de cartela de museo (docs/02, ADR-015): alojada en el propio build, solo el peso 400 latino.
import '@fontsource/instrument-serif/400.css'
import '@fontsource/geist-mono/400.css'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('No se encontró #root')

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
