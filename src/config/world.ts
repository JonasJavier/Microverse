/** Semilla del mundo: misma semilla → misma composición, siempre. */
export const WORLD_SEED = 'the-last-seed'

/** Radio de la esfera de cristal (unidad de escala del mundo). */
export const SPHERE_RADIUS = 1

/** Pedestal flotante: altura de su cara superior, con un hueco bajo la esfera. */
export const PEDESTAL_TOP_Y = -SPHERE_RADIUS - 0.16

/**
 * Posición de la semilla en el plano xz: justo detrás del vértice del corte de
 * diorama, sobre suelo intacto. Las raíces nacen de aquí y se ven en el corte.
 * La altura sale de la superficie de la isla (experience/world/island.ts).
 */
export const SEED_XZ: readonly [number, number] = [-0.024, -0.066]

/** Base del árbol: tercio izquierdo, sobre suelo intacto. */
export const TREE_XZ: readonly [number, number] = [-0.27, -0.12]

/** Óptica de teleobjetivo (docs/02-direccion-de-arte.md · Composición). */
export const CAMERA_FOV = 30

export const FRAMING = {
  /** En pantallas apaisadas, la esfera ocupa este porcentaje de la altura. */
  sphereHeightRatio: 0.7,
  /** En pantallas verticales, este porcentaje del ancho. */
  sphereWidthRatio: 0.85,
  /** El objetivo queda algo por debajo del centro: la esfera sube en el encuadre. */
  targetY: -0.15,
  /** Altura de la cámara respecto al objetivo, en proporción a la distancia. */
  elevation: 0.22,
} as const

/** Distancia de cámara para que la esfera llene el encuadre según el aspecto. */
export function framingDistance(aspect: number): number {
  const tanHalfFov = Math.tan((CAMERA_FOV * Math.PI) / 360)
  const byHeight = SPHERE_RADIUS / (FRAMING.sphereHeightRatio * tanHalfFov)
  const byWidth = SPHERE_RADIUS / (FRAMING.sphereWidthRatio * tanHalfFov * aspect)
  return Math.max(byHeight, byWidth)
}
