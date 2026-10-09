import { Vector3 } from 'three'
import type { BranchGraph, GraphNode } from './graph.ts'

/**
 * Colonización del espacio (Runions, Lane y Prusinkiewicz, 2007). Unos puntos
 * atractores marcan el volumen que se quiere ocupar (la copa, el suelo); en cada
 * iteración, cada atractor tira del nodo más cercano dentro de su radio de
 * influencia, los nodos crecen un segmento hacia la media de sus atractores y los
 * atractores alcanzados desaparecen.
 *
 * Crece el grafo que recibe, a partir de todos sus nodos: así se puede trazar
 * antes un camino principal a mano (el tronco, el nervio semilla → tronco) y
 * dejar que la colonización ponga solo la ramificación orgánica.
 *
 * Determinista: el orden de atractores y nodos es fijo y no hay aleatoriedad.
 */
export interface ColonizationOptions {
  /** Distancia máxima a la que un atractor tira de un nodo. */
  influenceRadius: number
  /** Un atractor desaparece cuando un nodo llega a esta distancia. */
  killDistance: number
  segmentLength: number
  maxIterations: number
  /** Dirección preferente (la luz para las ramas, la gravedad para las raíces). */
  tropism?: Vector3
  tropismWeight?: number
  /** Corrige la posición candidata (puede mutarla); `false` la descarta. */
  constrain?: (candidate: Vector3, parent: GraphNode) => boolean
  /** Qué nodos pueden brotar (por defecto, todos). */
  canGrow?: (node: GraphNode) => boolean
}

export interface ColonizationResult {
  iterations: number
  added: number
  /** Atractores consumidos porque una rama llegó a `killDistance`. */
  reached: number
  /**
   * Atractores retirados porque solo tiraban de un nodo bloqueado. No cuentan
   * como alcanzados: para medir cobertura real, ver `measureCoverage`.
   */
  blocked: number
  /** Atractores que siguen pendientes al terminar (fuera de alcance o sin iteraciones). */
  remaining: number
}

const ALIVE = 0
const REACHED = 1
const BLOCKED = 2

/** Rejilla espacial de nodos: búsquedas de vecinos en O(1) por celda. */
class NodeGrid {
  private readonly cells = new Map<number, number[]>()

  constructor(
    private readonly cell: number,
    private readonly graph: BranchGraph,
  ) {}

  private key(ix: number, iy: number, iz: number) {
    return ((ix + 512) * 1024 + (iy + 512)) * 1024 + (iz + 512)
  }

  insert(node: GraphNode) {
    const p = node.position
    const k = this.key(
      Math.floor(p.x / this.cell),
      Math.floor(p.y / this.cell),
      Math.floor(p.z / this.cell),
    )
    const list = this.cells.get(k)
    if (list) list.push(node.id)
    else this.cells.set(k, [node.id])
  }

  /** Nodo más cercano a `p` dentro de `radius` (id -1 si no hay). */
  nearest(p: Vector3, radius: number, filter?: (node: GraphNode) => boolean) {
    const reach = Math.ceil(radius / this.cell)
    const cx = Math.floor(p.x / this.cell)
    const cy = Math.floor(p.y / this.cell)
    const cz = Math.floor(p.z / this.cell)
    let best = -1
    let bestSq = radius * radius
    for (let x = cx - reach; x <= cx + reach; x++) {
      for (let y = cy - reach; y <= cy + reach; y++) {
        for (let z = cz - reach; z <= cz + reach; z++) {
          const list = this.cells.get(this.key(x, y, z))
          if (!list) continue
          for (const id of list) {
            const node = this.graph.node(id)
            const d = node.position.distanceToSquared(p)
            // Desempate por id: el resultado no depende del orden de las celdas.
            if (d < bestSq || (d === bestSq && best >= 0 && id < best)) {
              if (filter && !filter(node)) continue
              best = id
              bestSq = d
            }
          }
        }
      }
    }
    return { id: best, distance: Math.sqrt(bestSq) }
  }
}

export function colonize(
  graph: BranchGraph,
  attractors: readonly Vector3[],
  options: ColonizationOptions,
): ColonizationResult {
  const { influenceRadius, killDistance, segmentLength, tropism, tropismWeight = 0 } = options
  const grid = new NodeGrid(influenceRadius, graph)
  for (const node of graph.nodes) grid.insert(node)

  const state = new Uint8Array(attractors.length).fill(ALIVE)
  const pull = new Map<number, Vector3>()
  /** Atractores que tiran de cada nodo en esta iteración. */
  const pullers = new Map<number, number[]>()
  const toward = new Vector3()
  const candidate = new Vector3()
  let added = 0
  let iterations = 0

  for (; iterations < options.maxIterations; iterations++) {
    pull.clear()
    pullers.clear()
    for (const [i, attractor] of attractors.entries()) {
      if (state[i] !== ALIVE) continue
      const { id, distance } = grid.nearest(attractor, influenceRadius)
      if (id < 0) continue
      if (distance < killDistance) {
        state[i] = REACHED
        continue
      }
      const node = graph.node(id)
      if (options.canGrow && !options.canGrow(node)) continue
      toward.subVectors(attractor, node.position).divideScalar(distance)
      const sum = pull.get(id)
      if (sum) {
        sum.add(toward)
        pullers.get(id)!.push(i)
      } else {
        pull.set(id, toward.clone())
        pullers.set(id, [i])
      }
    }
    if (pull.size === 0) break

    const ids = [...pull.keys()].sort((a, b) => a - b)
    for (const id of ids) {
      const direction = pull.get(id)!
      const parent = graph.node(id)
      let grew = false
      if (direction.lengthSq() > 1e-8) {
        direction.normalize()
        if (tropism) direction.addScaledVector(tropism, tropismWeight).normalize()
        candidate.copy(parent.position).addScaledVector(direction, segmentLength)
        // Un nodo atrapado entre atractores equidistantes, o empujado por la
        // restricción contra otro nodo, crecería en el mismo sitio una y otra
        // vez: se descarta si ya hay un nodo casi encima.
        grew =
          (!options.constrain || options.constrain(candidate, parent)) &&
          grid.nearest(candidate, segmentLength * 0.35).id < 0
      }
      if (grew) {
        grid.insert(graph.add(candidate, id))
        added++
      } else {
        // Nodo bloqueado: sus atractores no los puede alcanzar nadie más cerca;
        // se retiran para que no lo bloqueen en cada iteración.
        for (const i of pullers.get(id)!) state[i] = BLOCKED
      }
    }
  }

  const count = (s: number) => state.reduce((n, v) => n + (v === s ? 1 : 0), 0)
  return {
    iterations,
    added,
    reached: count(REACHED),
    blocked: count(BLOCKED),
    remaining: count(ALIVE),
  }
}

/**
 * Cobertura geométrica, independiente de la contabilidad del algoritmo: fracción
 * de atractores que tienen algún nodo del grafo terminado a menos de `radius`.
 */
export function measureCoverage(
  graph: BranchGraph,
  attractors: readonly Vector3[],
  radius: number,
): number {
  if (attractors.length === 0) return 1
  const grid = new NodeGrid(radius, graph)
  for (const node of graph.nodes) grid.insert(node)
  let covered = 0
  for (const attractor of attractors) if (grid.nearest(attractor, radius).id >= 0) covered++
  return covered / attractors.length
}
