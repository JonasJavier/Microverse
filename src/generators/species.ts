import { Color, Matrix4, Quaternion, Vector3 } from 'three'
import { palette } from '../config/palette.ts'
import type { Fireflies } from './fireflies.ts'
import type { IslandShape } from './island.ts'
import type { Random } from './random.ts'
import { surfaceNormal, type Clearing, type ScatterResult } from './scatter.ts'

/**
 * Nuevas especies (jornada 16, fase 2). Cada una aparece con una condición
 * concreta del mundo, no por decoración:
 *  - **Helechos**: en la sombra del tronco, cuando el mundo está vivo y húmedo.
 *  - **Mariposas**: de día, cuando el árbol florece; vuelan entre las nubes de la copa.
 * Deterministas con el mismo `random`.
 */

export interface Ferns extends ScatterResult {
  /** Condición (0..1) a la que brota cada helecho. */
  thresholds: Float32Array
  /** Fase propia del vaivén. */
  phases: Float32Array
}

const UP = new Vector3(0, 1, 0)

/** Helechos en corona alrededor del tronco (la sombra), más densos cerca. */
export function scatterFerns(
  shape: IslandShape,
  random: Random,
  count: number,
  around: { x: number; z: number },
  clearings: readonly Clearing[] = [],
  ring: readonly [number, number] = [0.07, 0.3],
): Ferns {
  const matrices = new Float32Array(count * 16)
  const colors = new Float32Array(count * 3)
  const thresholds = new Float32Array(count)
  const phases = new Float32Array(count)
  const bosque = new Color(palette.materia.bosque)
  const musgo = new Color(palette.materia.musgo)
  const color = new Color()
  const matrix = new Matrix4()
  const position = new Vector3()
  const normal = new Vector3()
  const align = new Quaternion()
  const yaw = new Quaternion()
  const scale = new Vector3()

  let placed = 0
  for (let attempt = 0; placed < count && attempt < count * 80; attempt++) {
    const r = ring[0] + (ring[1] - ring[0]) * random.next() ** 1.3
    const theta = random.range(-Math.PI, Math.PI)
    const x = around.x + r * Math.sin(theta)
    const z = around.z + r * Math.cos(theta)
    if (!shape.contains(x, z)) continue
    if (clearings.some((c) => Math.hypot(x - c.x, z - c.z) < c.radius * 0.8)) continue

    const s = random.range(0.03, 0.055)
    surfaceNormal(shape, x, z, normal)
    normal.lerp(UP, 0.7).normalize()
    align.setFromUnitVectors(UP, normal)
    yaw.setFromAxisAngle(UP, random.range(0, Math.PI * 2))
    position.set(x, shape.topY(x, z) - s * 0.1, z)
    scale.set(s, s * random.range(0.9, 1.3), s)
    matrix.compose(position, align.multiply(yaw), scale).toArray(matrices, placed * 16)

    color.copy(bosque).lerp(musgo, random.range(0.35, 0.8))
    colors.set([color.r, color.g, color.b], placed * 3)
    // Los más cercanos al tronco (más sombra) brotan antes.
    const t = (r - ring[0]) / (ring[1] - ring[0])
    thresholds[placed] = Math.min(0.9, 0.15 + 0.6 * t + random.range(-0.06, 0.06))
    phases[placed] = random.next()
    placed++
  }
  return {
    count: placed,
    matrices: matrices.slice(0, placed * 16),
    colors: colors.slice(0, placed * 3),
    thresholds: thresholds.slice(0, placed),
    phases: phases.slice(0, placed),
  }
}

export interface Pad {
  center: { x: number; y: number; z: number }
  radii: { x: number; y: number; z: number }
}

/**
 * Mariposas: cada una tiene su nube de la copa como casa y revolotea alrededor.
 * Mismo formato que las luciérnagas (comparten la forma de volar en el shader):
 * seeds = fase, velocidad, ritmo de aleteo, umbral.
 */
export function scatterButterflies(
  pads: readonly Pad[],
  random: Random,
  count: number,
  sphereRadius = 1,
): Fireflies {
  const homes = new Float32Array(count * 4)
  const seeds = new Float32Array(count * 4)
  let placed = 0
  for (let attempt = 0; attempt < count * 20 && placed < count && pads.length > 0; attempt++) {
    const pad = pads[attempt % pads.length]!
    // Junto a la piel de la nube, por fuera: donde están las flores.
    const dx = random.range(-1.3, 1.3) * pad.radii.x
    const dz = random.range(-1.3, 1.3) * pad.radii.z
    const dy = random.range(0.6, 2.4) * pad.radii.y
    const x = pad.center.x + dx
    const y = pad.center.y + dy
    const z = pad.center.z + dz
    const flight = random.range(0.05, 0.09)
    if (Math.hypot(x, y, z) + flight > sphereRadius - 0.12) continue
    homes.set([x, y, z, flight], placed * 4)
    seeds.set(
      [
        random.next(),
        random.range(0.25, 0.5),
        // Aleteos por segundo: rápido, pero con pausas de planeo (en el shader).
        random.range(6, 9),
        0.05 + 0.85 * random.next(),
      ],
      placed * 4,
    )
    placed++
  }
  return {
    count: placed,
    homes: placed === count ? homes : homes.slice(0, placed * 4),
    seeds: placed === count ? seeds : seeds.slice(0, placed * 4),
  }
}
