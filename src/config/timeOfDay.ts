import { palette } from './palette.ts'
import { KEY_LIGHT } from './studio.ts'

/**
 * Ciclo día/noche (docs/02-direccion-de-arte.md · Iluminación). Un único
 * parámetro `ciclo` (0 → 1) mueve toda la iluminación entre fotogramas clave.
 * Jornada 4: mañana y noche. Jornada 8: mediodía (0,35) y atardecer (0,65) con el
 * control del sol; la luz principal también se mueve (`keyDirection`).
 */
export interface TimeOfDayLook {
  /** Luz principal (con sombras). */
  keyIntensity: number
  keyColor: string
  /** De dónde viene la luz principal (desde el centro hacia la luz; se normaliza). */
  keyDirection: readonly [number, number, number]
  /** Relleno opuesto. */
  fillIntensity: number
  fillColor: string
  ambientIntensity: number
  /** Iluminación del entorno (Lightformers): `scene.environmentIntensity`. */
  environment: number
  /** Escala de los reflejos del cristal. */
  reflection: number
  /** Brillo de las raíces (emissiveIntensity). Por encima de ~1, el bloom las recoge. */
  rootGlow: number
  /** Brillo de los filamentos finos respecto al borde de las raíces maestras. */
  rootFilament: number
  /** Anillo del pedestal: Sol de día, Vida de noche. */
  ringColor: string
  ringGain: number
  /** Brillo del halo del fondo. */
  backdrop: number
}

/** 0 · Mañana cálida: Sol bajo, emisivos bajos. */
export const MANANA: TimeOfDayLook = {
  keyIntensity: 1.1,
  keyColor: palette.luz.sol,
  keyDirection: KEY_LIGHT.direction,
  fillIntensity: 0.75,
  fillColor: palette.materia.reflejo,
  ambientIntensity: 0.04,
  environment: 1,
  reflection: 1,
  rootGlow: 0.35,
  rootFilament: 0.55,
  ringColor: palette.luz.sol,
  ringGain: 1.4,
  backdrop: 1,
}

/**
 * 1 · Noche verde azulada: luna tenue teñida de Vida, emisivos al máximo. La vida
 * empieza cálida (la semilla sigue siendo Sol) y de noche se vuelve fría.
 */
export const NOCHE: TimeOfDayLook = {
  // La luna tiene que recortar la cima de las nubes: sin ella, la copa se funde
  // con el fondo y el árbol pierde la silueta.
  keyIntensity: 0.55,
  keyColor: palette.luz.vida,
  // La luna, alta y algo por detrás: recorta la copa sin aplanar la cara del corte.
  keyDirection: [-0.35, 1, -0.2],
  // Relleno y ambiente sostienen el volumen de la tierra: los estratos se
  // intuyen, no desaparecen (rúbrica del H1).
  fillIntensity: 0.4,
  fillColor: palette.materia.reflejo,
  ambientIntensity: 0.09,
  environment: 0.22,
  reflection: 0.3,
  rootGlow: 1.7,
  rootFilament: 0.7,
  ringColor: palette.luz.vida,
  ringGain: 1.1,
  backdrop: 0.55,
}

/**
 * 0,35 · Mediodía: luz alta y casi blanca, sombras cortas, materiales a plena
 * lectura (la textura de la tierra y el verde del musgo). Emisivos al mínimo.
 */
export const MEDIODIA: TimeOfDayLook = {
  keyIntensity: 1.7,
  keyColor: palette.luz.mediodia,
  keyDirection: [-0.22, 1, 0.3],
  fillIntensity: 0.55,
  fillColor: palette.materia.reflejo,
  ambientIntensity: 0.06,
  environment: 1.15,
  reflection: 1,
  rootGlow: 0.2,
  rootFilament: 0.5,
  ringColor: palette.luz.sol,
  ringGain: 1.2,
  backdrop: 1.1,
}

/**
 * 0,65 · Atardecer: Sol naranja y rasante desde atrás a la derecha (contraluz):
 * ramas recortadas, sombras largas hacia la cámara, los emisivos empiezan a subir.
 */
export const ATARDECER: TimeOfDayLook = {
  keyIntensity: 1.45,
  keyColor: palette.luz.atardecer,
  keyDirection: [0.75, 0.2, -0.55],
  // A contraluz, el relleno y el ambiente sostienen la cara del corte: los
  // estratos se leen también al atardecer.
  fillIntensity: 0.55,
  fillColor: palette.materia.reflejo,
  ambientIntensity: 0.065,
  environment: 0.8,
  reflection: 0.85,
  rootGlow: 0.6,
  rootFilament: 0.6,
  ringColor: palette.luz.atardecer,
  ringGain: 1.5,
  backdrop: 0.9,
}

/**
 * Fotogramas clave del ciclo. La noche entra entre 0,65 y 0,9 (donde el motor
 * define `noche`). El ciclo inicial del motor (0,15) cae entre la mañana y el
 * mediodía.
 */
export const TIME_KEYFRAMES: readonly { at: number; look: TimeOfDayLook }[] = [
  { at: 0, look: MANANA },
  { at: 0.35, look: MEDIODIA },
  { at: 0.65, look: ATARDECER },
  { at: 0.9, look: NOCHE },
  { at: 1, look: NOCHE },
]
