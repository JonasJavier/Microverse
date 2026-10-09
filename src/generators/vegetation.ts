import { Color, Matrix4, Quaternion, Vector3 } from 'three'
import { palette } from '../config/palette.ts'
import type { IslandShape } from './island.ts'
import type { Random } from './random.ts'
import { surfaceNormal, type Clearing, type ScatterResult } from './scatter.ts'

/**
 * Brotes y charcos (acto 02 · Nourish). Deterministas, con la forma de la isla.
 */

export interface Sprouts extends ScatterResult {
  /** Vitalidad a la que asoma cada brote: más baja cuanto más cerca de la semilla. */
  thresholds: Float32Array
}

const UP = new Vector3(0, 1, 0)

/**
 * Brotes: nacen alrededor de la semilla y se extienden hacia fuera a medida que
 * el mundo coge vida (el umbral crece con la distancia a la semilla).
 */
export function scatterSprouts(
  shape: IslandShape,
  random: Random,
  count: number,
  origin: { x: number; z: number },
  clearings: readonly Clearing[] = [],
): Sprouts {
  const matrices = new Float32Array(count * 16)
  const colors = new Float32Array(count * 3)
  const thresholds = new Float32Array(count)
  const bosque = new Color(palette.materia.bosque)
  const musgo = new Color(palette.materia.musgo)
  const color = new Color()
  const matrix = new Matrix4()
  const position = new Vector3()
  const normal = new Vector3()
  const align = new Quaternion()
  const yaw = new Quaternion()
  const scale = new Vector3()
  const reach = shape.params.radius

  let placed = 0
  for (let attempt = 0; placed < count && attempt < count * 60; attempt++) {
    // Más densos cerca de la semilla: el radio sigue una ley cuadrática.
    const r = reach * random.next() ** 1.6
    const theta = random.range(-Math.PI, Math.PI)
    const x = origin.x + r * Math.sin(theta)
    const z = origin.z + r * Math.cos(theta)
    if (!shape.contains(x, z)) continue
    if (clearings.some((c) => Math.hypot(x - c.x, z - c.z) < c.radius * 0.6)) continue

    const s = random.range(0.014, 0.03)
    surfaceNormal(shape, x, z, normal)
    // Un poco inclinados hacia la normal: los brotes buscan la luz, no la pendiente.
    normal.lerp(UP, 0.6).normalize()
    align.setFromUnitVectors(UP, normal)
    yaw.setFromAxisAngle(UP, random.range(0, Math.PI * 2))
    position.set(x, shape.topY(x, z) - s * 0.15, z)
    scale.set(s, s * random.range(0.9, 1.5), s)
    matrix.compose(position, align.multiply(yaw), scale).toArray(matrices, placed * 16)

    color.copy(bosque).lerp(musgo, random.range(0.55, 1))
    colors.set([color.r, color.g, color.b], placed * 3)
    thresholds[placed] = Math.min(0.85, 0.12 + 0.6 * (r / reach) + random.range(-0.05, 0.05))
    placed++
  }
  return {
    count: placed,
    matrices: matrices.slice(0, placed * 16),
    colors: colors.slice(0, placed * 3),
    thresholds: thresholds.slice(0, placed),
  }
}

export interface Puddles {
  count: number
  /** Por charco: x, y, z, radio. */
  spots: Float32Array
  /** Por charco: fase de las ondas (0..1). */
  phases: Float32Array
}

/**
 * Charcos en las hondonadas de la superficie: donde el agua se acumularía. Se
 * eligen los puntos más hundidos respecto a su entorno, separados entre sí.
 */
export function findPuddles(
  shape: IslandShape,
  random: Random,
  count: number,
  clearings: readonly Clearing[] = [],
): Puddles {
  const candidates: { x: number; z: number; depth: number }[] = []
  const ring = 0.06
  for (let i = 0; i < 600; i++) {
    const r = shape.params.radius * 0.8 * Math.sqrt(random.next())
    const theta = random.range(-Math.PI, Math.PI)
    const x = r * Math.sin(theta)
    const z = r * Math.cos(theta)
    if (!shape.contains(x, z)) continue
    // Lejos del corte y del borde: un charco en el filo se vería flotando.
    const edge = [0, 1, 2, 3, 4, 5, 6, 7].every((k) => {
      const a = (k / 8) * Math.PI * 2
      return shape.contains(x + Math.cos(a) * ring * 1.2, z + Math.sin(a) * ring * 1.2)
    })
    if (!edge) continue
    if (clearings.some((c) => Math.hypot(x - c.x, z - c.z) < c.radius + 0.03)) continue
    let around = 0
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * Math.PI * 2
      around += shape.topY(x + Math.cos(a) * ring, z + Math.sin(a) * ring)
    }
    candidates.push({ x, z, depth: around / 8 - shape.topY(x, z) })
  }
  candidates.sort((a, b) => b.depth - a.depth)

  const chosen: typeof candidates = []
  for (const c of candidates) {
    if (chosen.length >= count) break
    if (chosen.some((o) => Math.hypot(o.x - c.x, o.z - c.z) < 0.14)) continue
    chosen.push(c)
  }

  const spots = new Float32Array(chosen.length * 4)
  const phases = new Float32Array(chosen.length)
  chosen.forEach((c, i) => {
    spots.set([c.x, shape.topY(c.x, c.z), c.z, random.range(0.04, 0.07)], i * 4)
    phases[i] = random.next()
  })
  return { count: chosen.length, spots, phases }
}
