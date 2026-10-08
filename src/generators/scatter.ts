import { createNoise2D } from 'simplex-noise'
import { Color, Matrix4, Quaternion, Vector3 } from 'three'
import { palette } from '../config/palette.ts'
import type { IslandShape } from './island.ts'
import type { Random } from './random.ts'

/** Zona circular del suelo que debe quedar libre (semilla, tronco…). */
export interface Clearing {
  x: number
  z: number
  radius: number
}

export interface ScatterOptions {
  count: number
  /** Escala base [mín, máx]; los valores pequeños son más frecuentes. */
  scale: readonly [number, number]
  /** Aplastamiento vertical [mín, máx] (1 = sin aplastar). */
  squash: readonly [number, number]
  /** Estiramiento horizontal independiente en x/z [mín, máx] (1 = redondo). */
  stretch?: readonly [number, number]
  /** Cuánto se hunde cada instancia en el suelo, en fracciones de su escala. */
  sink: number
  /** 0..1: cuánto se aclara la densidad cerca del borde. */
  rimFalloff: number
  clearings?: readonly Clearing[]
  color: (x: number, z: number, random: Random) => Color
}

export interface ScatterResult {
  count: number
  /** Matrices 4×4 por instancia, listas para `instanceMatrix`. */
  matrices: Float32Array
  /** RGB lineal por instancia, listo para `instanceColor`. */
  colors: Float32Array
}

const UP = new Vector3(0, 1, 0)

/** Normal de la superficie superior por diferencias finitas. */
export function surfaceNormal(shape: IslandShape, x: number, z: number, out = new Vector3()) {
  const e = 0.004
  const dx = (shape.topY(x + e, z) - shape.topY(x - e, z)) / (2 * e)
  const dz = (shape.topY(x, z + e) - shape.topY(x, z - e)) / (2 * e)
  return out.set(-dx, 1, -dz).normalize()
}

/**
 * Reparte instancias sobre la superficie superior de la isla: densidad uniforme
 * por área (algo menor cerca del borde), orientadas según la pendiente, con giro
 * y tamaño aleatorios. Determinista con el mismo `random`.
 */
export function scatterOnIsland(
  shape: IslandShape,
  random: Random,
  options: ScatterOptions,
): ScatterResult {
  const matrices = new Float32Array(options.count * 16)
  const colors = new Float32Array(options.count * 3)
  const maxRadius = shape.params.radius * (1 + shape.params.rimWobble)

  const matrix = new Matrix4()
  const position = new Vector3()
  const normal = new Vector3()
  const align = new Quaternion()
  const yaw = new Quaternion()
  const scale = new Vector3()

  let placed = 0
  const maxAttempts = options.count * 40
  for (let attempt = 0; attempt < maxAttempts && placed < options.count; attempt++) {
    // Muestreo uniforme por área del disco.
    const r = maxRadius * Math.sqrt(random.next())
    const theta = random.range(-Math.PI, Math.PI)
    const x = r * Math.sin(theta)
    const z = r * Math.cos(theta)
    if (!shape.contains(x, z)) continue
    if (options.clearings?.some((c) => Math.hypot(x - c.x, z - c.z) < c.radius)) continue

    const t = r / shape.rimRadius(theta)
    const keep = 1 - options.rimFalloff * Math.max(0, (t - 0.7) / 0.3)
    if (random.next() > keep) continue

    const [sMin, sMax] = options.scale
    const s = sMin + (sMax - sMin) * random.next() ** 2
    const squash = random.range(options.squash[0], options.squash[1])
    const sx = options.stretch ? random.range(options.stretch[0], options.stretch[1]) : 1
    const sz = options.stretch ? random.range(options.stretch[0], options.stretch[1]) : 1

    surfaceNormal(shape, x, z, normal)
    align.setFromUnitVectors(UP, normal)
    yaw.setFromAxisAngle(UP, random.range(0, Math.PI * 2))
    position.set(x, shape.topY(x, z) - s * squash * options.sink, z)
    scale.set(s * sx, s * squash, s * sz)
    matrix.compose(position, align.multiply(yaw), scale)
    matrix.toArray(matrices, placed * 16)

    const c = options.color(x, z, random)
    colors[placed * 3] = c.r
    colors[placed * 3 + 1] = c.g
    colors[placed * 3 + 2] = c.b
    placed++
  }

  return {
    count: placed,
    matrices: placed === options.count ? matrices : matrices.slice(0, placed * 16),
    colors: placed === options.count ? colors : colors.slice(0, placed * 3),
  }
}

/** Musgo: almohadillas pequeñas, en manchas de Bosque a Musgo. */
export function scatterMoss(
  shape: IslandShape,
  random: Random,
  count: number,
  clearings: readonly Clearing[] = [],
): ScatterResult {
  const patches = createNoise2D(random.fork('manchas').next)
  const bosque = new Color(palette.materia.bosque)
  const musgo = new Color(palette.materia.musgo)
  const out = new Color()
  return scatterOnIsland(shape, random, {
    count,
    scale: [0.011, 0.03],
    squash: [0.45, 0.8],
    sink: 0.35,
    rimFalloff: 0.55,
    clearings,
    color: (x, z, r) => {
      const patch = 0.5 + 0.5 * patches(x * 5, z * 5)
      return out.copy(bosque).lerp(musgo, Math.min(1, 0.12 + 0.6 * patch + r.range(-0.1, 0.1)))
    },
  })
}

/** Piedras: pocas, irregulares, medio enterradas. */
export function scatterPebbles(
  shape: IslandShape,
  random: Random,
  count: number,
  clearings: readonly Clearing[] = [],
): ScatterResult {
  const roca = new Color(palette.estratos.roca)
  const arcilla = new Color(palette.estratos.arcilla)
  const out = new Color()
  return scatterOnIsland(shape, random, {
    count,
    scale: [0.012, 0.036],
    squash: [0.5, 0.85],
    stretch: [0.7, 1.3],
    sink: 0.45,
    rimFalloff: 0,
    clearings,
    color: (_x, _z, r) =>
      out.copy(roca).lerp(arcilla, r.range(0, 0.35)).multiplyScalar(r.range(0.85, 1.35)),
  })
}
