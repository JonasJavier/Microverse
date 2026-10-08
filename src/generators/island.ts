import { createNoise2D, createNoise3D, type NoiseFunction2D } from 'simplex-noise'
import { Color } from 'three'
import { palette } from '../config/palette.ts'
import type { Random } from './random.ts'

/**
 * Isla flotante con corte de diorama (ADR-008): un disco de tierra con cúpula
 * suave, una banda de borde y un cono de roca debajo. El cuadrante frontal se
 * corta en limpio y muestra los estratos (y, desde la jornada 3, las raíces).
 *
 * La forma se define con funciones puras (`IslandShape`) que comparten la malla,
 * el reparto del musgo y las raíces: así todo encaja sin costuras.
 *
 * Ángulos en el plano xz: θ = atan2(x, z). θ = 0 mira a +z (hacia la cámara) y
 * crece hacia +x.
 */
export interface IslandParams {
  /** Radio medio del borde. */
  radius: number
  /** Variación del radio del borde (fracción del radio). */
  rimWobble: number
  /** Altura del hombro superior del borde. */
  rimY: number
  /** Altura extra de la cúpula en el centro. */
  domeHeight: number
  /** Grosor de la banda vertical del borde. */
  rimThickness: number
  /** Profundidad del cono de roca bajo el borde. */
  depth: number
  /** Ángulo del centro del corte de diorama (rad). */
  cutCenter: number
  /** Semiapertura del corte (rad). */
  cutHalfAngle: number
}

export const ISLAND_PARAMS: IslandParams = {
  radius: 0.66,
  rimWobble: 0.06,
  rimY: -0.2,
  domeHeight: 0.08,
  rimThickness: 0.05,
  depth: 0.55,
  // Un poco hacia la derecha: el árbol (tercio izquierdo) queda sobre suelo intacto.
  cutCenter: 0.35,
  cutHalfAngle: 0.75,
}

/** Caída suave del hombro del borde (la superficie baja este tanto al llegar al borde). */
const SHOULDER = 0.035

export interface IslandShape {
  readonly params: IslandParams
  /** Ángulos de las dos caras del corte: [inferior, superior]. */
  readonly cutAngles: readonly [number, number]
  rimRadius(theta: number): number
  topY(x: number, z: number): number
  bottomY(x: number, z: number): number
  inCut(theta: number): boolean
  /** Dentro del borde y fuera del corte. */
  contains(x: number, z: number): boolean
}

export interface MeshData {
  positions: Float32Array
  colors: Float32Array
  indices: Uint32Array
}

/** Partes de la isla. El render fusiona todo el suelo (`mergeMeshData`) en una malla. */
export interface IslandMesh {
  /** Superficie superior (bajo el musgo). Normal hacia +y. */
  top: MeshData
  /** Cono de roca inferior. Normal hacia -y. */
  underside: MeshData
  /** Banda vertical del borde. Normal hacia fuera. */
  rim: MeshData
  /** Cara del corte en el ángulo inferior. Normal hacia dentro del corte (θ creciente). */
  cutLow: MeshData
  /** Cara del corte en el ángulo superior. Normal hacia dentro del corte (θ decreciente). */
  cutHigh: MeshData
}

export interface IslandResolution {
  radial: number
  angular: number
  vertical: number
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/** Diferencia angular con signo en (-π, π]. */
export const angleDelta = (a: number, b: number) => Math.atan2(Math.sin(a - b), Math.cos(a - b))

function fbm(noise: NoiseFunction2D, x: number, y: number, octaves = 3) {
  let sum = 0
  let amplitude = 0.5
  let frequency = 1
  for (let i = 0; i < octaves; i++) {
    sum += amplitude * noise(x * frequency, y * frequency)
    amplitude *= 0.5
    frequency *= 2
  }
  return sum
}

export function createIslandShape(
  random: Random,
  params: IslandParams = ISLAND_PARAMS,
): IslandShape {
  const rimNoise = createNoise2D(random.fork('borde').next)
  const topNoise = createNoise2D(random.fork('superficie').next)
  const rockNoise = createNoise2D(random.fork('roca').next)

  const rimRadius = (theta: number) =>
    params.radius *
    (1 + params.rimWobble * fbm(rimNoise, Math.cos(theta) * 1.5, Math.sin(theta) * 1.5, 2))

  /** Distancia normalizada al centro (0 centro, 1 borde). */
  const radialT = (x: number, z: number) =>
    Math.min(1, Math.hypot(x, z) / rimRadius(Math.atan2(x, z)))

  const topY = (x: number, z: number) => {
    const t = radialT(x, z)
    const dome = params.domeHeight * (1 - t * t)
    const bumps = 0.02 * fbm(topNoise, x * 3.5, z * 3.5) * (1 - smoothstep(0.85, 1, t))
    return params.rimY + SHOULDER + dome + bumps - SHOULDER * smoothstep(0.8, 1, t)
  }

  const bottomY = (x: number, z: number) => {
    const t = radialT(x, z)
    const cone = params.depth * Math.pow(1 - t, 0.85)
    const rock = 0.045 * fbm(rockNoise, x * 4 + 7.3, z * 4 - 2.1) * (1 - smoothstep(0.8, 1, t))
    return params.rimY - params.rimThickness - cone + rock
  }

  const inCut = (theta: number) =>
    Math.abs(angleDelta(theta, params.cutCenter)) < params.cutHalfAngle

  return {
    params,
    cutAngles: [params.cutCenter - params.cutHalfAngle, params.cutCenter + params.cutHalfAngle],
    rimRadius,
    topY,
    bottomY,
    inCut,
    contains: (x, z) => {
      const theta = Math.atan2(x, z)
      return Math.hypot(x, z) < rimRadius(theta) && !inCut(theta)
    },
  }
}

// ---------------------------------------------------------------------------
// Malla
// ---------------------------------------------------------------------------

type Vec3 = [number, number, number]

class MeshBuilder {
  private positions: number[] = []
  private colors: number[] = []
  private indices: number[] = []

  /**
   * Rejilla de (rows+1)×(cols+1) vértices con u = i/rows y v = j/cols.
   * Sin `flip`, la normal es (∂p/∂u) × (∂p/∂v).
   */
  grid(
    rows: number,
    cols: number,
    at: (u: number, v: number) => Vec3,
    color: (p: Vec3) => Color,
    flip = false,
  ) {
    const base = this.positions.length / 3
    for (let i = 0; i <= rows; i++) {
      for (let j = 0; j <= cols; j++) {
        const p = at(i / rows, j / cols)
        const c = color(p)
        this.positions.push(p[0], p[1], p[2])
        this.colors.push(c.r, c.g, c.b)
      }
    }
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const a = base + i * (cols + 1) + j
        const b = a + 1
        const c = a + cols + 1
        const d = c + 1
        if (flip) this.indices.push(a, b, c, b, d, c)
        else this.indices.push(a, c, b, b, c, d)
      }
    }
  }

  build(): MeshData {
    return {
      positions: new Float32Array(this.positions),
      colors: new Float32Array(this.colors),
      indices: new Uint32Array(this.indices),
    }
  }
}

const STRATA = [
  { until: 0.014, color: new Color(palette.estratos.cesped) },
  { until: 0.05, color: new Color(palette.estratos.humus) },
  { until: 0.16, color: new Color(palette.estratos.tierra) },
  { until: 0.22, color: new Color(palette.estratos.arcilla) },
  { until: 0.34, color: new Color(palette.estratos.tierraProfunda) },
  { until: Infinity, color: new Color(palette.estratos.roca) },
]

/** Color del estrato a cierta profundidad bajo la superficie (transiciones suaves). */
export function strataColor(depth: number, out = new Color()) {
  out.copy(STRATA[0]!.color)
  for (let k = 0; k < STRATA.length - 1; k++) {
    const boundary = STRATA[k]!.until
    out.lerp(STRATA[k + 1]!.color, smoothstep(boundary - 0.006, boundary + 0.006, depth))
  }
  return out
}

export const DEFAULT_RESOLUTION: IslandResolution = { radial: 40, angular: 120, vertical: 28 }

export function buildIslandMesh(
  shape: IslandShape,
  random: Random,
  resolution: IslandResolution = DEFAULT_RESOLUTION,
): IslandMesh {
  const { radial, angular, vertical } = resolution
  const [cutLow, cutHigh] = shape.cutAngles
  // Arco intacto: desde la cara superior del corte, dando la vuelta, hasta la inferior.
  const arc = 2 * Math.PI - (cutHigh - cutLow)
  const thetaAt = (v: number) => cutHigh + v * arc

  const strataNoise = createNoise3D(random.fork('estratos').next)
  const groundNoise = createNoise2D(random.fork('suelo').next)
  const scratch = new Color()
  const humus = new Color(palette.estratos.humus)
  const cesped = new Color(palette.estratos.cesped)

  const soilColor = ([x, y, z]: Vec3) => {
    // Estratos ondulados: la profundidad se perturba con ruido 3D.
    const depth = shape.topY(x, z) - y + 0.015 * strataNoise(x * 6, y * 6, z * 6)
    strataColor(depth, scratch)
    return scratch.multiplyScalar(0.92 + 0.16 * (strataNoise(x * 25, y * 25, z * 25) * 0.5 + 0.5))
  }

  const groundColor = ([x, , z]: Vec3) =>
    scratch.copy(cesped).lerp(humus, 0.5 + 0.5 * groundNoise(x * 9, z * 9))

  const polar = (r: number, theta: number, y: (x: number, z: number) => number): Vec3 => {
    const x = r * Math.sin(theta)
    const z = r * Math.cos(theta)
    return [x, y(x, z), z]
  }

  // Superficie superior: normal hacia +y.
  const top = new MeshBuilder()
  top.grid(
    radial,
    angular,
    (u, v) => {
      const theta = thetaAt(v)
      return polar(u * shape.rimRadius(theta), theta, shape.topY)
    },
    groundColor,
  )

  // Cono inferior: misma rejilla, normal hacia -y.
  const underside = new MeshBuilder()
  underside.grid(
    radial,
    angular,
    (u, v) => {
      const theta = thetaAt(v)
      return polar(u * shape.rimRadius(theta), theta, shape.bottomY)
    },
    soilColor,
    true,
  )

  // Banda del borde, de arriba (u = 0) a abajo (u = 1): normal hacia fuera.
  const rim = new MeshBuilder()
  rim.grid(
    4,
    angular,
    (u, v) => {
      const theta = thetaAt(v)
      const [x, , z] = polar(shape.rimRadius(theta), theta, () => 0)
      const yTop = shape.topY(x, z)
      return [x, yTop + (shape.bottomY(x, z) - yTop) * u, z]
    },
    soilColor,
  )

  // Caras del corte: sin flip, la normal apunta hacia θ decreciente.
  const cutFace = (theta: number, flip: boolean) => {
    const face = new MeshBuilder()
    face.grid(
      radial,
      vertical,
      (u, v) => {
        const r = u * shape.rimRadius(theta)
        const x = r * Math.sin(theta)
        const z = r * Math.cos(theta)
        const yBottom = shape.bottomY(x, z)
        return [x, yBottom + (shape.topY(x, z) - yBottom) * v, z]
      },
      soilColor,
      flip,
    )
    return face.build()
  }

  return {
    top: top.build(),
    underside: underside.build(),
    rim: rim.build(),
    cutLow: cutFace(cutLow, true),
    cutHigh: cutFace(cutHigh, false),
  }
}

/** Une varias mallas en una (una sola draw call). */
export function mergeMeshData(...parts: MeshData[]): MeshData {
  const vertexCount = parts.reduce((n, p) => n + p.positions.length / 3, 0)
  const indexCount = parts.reduce((n, p) => n + p.indices.length, 0)
  const positions = new Float32Array(vertexCount * 3)
  const colors = new Float32Array(vertexCount * 3)
  const indices = new Uint32Array(indexCount)
  let vertexOffset = 0
  let indexOffset = 0
  for (const part of parts) {
    positions.set(part.positions, vertexOffset * 3)
    colors.set(part.colors, vertexOffset * 3)
    for (let i = 0; i < part.indices.length; i++) {
      indices[indexOffset + i] = part.indices[i]! + vertexOffset
    }
    vertexOffset += part.positions.length / 3
    indexOffset += part.indices.length
  }
  return { positions, colors, indices }
}
