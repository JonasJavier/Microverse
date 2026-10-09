import { createNoise3D } from 'simplex-noise'
import { CatmullRomCurve3, Color, Euler, Matrix4, Quaternion, Vector3 } from 'three'
import { palette } from '../config/palette.ts'
import { BranchGraph, computeDistances, computeRadii, smoothGraph } from './graph.ts'
import type { IslandShape } from './island.ts'
import type { Random } from './random.ts'
import type { ScatterResult } from './scatter.ts'
import { colonize } from './spaceColonization.ts'

type Vec3 = readonly [number, number, number]

/**
 * Árbol protagonista (ADR-003): silueta estilizada, construida en dos fases como
 * las raíces.
 *
 * 1. **Tronco** trazado a mano con una curva por puntos de control: la
 *    inclinación y el giro son una decisión de composición, no del azar.
 * 2. **Ramas** por colonización del espacio hacia 2–3 masas de copa
 *    asimétricas. Los atractores tienen huecos (ruido 3D): la copa respira.
 *
 * Las distancias continúan las de la red de raíces (`startDistance`): una señal
 * que sale de la semilla recorre el nervio y sube por el tronco sin saltos.
 */
export interface CrownMass {
  /** Centro relativo a la base del tronco. */
  center: Vec3
  radii: Vec3
  attractors: number
}

export interface TreeParams {
  /** Puntos de control del tronco, relativos a la base (el primero es la base). */
  trunk: readonly Vec3[]
  crowns: readonly CrownMass[]
  /** Por debajo de esta altura sobre la base el tronco no echa ramas. */
  clearTrunk: number
  /** Fracción de atractores descartados por los huecos de la copa. */
  gaps: number
  segmentLength: number
  influenceRadius: number
  killDistance: number
  /** Peso de la tendencia hacia arriba (hacia la luz). */
  phototropism: number
  maxIterations: number
  tipRadius: number
  radiusExponent: number
  maxRadius: number
  /** Ensanchamiento del cuello del tronco al entrar en el suelo. */
  flare: number
  /** Nada del árbol sale de esta esfera (margen con el cristal). */
  maxReach: number
  foliage: {
    perTip: number
    scale: readonly [number, number]
    spread: number
  }
}

export const TREE_PARAMS: TreeParams = {
  // Arranca inclinado hacia el centro de la isla y se endereza: una "S" suave.
  trunk: [
    [0, 0, 0],
    [0.045, 0.1, 0.015],
    [0.05, 0.2, 0.03],
    [0.02, 0.29, 0.02],
  ],
  crowns: [
    // Masa principal, alta y ancha.
    { center: [0.0, 0.47, 0.0], radii: [0.17, 0.095, 0.14], attractors: 300 },
    // Masa secundaria, más baja, hacia el centro de la isla.
    { center: [0.2, 0.37, 0.05], radii: [0.105, 0.07, 0.095], attractors: 150 },
    // Contrapeso pequeño al otro lado.
    { center: [-0.15, 0.33, -0.03], radii: [0.075, 0.055, 0.075], attractors: 80 },
  ],
  clearTrunk: 0.17,
  gaps: 0.3,
  segmentLength: 0.013,
  influenceRadius: 0.13,
  killDistance: 0.03,
  phototropism: 0.18,
  maxIterations: 160,
  tipRadius: 0.0022,
  radiusExponent: 2.3,
  maxRadius: 0.022,
  flare: 0.7,
  maxReach: 0.9,
  foliage: { perTip: 3, scale: [0.016, 0.034], spread: 0.026 },
}

export interface Tree {
  graph: BranchGraph
  /** Masas de follaje sobre las puntas, listas para instancing. */
  foliage: ScatterResult
}

/** Punto al azar dentro de un elipsoide (rechazo en la esfera unidad). */
function insideEllipsoid(random: Random, center: Vector3, radii: Vec3, out: Vector3) {
  do {
    out.set(random.range(-1, 1), random.range(-1, 1), random.range(-1, 1))
  } while (out.lengthSq() > 1)
  return out.multiply(new Vector3(...radii)).add(center)
}

function crownAttractors(random: Random, base: Vector3, params: TreeParams): Vector3[] {
  const holes = createNoise3D(random.fork('huecos').next)
  const points: Vector3[] = []
  const p = new Vector3()
  for (const crown of params.crowns) {
    const center = new Vector3(...crown.center).add(base)
    let placed = 0
    for (let attempt = 0; placed < crown.attractors && attempt < crown.attractors * 20; attempt++) {
      insideEllipsoid(random, center, crown.radii, p)
      // Huecos: el ruido 3D aparta grupos enteros de atractores, no puntos sueltos.
      const n = holes(p.x * 9, p.y * 9, p.z * 9)
      if (n < -1 + 2 * params.gaps) continue
      if (p.length() > params.maxReach - 0.04) continue
      points.push(p.clone())
      placed++
    }
  }
  return points
}

function scatterFoliage(graph: BranchGraph, random: Random, params: TreeParams): ScatterResult {
  const tips = graph.tips()
  const count = tips.length * params.foliage.perTip
  const matrices = new Float32Array(count * 16)
  const colors = new Float32Array(count * 3)
  const bosque = new Color(palette.materia.bosque)
  const musgo = new Color(palette.materia.musgo)
  const color = new Color()
  const matrix = new Matrix4()
  const position = new Vector3()
  const rotation = new Quaternion()
  const euler = new Euler()
  const scale = new Vector3()

  let minY = Infinity
  let maxY = -Infinity
  for (const tip of tips) {
    minY = Math.min(minY, tip.position.y)
    maxY = Math.max(maxY, tip.position.y)
  }

  let placed = 0
  const [sMin, sMax] = params.foliage.scale
  for (const tip of tips) {
    for (let k = 0; k < params.foliage.perTip; k++) {
      const s = sMin + (sMax - sMin) * random.next() ** 1.5
      const squash = random.range(0.65, 0.95)
      position
        .set(random.range(-1, 1), random.range(-0.4, 1), random.range(-1, 1))
        .multiplyScalar(params.foliage.spread)
        .add(tip.position)
      // Dentro del margen con el cristal.
      const reach = params.maxReach - s
      if (position.length() > reach) position.setLength(reach)
      euler.set(random.range(-0.4, 0.4), random.range(0, Math.PI * 2), random.range(-0.4, 0.4))
      rotation.setFromEuler(euler)
      scale.set(s, s * squash, s)
      matrix.compose(position, rotation, scale).toArray(matrices, placed * 16)

      // Más claro arriba (le da la luz), más oscuro y frío abajo y dentro.
      const height = (position.y - minY) / Math.max(1e-6, maxY - minY)
      color
        .copy(bosque)
        .lerp(musgo, Math.min(1, Math.max(0, 0.1 + 0.6 * height + random.range(-0.12, 0.12))))
      colors[placed * 3] = color.r
      colors[placed * 3 + 1] = color.g
      colors[placed * 3 + 2] = color.b
      placed++
    }
  }
  return { count: placed, matrices, colors }
}

export function generateTree(
  shape: IslandShape,
  random: Random,
  base: Vector3,
  startDistance: number,
  params: TreeParams = TREE_PARAMS,
): Tree {
  const graph = new BranchGraph()

  // 1. Tronco: curva por los puntos de control, con un temblor leve.
  const jitter = random.fork('tronco')
  const controls = params.trunk.map(([x, y, z], i) =>
    new Vector3(x, y, z)
      .add(
        i === 0
          ? new Vector3()
          : new Vector3(jitter.range(-1, 1), 0, jitter.range(-1, 1)).multiplyScalar(0.008),
      )
      .add(base),
  )
  const curve = new CatmullRomCurve3(controls, false, 'centripetal')
  const steps = Math.max(2, Math.ceil(curve.getLength() / params.segmentLength))
  let previous = -1
  for (const point of curve.getSpacedPoints(steps)) previous = graph.add(point, previous, true).id

  // 2. Ramas hacia las masas de copa.
  colonize(graph, crownAttractors(random.fork('copa'), base, params), {
    influenceRadius: params.influenceRadius,
    killDistance: params.killDistance,
    segmentLength: params.segmentLength,
    maxIterations: params.maxIterations,
    tropism: new Vector3(0, 1, 0),
    tropismWeight: params.phototropism,
    canGrow: (node) => node.position.y - base.y > params.clearTrunk,
    constrain: (candidate) =>
      candidate.length() < params.maxReach &&
      candidate.y > shape.topY(candidate.x, candidate.z) + 0.03,
  })

  smoothGraph(graph, 2, 0.5, (node) => node.main)
  computeDistances(graph, startDistance)
  computeRadii(graph, {
    tip: params.tipRadius,
    exponent: params.radiusExponent,
    max: params.maxRadius,
  })
  // Cuello del tronco: se ensancha al entrar en el suelo.
  for (const node of graph.nodes) {
    if (!node.main) continue
    const height = node.position.y - base.y
    node.radius *= 1 + params.flare * Math.exp(-height / 0.025)
  }

  return { graph, foliage: scatterFoliage(graph, random.fork('follaje'), params) }
}
