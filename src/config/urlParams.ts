import type { QualityTier } from './quality.ts'

/**
 * Parámetros de la URL para ver la escena en un momento concreto del día, antes
 * de que exista el control del sol (jornada 8). Ejemplos:
 *   ?noche        → ciclo 1
 *   ?manana       → ciclo 0
 *   ?ciclo=0.65   → atardecer
 * Devuelve null si la URL no pide nada (el motor usa su ciclo inicial).
 */
export function cicloFromSearch(search: string): number | null {
  const params = new URLSearchParams(search)
  if (params.has('noche')) return 1
  if (params.has('manana') || params.has('dia')) return 0
  const ciclo = params.get('ciclo')
  if (ciclo === null || ciclo.trim() === '') return null
  const value = Number(ciclo)
  return Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : null
}

/** `?nuevo`: ignora el mundo guardado y empieza de cero (y lo olvida). */
export function nuevoMundoFromSearch(search: string): boolean {
  return new URLSearchParams(search).has('nuevo')
}

/**
 * `?calidad=alta|media|baja`: fija el nivel (sin adaptación) para medir cada uno
 * en dispositivos reales (jornada 11). Devuelve null si no se pide o no es válido.
 */
export function calidadFromSearch(search: string): QualityTier | null {
  const value = new URLSearchParams(search).get('calidad')?.trim().toLowerCase()
  return value === 'alta' || value === 'media' || value === 'baja' ? value : null
}

/** `?stats`: contador de rendimiento también en producción (medición en móviles). */
export function statsFromSearch(search: string): boolean {
  return new URLSearchParams(search).has('stats')
}
