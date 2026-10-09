import { palette } from './palette.ts'

/**
 * Estudio fotográfico virtual (docs/02-direccion-de-arte.md · Entorno).
 * Una sola definición alimenta dos cosas que deben coincidir:
 *  - los Lightformers de <Environment> (iluminación PBR de la isla, la semilla, el pedestal);
 *  - los softboxes analíticos del shader del cristal (sus reflejos).
 *
 * Cada softbox es un rectángulo "en el infinito" visto desde el origen:
 * `direction` apunta del centro de la esfera hacia la luz y `halfSize` está en
 * unidades de tangente (0.5 ≈ 26.6° desde el centro del softbox hasta su borde).
 */
export interface Softbox {
  name: string
  direction: readonly [number, number, number]
  halfSize: readonly [number, number]
  /** Radio de las esquinas, en las mismas unidades que halfSize. */
  cornerRadius: number
  /** Suavidad del borde del reflejo. */
  softness: number
  color: string
  intensity: number
  /** Ganancia extra solo en el reflejo del cristal (no cambia cuánto ilumina la escena). */
  reflectionGain: number
}

export const SOFTBOXES: readonly Softbox[] = [
  {
    // Ventana cenital, algo por detrás: se refleja en ángulo rasante en el borde
    // superior (Fresnel alto) y dibuja la media luna de luz de la fotografía de producto.
    name: 'principal',
    // Jornada 4: más hacia atrás, para que la media luna suba hasta el borde
    // superior y no caiga sobre la copa del árbol.
    direction: [0.06, 1, -0.6],
    // Jornada 8: más estrecho (0,58 → 0,46) y con menos ganancia: visto de lado o
    // desde arriba, el reflejo era una barra gruesa que cruzaba la copa.
    halfSize: [0.46, 0.11],
    cornerRadius: 0.1,
    softness: 0.035,
    color: palette.luz.sol,
    intensity: 2.2,
    // Jornada 3: −20 %. La media luna enmarca; no debe competir con el árbol.
    reflectionGain: 1.6,
  },
  {
    // Tira vertical de contraluz: dibuja el borde derecho. Jornada 3: un 30 % más
    // fina y su reflejo un 37 % más tenue (1,6 → 1,0); la intensidad sube para que
    // la luz que aporta a la escena (área × intensidad) no cambie.
    name: 'contra',
    direction: [1, 0.15, -0.35],
    halfSize: [0.05, 0.95],
    cornerRadius: 0.04,
    softness: 0.03,
    color: palette.materia.reflejo,
    intensity: 2.25,
    reflectionGain: 0.45,
  },
  {
    // Relleno frío muy tenue a la izquierda.
    name: 'relleno',
    direction: [-1, 0.05, 0.25],
    halfSize: [0.05, 0.7],
    cornerRadius: 0.04,
    softness: 0.04,
    color: palette.luz.vida,
    intensity: 0.45,
    reflectionGain: 1,
  },
  {
    // Rebote del suelo: sostiene la base de la esfera.
    name: 'rebote',
    direction: [0.1, -1, 0.3],
    halfSize: [0.6, 0.6],
    cornerRadius: 0.3,
    softness: 0.25,
    color: palette.materia.bosque,
    intensity: 0.3,
    reflectionGain: 1,
  },
]

/**
 * Luz direccional que modela la isla (sombras y volumen). Va separada de los
 * softboxes: el reflejo del cristal pide luz cenital, el volumen pide luz lateral.
 */
export const KEY_LIGHT = {
  direction: [-0.6, 0.75, 0.55] as const,
  intensity: 1.1,
  color: palette.luz.sol,
}

/**
 * Relleno frío desde la derecha, opuesto a la luz principal cálida (esquema de
 * retrato: principal cálida, relleno frío). Abre la cara del corte que mira en
 * contra de la principal. No proyecta sombras ni se refleja en el cristal.
 */
export const FILL_LIGHT = {
  direction: [0.85, 0.25, 0.6] as const,
  intensity: 0.75,
  color: palette.materia.reflejo,
}

/** Distancia a la que se colocan los Lightformers equivalentes. */
export const LIGHTFORMER_DISTANCE = 6
