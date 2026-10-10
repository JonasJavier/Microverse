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
/** Por debajo de esto, soltar el control es un toque: se convierte en chaparrón. */
const TAP_MS = 250
/** Un clic que llega justo después de soltar es el de esa misma pulsación. */
const CLICK_AFTER_PRESS_MS = 500

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
 * Jornada 11: un toque corto, o un clic sin pulsación (lector de pantalla,
 * control por voz), es un chaparrón de unos segundos: nadie se queda sin regar
 * por no poder mantener. Las pistas se anuncian (`aria-live`).
 */
export function ExperienceControls() {
  const awake = useMicroverseStore((s) => s.etapa !== 'dormido')
  const haLlovido = useMicroverseStore((s) => s.haLlovido)
  const encharcado = useMicroverseStore((s) => s.encharcado)
  const primerBrote = useMicroverseStore((s) => s.primerBrote)
  const haMovidoSol = useMicroverseStore((s) => s.haMovidoSol)
  const empezarLluvia = useMicroverseStore((s) => s.empezarLluvia)
  const pararLluvia = useMicroverseStore((s) => s.pararLluvia)
  const chaparron = useMicroverseStore((s) => s.chaparron)
  const chaparronActivo = useMicroverseStore((s) => s.chaparronActivo)
  const moverSol = useMicroverseStore((s) => s.moverSol)
  const [pressed, setPressed] = useState(false)
  const [dragging, setDragging] = useState(false)
  // Solo para la accesibilidad del deslizador: se actualiza al soltar, no por frame.
  const [ciclo, setCiclo] = useState(() => useMicroverseStore.getState().engine.state.ciclo)
  const lastX = useRef(0)
  // Inicio de la pulsación en curso (0 = ninguna) y último momento en que se soltó.
  const pressStart = useRef(0)
  const lastRelease = useRef(0)

  // Soltar llega por varios caminos (pointerup, pérdida de captura, blur): solo
  // cuenta el primero. El store cuenta las fuentes, así que parar nunca deja
  // la lluvia encendida.
  const start = () => {
    if (pressStart.current) return
    pressStart.current = performance.now()
    setPressed(true)
    empezarLluvia('control')
  }
  const stop = () => {
    if (!pressStart.current) return
    const now = performance.now()
    const held = now - pressStart.current
    pressStart.current = 0
    lastRelease.current = now
    setPressed(false)
    // Antes de parar el control: así la lluvia no llega a cortarse.
    if (held < TAP_MS) chaparron()
    pararLluvia('control')
  }
  const onRainClick = () => {
    if (pressStart.current || performance.now() - lastRelease.current < CLICK_AFTER_PRESS_MS) return
    chaparron()
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
          aria-pressed={pressed || chaparronActivo}
          aria-describedby="controls-rain-help"
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
          onClick={onRainClick}
          onContextMenu={(event) => event.preventDefault()}
        >
          <DropIcon />
          <span>Lluvia</span>
        </button>
        <span id="controls-rain-help" className="sr-only">
          Mantén pulsado para regar; una pulsación corta trae un chaparrón.
        </span>
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
      <p className="controls__hint" data-visible={awake && hint !== null} aria-live="polite">
        {hint}
      </p>
    </div>
  )
}
