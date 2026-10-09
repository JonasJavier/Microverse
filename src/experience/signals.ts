import { easing } from 'maath'
import { Color } from 'three'
import { palette } from '../config/palette.ts'
import { useMicroverseStore } from '../store/useMicroverseStore.ts'

/**
 * Señales de la red de vida (jornada 6, acto 01 · Awakening). Traduce el estado
 * del motor a uniforms que comparten las raíces, la corteza y el follaje: un
 * solo objeto por uniform, mutado una vez por frame. Las distancias son las del
 * grafo (por las conexiones desde la semilla), las mismas en las raíces y el
 * árbol: la señal sube de la semilla al árbol sin saltos.
 */
export const SIGNALS = {
  /** Velocidad del frente de encendido (unidades del mundo por segundo del mundo). */
  ignitionSpeed: 0.4,
  /** Separación entre pulsos sucesivos a lo largo de la red. */
  wavelength: 0.5,
  /** Frecuencia de los pulsos (Hz) con `frecuenciaPulso` = 1. */
  maxPulseHz: 0.6,
  /** Duración característica del destello del despertar (s). */
  flashTime: 1.2,
} as const

export const signalUniforms = {
  /** Distancia alcanzada por el encendido; < 0 mientras la semilla duerme. */
  uIgnition: { value: -1 },
  /** Fase de los pulsos, en ciclos (se integra: cambiar la frecuencia no da saltos). */
  uPhase: { value: 0 },
  uWavelength: { value: SIGNALS.wavelength },
  /** Brillo de la red según la salud del mundo (`brilloRaices`, suavizado). */
  uLife: { value: 0 },
  /** Destello del despertar: 1 → 0. */
  uFlash: { value: 0 },
  uSolColor: { value: new Color(palette.luz.sol) },
  uVidaColor: { value: new Color(palette.luz.vida) },
}

/** Valores suavizados que no son uniforms (los lee la semilla). */
export const seedSignal = { pulse: 1 }

let lastWorldTime = 0

/**
 * Se llama una vez por frame, justo después de avanzar el motor
 * (`SimulationDriver`). Lee el motor por referencia y no asigna memoria.
 */
export function updateSignals(delta: number) {
  const { state, visuals } = useMicroverseStore.getState().engine
  const since = state.despertadoEn === null ? -1 : state.tiempo - state.despertadoEn
  signalUniforms.uIgnition.value = since < 0 ? -1 : since * SIGNALS.ignitionSpeed
  signalUniforms.uFlash.value = since < 0 ? 0 : Math.exp(-since / SIGNALS.flashTime)

  // Los pulsos avanzan con el tiempo del mundo (a ×20 al calibrar, también).
  const worldDelta = Math.max(0, state.tiempo - lastWorldTime)
  lastWorldTime = state.tiempo
  const hz = SIGNALS.maxPulseHz * visuals.frecuenciaPulso
  // Fase en [0, 1): fract() en el shader no cambia con vueltas enteras.
  signalUniforms.uPhase.value = (signalUniforms.uPhase.value + hz * worldDelta) % 1

  easing.damp(signalUniforms.uLife, 'value', visuals.brilloRaices, 0.8, delta)
  easing.damp(seedSignal, 'pulse', visuals.pulsoSemilla, 0.8, delta)
}
