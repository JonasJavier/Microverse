import { useEffect, useRef, useState } from 'react'
import { useMicroverseStore } from '../store/useMicroverseStore.ts'
import type { EcosystemState } from '../simulation/types.ts'

const ROWS: readonly [label: string, read: (s: EcosystemState) => string][] = [
  ['luz', (s) => s.luz.toFixed(2)],
  ['humedad', (s) => s.humedad.toFixed(2)],
  ['vitalidad', (s) => s.vitalidad.toFixed(2)],
  ['energía', (s) => s.energiaSolar.toFixed(2)],
  ['hongos', (s) => s.hongos.toFixed(2)],
  ['etapa', (s) => (s.sincronia.activa ? 'sincronía' : s.etapa)],
]

/** Barra de 10 celdas: se lee de un vistazo sin leer el número. */
const bar = (v: number) => {
  const n = Math.round(Math.min(1, Math.max(0, v)) * 10)
  return '▮'.repeat(n) + '▯'.repeat(10 - n)
}

function render(el: HTMLElement, s: EcosystemState) {
  el.textContent = ROWS.map(([label, read], i) => {
    const value = read(s)
    const gauge = i < 5 ? `  ${bar(Number(value))}` : ''
    return `${label.padEnd(10)}${value.padStart(9)}${gauge}`
  }).join('\n')
}

/**
 * Modo observador (tecla O): las tres variables del mundo en monoespaciada
 * pequeña, como una cartela de museo (docs/02 · Tipografía e interfaz). Sirve
 * para depurar, calibrar y para la presentación de "cómo se construyó". Lee el
 * motor por referencia en su propio bucle: no hay renders de React por frame.
 */
export function ObserverMode() {
  const [visible, setVisible] = useState(false)
  const panel = useRef<HTMLPreElement>(null)

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      // Escribiendo en un campo (p. ej. el panel de desarrollo), la O es una letra.
      const { target } = event
      if (target instanceof Element && target.closest('input, textarea, select, [contenteditable]'))
        return
      if (event.key === 'o' || event.key === 'O') setVisible((v) => !v)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (!visible) return
    let frame = 0
    const loop = () => {
      if (panel.current) render(panel.current, useMicroverseStore.getState().engine.state)
      frame = requestAnimationFrame(loop)
    }
    loop()
    return () => cancelAnimationFrame(frame)
  }, [visible])

  if (!visible) return null
  return (
    <aside className="observer" aria-label="Modo observador: estado del mundo">
      <p className="observer__title">observador</p>
      <pre ref={panel} className="observer__values" />
    </aside>
  )
}
