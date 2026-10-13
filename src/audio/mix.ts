/**
 * Mezcla del audio ambiente (jornada 13, fase 2): funciones puras que traducen
 * el estado del mundo a niveles de cada capa. Sin Web Audio aquí: así se prueba
 * con tests y el grafo de audio (AmbientAudio.ts) solo aplica números.
 *
 * Capas (todas sintetizadas, 0 KB descargados):
 *  - `drone`: acorde grave y lento, el "aire" de la sala; más oscuro de noche.
 *  - `air`: ruido muy filtrado, la brisa dentro del cristal; sube con el viento.
 *  - `rain`: ruido agudo y fino, la lluvia; sigue a la lluvia visible.
 *  - `night`: brillo alto y tenue de noche (las luciérnagas tienen voz).
 *  - `swell`: acorde claro que crece con la Sincronía.
 *  - `cutoff`: frecuencia de corte del dron (Hz): el día abre el filtro, la noche lo cierra.
 */
export interface MixInput {
  /** El mundo está despierto (antes, silencio: la semilla es el botón de inicio). */
  despertado: boolean
  /** 0..1, lluvia visible. */
  lluvia: number
  /** 0..1, noche. */
  noche: number
  /** 0 → 1 → 0, Sincronía. */
  sincronia: number
  /** 0..1, vitalidad del mundo. */
  vitalidad: number
  /** 0..1, luciérnagas en vuelo. */
  luciernagas: number
}

export interface AmbientMix {
  drone: number
  air: number
  rain: number
  night: number
  swell: number
  cutoff: number
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))

/** Nivel general: el ambiente es un fondo, nunca protagonista (contención, docs/01). */
export const MASTER_GAIN = 0.5

export function ambientMix(input: MixInput): AmbientMix {
  if (!input.despertado) {
    return { drone: 0, air: 0, rain: 0, night: 0, swell: 0, cutoff: 220 }
  }
  const noche = clamp01(input.noche)
  const vit = clamp01(input.vitalidad)
  const lluvia = clamp01(input.lluvia)
  const sync = clamp01(input.sincronia)
  return {
    // Un mundo seco suena más hueco; al cuidarlo, el dron gana cuerpo.
    drone: 0.16 + 0.1 * vit,
    air: 0.05 + 0.04 * (1 - noche),
    rain: 0.28 * lluvia,
    night: 0.07 * noche * clamp01(input.luciernagas),
    swell: 0.18 * sync,
    cutoff: 180 + 320 * (1 - noche) + 120 * vit,
  }
}
