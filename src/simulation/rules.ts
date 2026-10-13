import type { EcosystemConfig } from './ecosystemConfig.ts'
import type { EcosystemState, Etapa, VisualParams } from './types.ts'

/** Reglas puras del motor (docs/05-ecosystem-engine.md · Reglas y Salidas). */

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

export const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** 1 dentro de [a, b]; fuera, baja linealmente hasta 0 a una distancia `caida`. */
export function banda(x: number, [a, b]: readonly [number, number], caida: number) {
  if (x < a) return clamp01(1 - (a - x) / caida)
  if (x > b) return clamp01(1 - (x - b) / caida)
  return 1
}

/** Puntos de la curva de luz: mañana, mediodía, atardecer, noche cerrada. */
const CURVA_LUZ: readonly (readonly [number, number])[] = [
  [0, 0.4],
  [0.35, 1],
  [0.65, 0.45],
  [0.85, 0],
]

/** Luz instantánea según el ciclo, con interpolación suave entre puntos. */
export function curvaLuz(ciclo: number) {
  const c = clamp01(ciclo)
  for (let i = 0; i < CURVA_LUZ.length - 1; i++) {
    const [c0, l0] = CURVA_LUZ[i]!
    const [c1, l1] = CURVA_LUZ[i + 1]!
    if (c <= c1) return lerp(l0, l1, smoothstep(c0, c1, c))
  }
  return CURVA_LUZ[CURVA_LUZ.length - 1]![1]
}

/** Sin agua no hay vida; sin sol, vida a medias. */
export function salud(humedad: number, energiaSolar: number, config: EcosystemConfig) {
  const fH = banda(humedad, config.BANDA_HUMEDAD, config.CAIDA_BANDA)
  const fE = banda(energiaSolar, config.BANDA_ENERGIA, config.CAIDA_BANDA)
  return fH * (0.5 + 0.5 * fE)
}

export const nocheDe = (ciclo: number) => smoothstep(0.7, 0.9, ciclo)

/**
 * Estación del mundo (jornada 15): fracción del año, cíclica. El año empieza
 * al despertar la semilla (primavera, 0); verano 0,25; otoño 0,5; invierno
 * 0,75. Un mundo dormido no tiene estación: sigue en primavera.
 */
export const estacionDe = (tiempo: number, duracionAno: number) =>
  ((tiempo / duracionAno) % 1 + 1) % 1

/** Tiempo del mundo desde el despertar (0 mientras duerme). */
export const edadDe = (state: Pick<EcosystemState, 'tiempo' | 'despertadoEn'>) =>
  state.despertadoEn === null ? 0 : Math.max(0, state.tiempo - state.despertadoEn)

/**
 * Cuánto crece el mundo según la estación: pleno entre primavera y verano,
 * frenado un `freno` entre otoño e invierno (coseno suave, sin saltos).
 */
export function factorEstacional(estacion: number, freno: number) {
  const fase = Math.cos(2 * Math.PI * (estacion - 0.125))
  return 1 - freno * (0.5 - 0.5 * fase)
}

/** Nombre de la estación, para el modo observador. */
export function nombreEstacion(estacion: number): string {
  const e = ((estacion % 1) + 1) % 1
  if (e < 0.125 || e >= 0.875) return 'primavera'
  if (e < 0.375) return 'verano'
  if (e < 0.625) return 'otoño'
  return 'invierno'
}

/**
 * Etapa con histéresis: florecer pide 0.7 de vitalidad, dejar de florecer, bajar
 * de 0.6. Sin ella, un mundo que roza el umbral cambiaría de etapa en cada tick.
 */
export function etapaDe(state: EcosystemState): Etapa {
  if (!state.despertado) return 'dormido'
  if (!state.primerBrote) return 'despertando'
  if (state.etapa === 'floreciendo') return state.vitalidad < 0.6 ? 'creciendo' : 'floreciendo'
  return state.vitalidad >= 0.7 ? 'floreciendo' : 'creciendo'
}

/** Salidas visuales (docs/05 · Salidas). Escribe en `out`: no crea objetos por tick. */
export function computeVisuals(
  state: EcosystemState,
  config: EcosystemConfig,
  out: VisualParams,
): VisualParams {
  const { despertado, vitalidad, humedad } = state
  const noche = nocheDe(state.ciclo)
  out.noche = noche
  out.estacion = estacionDe(edadDe(state), config.DURACION_ANO)
  out.crecimiento = vitalidad
  out.brilloRaices = despertado ? lerp(0.15, 1, vitalidad) * (0.7 + 0.3 * noche) : 0
  out.frecuenciaPulso = despertado ? 0.25 + 0.75 * vitalidad : 0
  // La semilla late fuerte mientras duerme y se calma cuando el mundo despierta.
  out.pulsoSemilla = despertado ? 1 - smoothstep(config.VITALIDAD_MIN, 0.4, vitalidad) : 1
  out.marchitez = clamp01((0.25 - humedad) / 0.2)
  out.sueloHumedo = humedad
  out.lluvia = state.lluvia
  out.hongos = state.hongos
  out.brilloHongos = state.hongos * (0.3 + 0.7 * noche)
  out.luciernagas = noche * vitalidad * (0.5 + 0.5 * Math.min(1, humedad / 0.5))
  out.sincronia = state.sincronia.activa
    ? Math.sin(Math.PI * clamp01(state.sincronia.tiempo / config.DURACION_SINCRONIA))
    : 0
  out.floracion = state.sincronia.activa ? 1 : smoothstep(0.7, 0.95, vitalidad)
  return out
}
