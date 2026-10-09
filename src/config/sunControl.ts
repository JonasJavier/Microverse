/**
 * Control del sol (acto 03 · Transform). Compartido por la cápsula, el orbe
 * solar y las flechas del teclado: un solo lenguaje para mover el día.
 */

/** Píxeles de arrastre horizontal que recorren el ciclo entero (0 → 1). */
export const SUN_DRAG_PX = 360

/** Paso del ciclo por pulsación de flecha (con repetición al mantener). */
export const SUN_KEY_STEP = 0.01

/**
 * Ángulo del orbe sobre su arco (grados) por momento del ciclo: izquierda al
 * amanecer, cenit a mediodía, bajo a la derecha al atardecer y bajo el horizonte
 * de noche (coincide a grandes rasgos con la luz principal de `timeOfDay`).
 */
export const SUN_ARC: readonly (readonly [ciclo: number, degrees: number])[] = [
  [0, 165],
  [0.35, 92],
  [0.65, 18],
  [1, -28],
]

/** Ángulo (grados) del orbe para un ciclo, interpolando `SUN_ARC`. */
export function sunAngle(ciclo: number): number {
  const c = Math.min(1, Math.max(0, ciclo))
  for (let i = 0; i < SUN_ARC.length - 1; i++) {
    const [c0, a0] = SUN_ARC[i]!
    const [c1, a1] = SUN_ARC[i + 1]!
    if (c <= c1) return a0 + ((a1 - a0) * (c - c0)) / (c1 - c0)
  }
  return SUN_ARC[SUN_ARC.length - 1]![1]
}

/** El día en palabras (para el deslizador accesible; en pantalla no hay números). */
export function momentoDelCiclo(ciclo: number): string {
  if (ciclo < 0.2) return 'mañana'
  if (ciclo < 0.5) return 'mediodía'
  if (ciclo < 0.78) return 'atardecer'
  return 'noche'
}
