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

/**
 * Acto 02 · Nourish (jornada 7): cómo se ve el agua y la vida. Todo suavizado:
 * el motor cambia a 10 Hz y la vista no debe dar saltos.
 */
export const GROWTH = {
  /**
   * Fracción del árbol visible con el mundo recién despierto. A/B tras la jornada 7
   * (0,5 · 0,6 · 0,65, misma cámara `general`): con 0,5 era un palo sin silueta y
   * el encendido del despertar no tenía copa que iluminar; con 0,65 regalaba media
   * copa. 0,6: tronco, dos ramas y unas pocas masas de follaje marchito.
   */
  bare: 0.6,
  /** Crecimiento (vitalidad) a partir del cual empieza a revelarse el resto, y donde termina. */
  from: 0.1,
  to: 0.9,
} as const

export const ecoUniforms = {
  /** Fracción del árbol revelada a lo largo de sus ramas (0..1+). */
  uGrowth: { value: GROWTH.bare },
  /** Vitalidad suavizada: los brotes asoman al superar su umbral. */
  uVital: { value: 0 },
  /** Tierra mojada: oscurece y da brillo al suelo y al musgo. */
  uWet: { value: 0 },
  /** Marchitez: desatura y apaga la vegetación. */
  uWilt: { value: 1 },
  /** Lluvia visible (intensidad suavizada). */
  uRain: { value: 0 },
  /** Encharcado: los charcos aparecen al pasarse de agua. */
  uPuddle: { value: 0 },
  /** Reloj del render en segundos (la lluvia cae a velocidad real, no del mundo). */
  uTime: { value: 0 },
  /** Desarrollo de los hongos (asoman por umbral). */
  uMushrooms: { value: 0 },
  /** Brillo de los hongos (Vida, de noche). */
  uMushroomGlow: { value: 0 },
  /** Proporción de luciérnagas que vuelan. */
  uFireflies: { value: 0 },
  /** Sincronía (0 → 1 → 0): las luciérnagas parpadean al unísono. */
  uSync: { value: 0 },
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
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

  const growth =
    GROWTH.bare + (1.05 - GROWTH.bare) * smoothstep(GROWTH.from, GROWTH.to, visuals.crecimiento)
  easing.damp(ecoUniforms.uGrowth, 'value', growth, 1.2, delta)
  easing.damp(ecoUniforms.uVital, 'value', visuals.crecimiento, 1.2, delta)
  easing.damp(ecoUniforms.uWet, 'value', smoothstep(0.12, 0.65, visuals.sueloHumedo), 1, delta)
  easing.damp(ecoUniforms.uWilt, 'value', visuals.marchitez, 1.5, delta)
  easing.damp(ecoUniforms.uRain, 'value', visuals.lluvia, 0.3, delta)
  easing.damp(ecoUniforms.uPuddle, 'value', smoothstep(0.55, 0.85, visuals.sueloHumedo), 1.5, delta)
  ecoUniforms.uTime.value = (ecoUniforms.uTime.value + delta) % 3600
  easing.damp(ecoUniforms.uMushrooms, 'value', visuals.hongos, 1.5, delta)
  easing.damp(ecoUniforms.uMushroomGlow, 'value', 2.2 * visuals.brilloHongos, 1, delta)
  easing.damp(ecoUniforms.uFireflies, 'value', visuals.luciernagas, 2, delta)
  easing.damp(ecoUniforms.uSync, 'value', visuals.sincronia, 0.5, delta)
}
