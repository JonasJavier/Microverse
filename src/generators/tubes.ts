import { Quaternion, Vector3 } from 'three'
import type { BranchGraph } from './graph.ts'

/**
 * Malla de tubos a partir de un grafo de ramificación. El grafo se recorre en
 * cadenas: cada cadena sigue al hijo más grueso; los demás hijos abren cadenas
 * nuevas que nacen dentro del tubo del padre, así las uniones no tienen huecos.
 *
 * Cada vértice lleva la distancia acumulada de su nodo (atributo `pathDistance`):
 * con ella se revela el crecimiento (`uGrowth`, jornada 7) y viajan los pulsos
 * (jornada 6). También lleva el grosor del tubo (`thickness`): el material de
 * las raíces lo usa para distinguir raíces maestras de filamentos.
 */
export interface TubeMeshData {
  positions: Float32Array
  normals: Float32Array
  distances: Float32Array
  thicknesses: Float32Array
  /** Valor por nodo (`TubeOptions.nodeValue`; en las raíces, su carácter). 0 si no hay. */
  nodeValues: Float32Array
  indices: Uint32Array
}

export interface TubeOptions {
  /**
   * Estrías en espiral sobre las partes gruesas (corteza del tronco). Con
   * estrías, las normales radiales dejan de ser exactas: recalcularlas.
   */
  flutes?: {
    count: number
    /** Profundidad relativa al radio. */
    depth: number
    /** Por debajo de este radio no hay estrías (ramas finas lisas). */
    minRadius: number
    /** Giro de la espiral por unidad de distancia. */
    twist: number
  }
  /**
   * Nodos que se ven. Los tramos ocultos (raíces dentro del suelo macizo) no
   * generan malla, pero siguen en el grafo: los pulsos los recorren igual. Cada
   * tramo visible se alarga un anillo por cada lado para entrar en lo que lo tapa.
   */
  visible?: (id: number) => boolean
  /** Valor por nodo que viaja a cada vértice (p. ej. el carácter de cada raíz). */
  nodeValue?: (id: number) => number
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
  return t * t * (3 - 2 * t)
}

interface Ring {
  /** Nodo del grafo (en una rama lateral, el primer anillo es el del padre). */
  id: number
  position: Vector3
  radius: number
  distance: number
}

/** Cadenas del grafo: listas de anillos de la base a la punta. */
function chainsOf(graph: BranchGraph): Ring[][] {
  const chains: Ring[][] = []
  const starts = [0]
  while (starts.length > 0) {
    const start = graph.node(starts.pop()!)
    const chain: Ring[] = []
    if (start.parent >= 0) {
      // La rama lateral nace en el centro del padre, con su propio grosor.
      const parent = graph.node(start.parent)
      chain.push({
        id: parent.id,
        position: parent.position,
        radius: start.radius,
        distance: parent.distance,
      })
    }
    let current = start
    for (;;) {
      chain.push({
        id: current.id,
        position: current.position,
        radius: current.radius,
        distance: current.distance,
      })
      if (current.children.length === 0) break
      const children = current.children
        .map((c) => graph.node(c))
        .sort((a, b) => b.radius - a.radius || a.id - b.id)
      for (let k = children.length - 1; k >= 1; k--) starts.push(children[k]!.id)
      current = children[0]!
    }
    chains.push(chain)
  }
  return chains
}

/** Tramos visibles de una cadena; `tip` indica si el tramo llega a la punta. */
function visibleRuns(chain: Ring[], visible?: (id: number) => boolean) {
  if (!visible) return [{ rings: chain, tip: true }]
  const runs: { rings: Ring[]; tip: boolean }[] = []
  const shown = chain.map((ring) => visible(ring.id))
  for (let i = 0; i < chain.length; i++) {
    if (!shown[i]) continue
    let j = i
    while (j + 1 < chain.length && shown[j + 1]) j++
    const to = Math.min(chain.length - 1, j + 1)
    runs.push({ rings: chain.slice(Math.max(0, i - 1), to + 1), tip: to === chain.length - 1 })
    i = j
  }
  return runs
}

export function buildTubes(
  graph: BranchGraph,
  radialSegments: number,
  { flutes, visible, nodeValue }: TubeOptions = {},
): TubeMeshData {
  const positions: number[] = []
  const normals: number[] = []
  const distances: number[] = []
  const thicknesses: number[] = []
  const nodeValues: number[] = []
  const indices: number[] = []

  const tangent = new Vector3()
  const previousTangent = new Vector3()
  const normal = new Vector3()
  const binormal = new Vector3()
  const radial = new Vector3()
  const turn = new Quaternion()

  for (const { rings: chain, tip } of chainsOf(graph).flatMap((c) => visibleRuns(c, visible))) {
    if (chain.length < 2) continue
    if (tip) {
      // Punta cerrada: un anillo casi nulo un poco más allá del último nodo.
      const last = chain[chain.length - 1]!
      const beforeLast = chain[chain.length - 2]!
      const end = last.position
        .clone()
        .add(tangent.subVectors(last.position, beforeLast.position).setLength(last.radius * 1.5))
      chain.push({
        id: last.id,
        position: end,
        radius: last.radius * 0.15,
        distance: last.distance + last.radius * 1.5,
      })
    }

    const base = positions.length / 3
    for (let i = 0; i < chain.length; i++) {
      const ring = chain[i]!
      const ahead = chain[Math.min(i + 1, chain.length - 1)]!.position
      const behind = chain[Math.max(i - 1, 0)]!.position
      tangent.subVectors(ahead, behind).normalize()

      if (i === 0) {
        // Marco inicial: cualquier perpendicular a la tangente.
        const helper = Math.abs(tangent.y) < 0.9 ? new Vector3(0, 1, 0) : new Vector3(1, 0, 0)
        normal.crossVectors(tangent, helper).normalize()
      } else {
        // Transporte paralelo: el marco gira lo justo para seguir a la tangente,
        // sin retorcer el tubo.
        turn.setFromUnitVectors(previousTangent, tangent)
        normal.applyQuaternion(turn)
        normal.addScaledVector(tangent, -normal.dot(tangent)).normalize()
      }
      binormal.crossVectors(tangent, normal)
      previousTangent.copy(tangent)

      for (let k = 0; k < radialSegments; k++) {
        const angle = (k / radialSegments) * Math.PI * 2
        radial
          .copy(normal)
          .multiplyScalar(Math.cos(angle))
          .addScaledVector(binormal, Math.sin(angle))
        let r = ring.radius
        if (flutes) {
          // Crestas en espiral, solo donde el tubo es grueso (tronco y cuello).
          const weight = smoothstep(flutes.minRadius, flutes.minRadius * 2, r)
          r *=
            1 +
            flutes.depth * weight * Math.cos(flutes.count * angle + flutes.twist * ring.distance)
        }
        positions.push(
          ring.position.x + radial.x * r,
          ring.position.y + radial.y * r,
          ring.position.z + radial.z * r,
        )
        normals.push(radial.x, radial.y, radial.z)
        distances.push(ring.distance)
        thicknesses.push(ring.radius)
        nodeValues.push(nodeValue ? nodeValue(ring.id) : 0)
      }
    }

    // Caras hacia fuera: (∂/∂ángulo) × (∂/∂longitud) apunta en la dirección radial.
    for (let i = 0; i < chain.length - 1; i++) {
      for (let k = 0; k < radialSegments; k++) {
        const a = base + i * radialSegments + k
        const b = base + i * radialSegments + ((k + 1) % radialSegments)
        const c = a + radialSegments
        const d = b + radialSegments
        indices.push(a, b, c, b, d, c)
      }
    }
  }

  return {
    positions: new Float32Array(positions),
    normals: new Float32Array(normals),
    distances: new Float32Array(distances),
    thicknesses: new Float32Array(thicknesses),
    nodeValues: new Float32Array(nodeValues),
    indices: new Uint32Array(indices),
  }
}
