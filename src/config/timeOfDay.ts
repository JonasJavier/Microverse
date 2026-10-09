import { palette } from './palette.ts'

/**
 * Ciclo día/noche (docs/02-direccion-de-arte.md · Iluminación). Un único
 * parámetro `ciclo` (0 → 1) mueve toda la iluminación entre fotogramas clave.
 * Jornada 4: mañana y noche, estáticas, para la captura del H1. El mediodía y
 * el atardecer (0,35 y 0,65) llegan con el control del sol en la jornada 8.
 */
export interface TimeOfDayLook {
  /** Luz principal (con sombras). */
  keyIntensity: number
  keyColor: string
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

export const TIME_KEYFRAMES: readonly { at: number; look: TimeOfDayLook }[] = [
  { at: 0, look: MANANA },
  { at: 1, look: NOCHE },
]
