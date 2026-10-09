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
