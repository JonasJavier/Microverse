import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useMicroverseStore } from '../store/useMicroverseStore.ts'
import { SUN_DRAG_PX, SUN_KEY_STEP, momentoDelCiclo } from '../config/sunControl.ts'

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

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
      <circle cx="12" cy="12" r="4" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}

const HOLD_KEYS = new Set([' ', 'Enter'])

/** Pista visible: una sola a la vez, por prioridad (descanso > regar > sol). */
function hintFor(state: {
  encharcado: boolean
  haLlovido: boolean
  primerBrote: boolean
  haMovidoSol: boolean
}) {
  if (state.encharcado) return 'La tierra necesita descansar'
  if (!state.haLlovido) return 'Mantén pulsado para regar'
  if (state.primerBrote && !state.haMovidoSol) return 'Arrastra el sol'
  return null
}

/**
 * Cápsula de controles (docs/02 · Interfaz): aparece al despertar la semilla.
 *  - La lluvia se mantiene pulsada (ratón, dedo o espacio/Intro con el foco).
 *  - El sol (jornada 8) aparece con el primer brote: se arrastra en horizontal
 *    (un ancho de `SUN_DRAG_PX` recorre el día entero) o con las flechas con el foco.
 *    Es un deslizador sin números: el valor se describe con palabras.
 * Una sola pista a la vez; cada una desaparece cuando el visitante ya sabe.
 * Pendiente (jornada 11): activación sin mantener para lectores de pantalla.
 */
export function ExperienceControls() {
  const awake = useMicroverseStore((s) => s.etapa !== 'dormido')
  const haLlovido = useMicroverseStore((s) => s.haLlovido)
  const encharcado = useMicroverseStore((s) => s.encharcado)
  const primerBrote = useMicroverseStore((s) => s.primerBrote)
  const haMovidoSol = useMicroverseStore((s) => s.haMovidoSol)
  const empezarLluvia = useMicroverseStore((s) => s.empezarLluvia)
  const pararLluvia = useMicroverseStore((s) => s.pararLluvia)
  const moverSol = useMicroverseStore((s) => s.moverSol)
  const [pressed, setPressed] = useState(false)
  const [dragging, setDragging] = useState(false)
  // Solo para la accesibilidad del deslizador: se actualiza al soltar, no por frame.
  const [ciclo, setCiclo] = useState(() => useMicroverseStore.getState().engine.state.ciclo)
  const lastX = useRef(0)

  // Parar es idempotente (el store cuenta las fuentes): no depende de `pressed`,
  // así una pulsación muy breve nunca deja la lluvia encendida.
  const start = () => {
    setPressed(true)
    empezarLluvia('control')
  }
  const stop = () => {
    setPressed(false)
    pararLluvia('control')
  }
  const onRainKeyDown = (event: KeyboardEvent) => {
    if (!HOLD_KEYS.has(event.key) || event.repeat) return
    event.preventDefault()
    start()
  }
  const onRainKeyUp = (event: KeyboardEvent) => {
    if (HOLD_KEYS.has(event.key)) stop()
  }

  const syncCiclo = () => setCiclo(useMicroverseStore.getState().engine.state.ciclo)
  const onSunDown = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    lastX.current = event.clientX
    setDragging(true)
  }
  const onSunMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!dragging) return
    moverSol((event.clientX - lastX.current) / SUN_DRAG_PX)
    lastX.current = event.clientX
  }
  const onSunUp = () => {
    setDragging(false)
    syncCiclo()
  }
  const onSunKeyDown = (event: KeyboardEvent) => {
    const dir = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    event.preventDefault()
    moverSol(dir * SUN_KEY_STEP)
    syncCiclo()
  }

  const hint = hintFor({ encharcado, haLlovido, primerBrote, haMovidoSol })

  return (
    <div className="controls" data-visible={awake} aria-hidden={!awake}>
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
          onKeyDown={onRainKeyDown}
          onKeyUp={onRainKeyUp}
          onBlur={stop}
          onContextMenu={(event) => event.preventDefault()}
        >
          <DropIcon />
          <span>Lluvia</span>
        </button>
        <button
          type="button"
          className="controls__button controls__button--sun"
          role="slider"
          aria-label="Sol"
          aria-valuemin={0}
          aria-valuemax={1}
          aria-valuenow={Number(ciclo.toFixed(2))}
          aria-valuetext={momentoDelCiclo(ciclo)}
          aria-orientation="horizontal"
          data-visible={primerBrote}
          data-dragging={dragging}
          tabIndex={awake && primerBrote ? 0 : -1}
          onPointerDown={onSunDown}
          onPointerMove={onSunMove}
          onPointerUp={onSunUp}
          onPointerCancel={onSunUp}
          onLostPointerCapture={onSunUp}
          onKeyDown={onSunKeyDown}
          onContextMenu={(event) => event.preventDefault()}
        >
          <SunIcon />
          <span>Sol</span>
        </button>
      </div>
      {/* Debajo de la cápsula: encima se pisaba con el anillo del pedestal a 16:9. */}
      <p className="controls__hint" data-visible={awake && hint !== null}>
        {hint}
      </p>
    </div>
  )
}
