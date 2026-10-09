import { Vector3 } from 'three'
import { BranchGraph, computeDistances, computeRadii, smoothGraph } from './graph.ts'
import { angleDelta, type IslandShape } from './island.ts'
import type { Random } from './random.ts'
import { colonize, measureCoverage, type ColonizationResult } from './spaceColonization.ts'

/**
 * Red de raíces: el sistema nervioso del ecosistema (docs/02-direccion-de-arte.md
 * · Subsuelo). Dos fases:
 *
 * 1. **Nervio principal**, trazado a mano: de la semilla a la base del tronco,
 *    asomando y hundiéndose en el musgo. Garantiza que la semilla y el árbol
 *    están conectados (la colonización por sí sola no lo garantiza).
 * 2. **Ramificación** por colonización del espacio desde todos los nodos, hacia
 *    atractores repartidos por el suelo y concentrados junto a las caras del
 *    corte, donde las raíces quedan a la vista.
 *
 * El grafo nace en la semilla (nodo 0), así que `distance` es la longitud que
 * recorre una señal desde la semilla. `toTree` es lo que le falta para llegar al
 * tronco por las conexiones.
 */
export interface RootParams {
  /** Atractores repartidos por el volumen del suelo. */
  volumeAttractors: number
  /** Atractores pegados a las caras del corte. */
  faceAttractors: number
  /** Profundidad bajo la superficie que la ramificación no invade. */
  minCover: number
  /** Margen sobre la base de roca. */
  bottomMargin: number
  /** Margen hacia dentro desde el borde de la isla. */
  rimMargin: number
  /** Cuánto se hunde una raíz bajo la cara del corte (menos que su radio: asoma en relieve). */
  faceInset: number
  /** Las raíces se concentran arriba: la densidad cae con esta escala de profundidad. */
  depthFalloff: number
  segmentLength: number
  influenceRadius: number
  killDistance: number
  /** Peso de la gravedad sobre la dirección de crecimiento. */
  gravity: number
  maxIterations: number
  tipRadius: number
  radiusExponent: number
  maxRadius: number
  nerve: {
    radius: number
    /** Desvío lateral máximo del nervio respecto a la línea recta. */
    sway: number
    /** Veces que el nervio asoma sobre el musgo. */
    waves: number
    /** Profundidad del eje cuando asoma (negativa: el eje queda sobre el suelo). */
    emerged: number
    /** Profundidad del eje cuando se hunde. */
    buried: number
  }
  /** Raíces colgantes (acto 04 · Discover): salen por la base y cuelgan en el vacío. */
  hanging: {
    count: number
    /** Longitud en el vacío [mín, máx]. */
    length: readonly [number, number]
    /** Desvío lateral mientras cuelgan. */
    sway: number
    /** Radio mínimo: una raíz que cuelga sola tiene que verse desde abajo. */
    minRadius: number
  }
}

export const ROOT_PARAMS: RootParams = {
  volumeAttractors: 500,
  faceAttractors: 600,
  minCover: 0.022,
  bottomMargin: 0.02,
  rimMargin: 0.035,
  faceInset: 0.0006,
  depthFalloff: 0.3,
  segmentLength: 0.011,
  // Con atractores más separados que este radio, la red no se propaga y se queda
  // a medias: `coverage` lo vigila en los tests.
  influenceRadius: 0.11,
  killDistance: 0.02,
  gravity: 0.22,
  maxIterations: 220,
  tipRadius: 0.0014,
  radiusExponent: 2.4,
  maxRadius: 0.0105,
  // Al asomar, el eje queda por encima del suelo: tiene que sobresalir del musgo.
  nerve: { radius: 0.008, sway: 0.035, waves: 2.5, emerged: -0.004, buried: 0.016 },
  hanging: { count: 7, length: [0.12, 0.26], sway: 0.03, minRadius: 0.0032 },
}

export interface RootNetwork {
  graph: BranchGraph
  /** Nodo donde se une el tronco del árbol: el final del nervio. */
  treeNode: number
  /** Ids del nervio principal, de la semilla al tronco. */
  nerve: readonly number[]
  /** Distancia por las conexiones hasta el tronco, por nodo. */
  toTree: Float32Array
  /**
   * Carácter de cada nodo para los pulsos (jornada 6): 0 = respuesta breve y
   * viva, 1 = lenta y tenue. Evita que la red parezca un circuito.
   */
  temperament: Float32Array
  /**
   * Nodos que se ven (1) u ocultos en el suelo macizo (0): el nervio y lo que
   * aflora en las caras del corte. Solo los visibles generan malla.
   */
  exposed: Uint8Array
  /** Nodos de las raíces colgantes (1): cuelgan bajo la isla, en el vacío. */
  hanging: Uint8Array
  /** Contabilidad de la colonización: alcanzados, bloqueados y pendientes. */
  growth: ColonizationResult
  /**
   * Cobertura geométrica: fracción de atractores con un nodo de la red terminada
   * a menos de `COVERAGE_RADIUS`. Baja significa que la red se quedó a medias
   * (atractores demasiado separados para el radio de influencia).
   */
  coverage: number
}

/** Distancia a la que un atractor cuenta como cubierto por la red terminada. */
export const COVERAGE_RADIUS = 0.04

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

/**
 * Lleva un punto al suelo macizo: fuera del corte (sobre la cara más cercana,
 * apenas hundido), dentro del borde y entre la base de roca y la capa de musgo.
 * Devuelve `false` si en esa columna no cabe una raíz.
 */
export function constrainToSoil(shape: IslandShape, p: Vector3, params: RootParams): boolean {
  let { x, z } = p
  const theta = Math.atan2(x, z)
  if (Math.hypot(x, z) > 1e-6 && shape.inCut(theta)) {
    const [low, high] = shape.cutAngles
    const toLow = Math.abs(angleDelta(theta, low)) < Math.abs(angleDelta(theta, high))
    const face = toLow ? low : high
    const dx = Math.sin(face)
    const dz = Math.cos(face)
    const along = Math.max(0, x * dx + z * dz)
    // Normal de la cara hacia el suelo macizo (θ decreciente en la cara baja).
    const nx = toLow ? -dz : dz
    const nz = toLow ? dx : -dx
    x = along * dx + nx * params.faceInset
    z = along * dz + nz * params.faceInset
  }
  const r = Math.hypot(x, z)
  const rim = shape.rimRadius(Math.atan2(x, z)) - params.rimMargin
  if (r > rim) {
    x *= rim / r
    z *= rim / r
  }
  const top = shape.topY(x, z) - params.minCover
  const bottom = shape.bottomY(x, z) + params.bottomMargin
  if (top <= bottom) return false
  p.set(x, Math.min(top, Math.max(bottom, p.y)), z)
  return true
}

function soilAttractors(shape: IslandShape, random: Random, params: RootParams): Vector3[] {
  const points: Vector3[] = []
  const maxRadius = shape.params.radius * (1 + shape.params.rimWobble)
  const depthKeep = (x: number, y: number, z: number) =>
    random.next() < Math.exp(-(shape.topY(x, z) - y) / params.depthFalloff)

  // Volumen: uniforme por área en planta, más denso arriba.
  for (let attempt = 0; points.length < params.volumeAttractors && attempt < 50000; attempt++) {
    const r = maxRadius * Math.sqrt(random.next())
    const theta = random.range(-Math.PI, Math.PI)
    const x = r * Math.sin(theta)
    const z = r * Math.cos(theta)
    if (!shape.contains(x, z)) continue
    const top = shape.topY(x, z) - params.minCover
    const bottom = shape.bottomY(x, z) + params.bottomMargin
    if (top <= bottom) continue
    const y = random.range(bottom, top)
    if (!depthKeep(x, y, z)) continue
    points.push(new Vector3(x, y, z))
  }

  // Caras del corte: aquí las raíces se ven. Alternan entre las dos caras.
  const [low, high] = shape.cutAngles
  for (
    let attempt = 0;
    points.length < params.volumeAttractors + params.faceAttractors && attempt < 50000;
    attempt++
  ) {
    const face = attempt % 2 === 0 ? low : high
    const along = random.range(0.02, shape.rimRadius(face) - params.rimMargin)
    const candidate = new Vector3(along * Math.sin(face), 0, along * Math.cos(face))
    const top = shape.topY(candidate.x, candidate.z) - params.minCover
    const bottom = shape.bottomY(candidate.x, candidate.z) + params.bottomMargin
    if (top <= bottom) continue
    candidate.y = random.range(bottom, top)
    if (!depthKeep(candidate.x, candidate.y, candidate.z)) continue
    // Sobre la propia cara: `constrainToSoil` lo lleva justo al lado macizo.
    candidate.x += Math.cos(face) * (face === low ? 0.001 : -0.001)
    candidate.z -= Math.sin(face) * (face === low ? 0.001 : -0.001)
    if (constrainToSoil(shape, candidate, params)) points.push(candidate)
  }
  return points
}

/** Nervio principal: de la semilla a la base del tronco, asomando entre el musgo. */
function traceNerve(
  graph: BranchGraph,
  shape: IslandShape,
  random: Random,
  seed: Vector3,
  treeBase: Vector3,
  params: RootParams,
): number[] {
  const { sway, waves, emerged, buried } = params.nerve
  const dx = treeBase.x - seed.x
  const dz = treeBase.z - seed.z
  const length = Math.hypot(dx, dz)
  // Perpendicular en planta, con el lado del desvío al azar.
  const side = random.next() < 0.5 ? -1 : 1
  const px = (-dz / length) * side
  const pz = (dx / length) * side
  const wavePhase = random.range(0, Math.PI * 2)
  const wigglePhase = random.range(0, Math.PI * 2)
  const steps = Math.max(4, Math.ceil(length / params.segmentLength))

  const ids = [graph.add(seed, -1, true).id]
  const point = new Vector3()
  for (let i = 1; i < steps; i++) {
    const t = i / steps
    const offset =
      sway * Math.sin(Math.PI * t) + 0.006 * Math.sin(Math.PI * 2 * 3 * t + wigglePhase)
    const x = seed.x + dx * t + px * offset
    const z = seed.z + dz * t + pz * offset
    const wave = 0.5 + 0.5 * Math.sin(Math.PI * 2 * waves * t + wavePhase)
    // Sale de la semilla y entra en el tronco a ras de suelo.
    const ends = smoothstep(0, 0.15, t) * smoothstep(1, 0.88, t)
    const depth = (emerged + (buried - emerged) * wave) * ends
    point.set(x, shape.topY(x, z) - depth, z)
    ids.push(graph.add(point, ids[ids.length - 1]!, true).id)
  }
  ids.push(graph.add(treeBase, ids[ids.length - 1]!, true).id)
  return ids
}

/**
 * Raíces colgantes: desde nodos de la red cercanos a la base de roca, una cadena
 * atraviesa la base y cuelga en el vacío, vencida por la gravedad y con un
 * leve balanceo. Se descubren al mirar desde abajo (acto 04). Devuelve los ids
 * de los nodos nuevos.
 */
function growHangingRoots(
  graph: BranchGraph,
  shape: IslandShape,
  random: Random,
  params: RootParams,
): number[] {
  const { count, length, sway } = params.hanging
  const rimLimit = 0.7
  // Candidatos: nodos ramificados, pegados a la base y lejos del borde y del corte.
  const candidates = graph.nodes.filter((node) => {
    if (node.main) return false
    const { x, y, z } = node.position
    const theta = Math.atan2(x, z)
    if (shape.inCut(theta) || Math.hypot(x, z) > shape.rimRadius(theta) * rimLimit) return false
    return y - shape.bottomY(x, z) < params.bottomMargin + 0.035
  })
  // Elegidos al azar pero separados entre sí: que no cuelguen en manojo.
  const chosen: typeof candidates = []
  for (let attempt = 0; attempt < candidates.length * 4 && chosen.length < count; attempt++) {
    const node = candidates[Math.floor(random.next() * candidates.length)]
    if (!node) break
    if (chosen.some((c) => c.position.distanceTo(node.position) < 0.1) || chosen.includes(node))
      continue
    chosen.push(node)
  }

  const ids: number[] = []
  const point = new Vector3()
  for (const start of chosen) {
    const { x, z } = start.position
    const exit = shape.bottomY(x, z)
    const drop = random.range(length[0], length[1])
    const phase = random.range(0, Math.PI * 2)
    // Un poco hacia fuera, como si el peso la separase del centro.
    const lean = Math.hypot(x, z) > 1e-6 ? 0.08 : 0
    const steps = Math.max(3, Math.ceil((start.position.y - exit + drop) / params.segmentLength))
    let parent = start.id
    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      const y = start.position.y - (start.position.y - exit + drop) * t
      // Solo balancea la parte que cuelga en el vacío.
      const free = Math.max(0, (exit - y) / drop)
      const wiggle = sway * free * Math.sin(phase + free * Math.PI * 1.5)
      point.set(
        x + (x / Math.max(Math.hypot(x, z), 1e-6)) * lean * free * free + wiggle,
        y,
        z + (z / Math.max(Math.hypot(x, z), 1e-6)) * lean * free * free + wiggle * 0.6,
      )
      parent = graph.add(point, parent, false).id
      ids.push(parent)
    }
  }
  return ids
}

export function generateRootNetwork(
  shape: IslandShape,
  random: Random,
  seed: Vector3,
  treeBase: Vector3,
  params: RootParams = ROOT_PARAMS,
): RootNetwork {
  const graph = new BranchGraph()
  const nerve = traceNerve(graph, shape, random.fork('nervio'), seed, treeBase, params)
  const treeNode = nerve[nerve.length - 1]!

  const attractors = soilAttractors(shape, random.fork('atractores'), params)
  const growth = colonize(graph, attractors, {
    influenceRadius: params.influenceRadius,
    killDistance: params.killDistance,
    segmentLength: params.segmentLength,
    maxIterations: params.maxIterations,
    tropism: new Vector3(0, -1, 0),
    tropismWeight: params.gravity,
    constrain: (candidate) => constrainToSoil(shape, candidate, params),
  })

  // Suavizar y volver a encajar en el suelo (el suavizado puede rozar el corte).
  smoothGraph(graph, 2, 0.5, (node) => node.main)
  for (const node of graph.nodes) if (!node.main) constrainToSoil(shape, node.position, params)

  // Colgantes: después de encajar la red en el suelo (ellas viven fuera de él).
  const hangingIds = growHangingRoots(graph, shape, random.fork('colgantes'), params)
  const hanging = new Uint8Array(graph.size)
  for (const id of hangingIds) hanging[id] = 1

  computeDistances(graph, 0)
  computeRadii(graph, {
    tip: params.tipRadius,
    exponent: params.radiusExponent,
    max: params.maxRadius,
    mainMin: params.nerve.radius,
  })
  for (const id of hangingIds) {
    const node = graph.node(id)
    node.radius = Math.max(node.radius, params.hanging.minRadius)
  }

  // Distancia al tronco: subir hasta el nervio y recorrerlo hasta el final.
  const anchor = new Int32Array(graph.size)
  const toTree = new Float32Array(graph.size)
  const treeDistance = graph.node(treeNode).distance
  for (const node of graph.nodes) {
    anchor[node.id] = node.main ? node.id : anchor[node.parent]!
    const a = graph.node(anchor[node.id]!)
    toTree[node.id] = node.distance - a.distance + (treeDistance - a.distance)
  }

  const character = random.fork('caracter')
  const temperament = new Float32Array(graph.size)
  for (let i = 0; i < graph.size; i++) temperament[i] = character.next()

  // Aflora si el tubo atraviesa una cara del corte (distancia al plano < radio).
  const [low, high] = shape.cutAngles
  const exposed = new Uint8Array(graph.size)
  for (const node of graph.nodes) {
    const { x, z } = node.position
    const onFace = [low, high].some(
      (f) =>
        Math.abs(x * Math.cos(f) - z * Math.sin(f)) < node.radius &&
        x * Math.sin(f) + z * Math.cos(f) > -node.radius,
    )
    exposed[node.id] = node.main || onFace || hanging[node.id] === 1 ? 1 : 0
  }

  return {
    graph,
    treeNode,
    nerve,
    toTree,
    temperament,
    exposed,
    hanging,
    growth,
    coverage: measureCoverage(graph, attractors, COVERAGE_RADIUS),
  }
}
