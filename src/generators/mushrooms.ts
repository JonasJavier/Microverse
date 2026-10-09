import { Matrix4, Quaternion, Vector3 } from 'three'
import type { IslandShape } from './island.ts'
import type { Random } from './random.ts'
import { surfaceNormal, type Clearing } from './scatter.ts'

/**
 * Hongos (acto 03 · Transform, docs/02 · Vegetación y organismos). Dos familias:
 *  - **lámpara**: altos y finos, pocos, alrededor del tronco (referencia 1);
 *  - **racimos**: pequeños, en grupos de 3–5, repartidos por la isla y más
 *    densos cerca de las hondonadas (donde se encharca).
 * Cada hongo tiene un umbral de `hongos` a partir del cual asoma: los de lámpara
 * casi siempre están; los racimos crecen con el exceso de agua. Son la señal
 * viva del desequilibrio. Determinista con el mismo `random`.
 */
export interface MushroomOptions {
  lamps: number
  clusters: number
  /** Alrededor de qué punto nacen los de lámpara (la base del tronco). */
  around: { x: number; z: number }
  /** Lugares húmedos (charcos): atraen racimos. */
  damp?: readonly { x: number; z: number }[]
  clearings?: readonly Clearing[]
}

export interface Mushrooms {
  count: number
  matrices: Float32Array
  /** Por hongo: umbral de `hongos` para asomar (0..1). */
  thresholds: Float32Array
  /** Por hongo: fase del brillo (0..1). */
  phases: Float32Array
}

const UP = new Vector3(0, 1, 0)

interface Placement {
  x: number
  z: number
  scale: number
  threshold: number
}

function place(
  shape: IslandShape,
  random: Random,
  placements: Placement[],
  tilt: number,
): Mushrooms {
  const matrices = new Float32Array(placements.length * 16)
  const thresholds = new Float32Array(placements.length)
  const phases = new Float32Array(placements.length)
  const matrix = new Matrix4()
  const position = new Vector3()
  const normal = new Vector3()
  const align = new Quaternion()
  const yaw = new Quaternion()
  const lean = new Quaternion()
  const scale = new Vector3()
  placements.forEach((p, i) => {
    surfaceNormal(shape, p.x, p.z, normal)
    // Hacia la vertical, con una ligera inclinación propia: un hongo no sigue la pendiente.
    normal.lerp(UP, 0.7).normalize()
    align.setFromUnitVectors(UP, normal)
    yaw.setFromAxisAngle(UP, random.range(0, Math.PI * 2))
    lean.setFromAxisAngle(new Vector3(1, 0, 0), random.range(-tilt, tilt))
    position.set(p.x, shape.topY(p.x, p.z) - p.scale * 0.04, p.z)
    scale.setScalar(p.scale)
    matrix.compose(position, align.multiply(yaw).multiply(lean), scale)
    matrix.toArray(matrices, i * 16)
    thresholds[i] = p.threshold
    phases[i] = random.next()
  })
  return { count: placements.length, matrices, thresholds, phases }
}

const blocked = (x: number, z: number, clearings: readonly Clearing[] = []) =>
  clearings.some((c) => Math.hypot(x - c.x, z - c.z) < c.radius)

/** Hongos de lámpara: pocos, altos, en corona alrededor del tronco. */
export function scatterLampMushrooms(
  shape: IslandShape,
  random: Random,
  options: MushroomOptions,
): Mushrooms {
  const placements: Placement[] = []
  const maxAttempts = options.lamps * 40
  for (let attempt = 0; attempt < maxAttempts && placements.length < options.lamps; attempt++) {
    const angle = random.range(-Math.PI, Math.PI)
    const r = random.range(0.075, 0.16)
    const x = options.around.x + Math.sin(angle) * r
    const z = options.around.z + Math.cos(angle) * r
    if (!shape.contains(x, z) || blocked(x, z, options.clearings)) continue
    if (placements.some((p) => Math.hypot(p.x - x, p.z - z) < 0.04)) continue
    placements.push({
      x,
      z,
      scale: random.range(0.05, 0.085),
      threshold: random.range(0.04, 0.2),
    })
  }
  return place(shape, random, placements, 0.18)
}

/** Racimos: grupos pequeños, más cerca de lo húmedo; asoman con el exceso de agua. */
export function scatterClusterMushrooms(
  shape: IslandShape,
  random: Random,
  options: MushroomOptions,
): Mushrooms {
  const placements: Placement[] = []
  const maxRadius = shape.params.radius * 0.85
  const groups = Math.ceil(options.clusters / 4)
  for (let g = 0, attempts = 0; g < groups && attempts < groups * 60; attempts++) {
    let x: number
    let z: number
    // La mitad de los grupos nace junto a un charco; el resto, donde caiga.
    if (options.damp?.length && random.next() < 0.5) {
      const d = options.damp[Math.floor(random.next() * options.damp.length)]!
      const a = random.range(-Math.PI, Math.PI)
      const r = random.range(0.06, 0.1)
      x = d.x + Math.sin(a) * r
      z = d.z + Math.cos(a) * r
    } else {
      const r = maxRadius * Math.sqrt(random.next())
      const a = random.range(-Math.PI, Math.PI)
      x = r * Math.sin(a)
      z = r * Math.cos(a)
    }
    if (!shape.contains(x, z) || blocked(x, z, options.clearings)) continue
    if (placements.some((p) => Math.hypot(p.x - x, p.z - z) < 0.07)) continue
    const size = 3 + Math.floor(random.next() * 3)
    const threshold = random.range(0.18, 0.75)
    for (let i = 0; i < size && placements.length < options.clusters; i++) {
      const a = random.range(-Math.PI, Math.PI)
      const r = random.range(0.004, 0.018)
      const px = x + Math.sin(a) * r
      const pz = z + Math.cos(a) * r
      if (!shape.contains(px, pz)) continue
      placements.push({
        x: px,
        z: pz,
        scale: random.range(0.014, 0.028),
        // Dentro del grupo, cada hongo asoma un poco después que el anterior.
        threshold: Math.min(0.9, threshold + i * 0.04),
      })
    }
    g++
  }
  return place(shape, random, placements, 0.35)
}

/**
 * Perfil (x = radio, y = altura, en unidades de la escala del hongo) para una
 * geometría de revolución. `y` va de 0 (pie) a 1 (cima del sombrero).
 */
export const LAMP_PROFILE: readonly (readonly [number, number])[] = [
  [0.075, 0],
  [0.06, 0.45],
  [0.055, 0.74],
  [0.26, 0.78],
  [0.36, 0.86],
  [0.3, 0.96],
  [0, 1.02],
]

export const CLUSTER_PROFILE: readonly (readonly [number, number])[] = [
  [0.14, 0],
  [0.11, 0.4],
  [0.12, 0.52],
  [0.5, 0.52],
  [0.6, 0.7],
  [0.42, 0.92],
  [0, 1],
]
