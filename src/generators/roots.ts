import { Vector3 } from 'three'
import { BranchGraph, computeDistances, computeRadii, smoothGraph } from './graph.ts'
import { angleDelta, type IslandShape } from './island.ts'
import type { Random } from './random.ts'
import { colonize } from './spaceColonization.ts'

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
  // a medias: `unreached` lo vigila en los tests.
  influenceRadius: 0.11,
  killDistance: 0.02,
  gravity: 0.22,
  maxIterations: 220,
  tipRadius: 0.0014,
  radiusExponent: 2.4,
  maxRadius: 0.0105,
  // Al asomar, el eje queda por encima del suelo: tiene que sobresalir del musgo.
  nerve: { radius: 0.008, sway: 0.035, waves: 2.5, emerged: -0.004, buried: 0.016 },
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
   * Fracción de atractores que la red no alcanzó. Alta significa que los
   * atractores están demasiado separados para el radio de influencia y la red
   * se queda a medias (diagnóstico para calibrar).
   */
  unreached: number
}

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

  computeDistances(graph, 0)
  computeRadii(graph, {
    tip: params.tipRadius,
    exponent: params.radiusExponent,
    max: params.maxRadius,
    mainMin: params.nerve.radius,
  })

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

  return {
    graph,
    treeNode,
    nerve,
    toTree,
    temperament,
    unreached: growth.remaining / Math.max(1, attractors.length),
  }
}
