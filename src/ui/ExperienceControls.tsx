import { useState, type KeyboardEvent } from 'react'
import { useMicroverseStore } from '../store/useMicroverseStore.ts'

/** Gota: el único icono de la cápsula por ahora (el sol llega en la jornada 8). */
function DropIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <path
        d="M12 3c3.2 4.3 6 7.6 6 11a6 6 0 0 1-12 0c0-3.4 2.8-6.7 6-11z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  )
}

const HOLD_KEYS = new Set([' ', 'Enter'])

/**
 * Cápsula de controles (docs/02 · Interfaz): aparece al despertar la semilla.
 * La lluvia se mantiene pulsada (ratón, dedo o espacio/Intro con el foco). Hasta
 * la primera lluvia, una pista dice cómo usarla; después desaparece.
 */
export function ExperienceControls() {
  const awake = useMicroverseStore((s) => s.etapa !== 'dormido')
  const haLlovido = useMicroverseStore((s) => s.haLlovido)
  const empezarLluvia = useMicroverseStore((s) => s.empezarLluvia)
  const pararLluvia = useMicroverseStore((s) => s.pararLluvia)
  const [pressed, setPressed] = useState(false)

  const start = () => {
    setPressed(true)
    empezarLluvia()
  }
  const stop = () => {
    if (!pressed) return
    setPressed(false)
    pararLluvia()
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (!HOLD_KEYS.has(event.key) || event.repeat) return
    event.preventDefault()
    start()
  }
  const onKeyUp = (event: KeyboardEvent) => {
    if (HOLD_KEYS.has(event.key)) stop()
  }

  return (
    <div className="controls" data-visible={awake} aria-hidden={!awake}>
      <p className="controls__hint" data-visible={awake && !haLlovido}>
        Mantén pulsado para que llueva
      </p>
      <div className="controls__capsule">
        <button
          type="button"
          className="controls__button"
          aria-pressed={pressed}
          tabIndex={awake ? 0 : -1}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId)
            start()
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
          onLostPointerCapture={stop}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onBlur={stop}
          onContextMenu={(event) => event.preventDefault()}
        >
          <DropIcon />
          <span>Lluvia</span>
        </button>
      </div>
    </div>
  )
}
