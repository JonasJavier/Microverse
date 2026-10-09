import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'

/** Pulsación larga (docs/04 · Interacción): más de 400 ms con menos de 8 px de movimiento. */
const LONG_PRESS_MS = 400
const LONG_PRESS_SLOP = 8

/**
 * Gestos sobre la esfera y teclado (acto 02 · Nourish):
 *  - pulsación larga sobre el lienzo = lluvia mientras se mantiene;
 *  - mantener R = lluvia.
 * Un arrastre (más de 8 px) es un giro de cámara: cancela la pulsación larga.
 * Funciona igual con ratón y en táctil (Pointer Events).
 */
function listen(canvas: HTMLElement) {
  const { empezarLluvia, pararLluvia } = useMicroverseStore.getState()
  let timer = 0
  let raining = false
  let startX = 0
  let startY = 0

  const cancel = () => {
    window.clearTimeout(timer)
    timer = 0
  }
  const stop = () => {
    cancel()
    if (raining) pararLluvia()
    raining = false
  }
  const onDown = (event: PointerEvent) => {
    if (!event.isPrimary) return
    startX = event.clientX
    startY = event.clientY
    cancel()
    timer = window.setTimeout(() => {
      raining = true
      empezarLluvia()
    }, LONG_PRESS_MS)
  }
  const onMove = (event: PointerEvent) => {
    if (timer && Math.hypot(event.clientX - startX, event.clientY - startY) > LONG_PRESS_SLOP)
      cancel()
  }

  let keyRain = false
  const typing = (event: KeyboardEvent) =>
    event.target instanceof Element &&
    event.target.closest('input, textarea, select, button, [contenteditable]') !== null
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.repeat || keyRain || typing(event) || event.key.toLowerCase() !== 'r') return
    keyRain = true
    empezarLluvia()
  }
  const onKeyUp = (event: KeyboardEvent) => {
    if (!keyRain || event.key.toLowerCase() !== 'r') return
    keyRain = false
    pararLluvia()
  }
  // Si la ventana pierde el foco con la lluvia activa, se para.
  const onBlur = () => {
    stop()
    if (keyRain) pararLluvia()
    keyRain = false
  }

  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', stop)
  window.addEventListener('pointercancel', stop)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', onBlur)
  return () => {
    stop()
    canvas.removeEventListener('pointerdown', onDown)
    canvas.removeEventListener('pointermove', onMove)
    window.removeEventListener('pointerup', stop)
    window.removeEventListener('pointercancel', stop)
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', onBlur)
  }
}

export function Gestures() {
  const canvas = useThree((s) => s.gl.domElement)
  useEffect(() => listen(canvas), [canvas])
  return null
}
