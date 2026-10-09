import { Quaternion, Vector3 } from 'three'
import type { BranchGraph } from './graph.ts'

/**
 * Malla de tubos a partir de un grafo de ramificación. El grafo se recorre en
 * cadenas: cada cadena sigue al hijo más grueso; los demás hijos abren cadenas
 * nuevas que nacen dentro del tubo del padre, así las uniones no tienen huecos.
 *
 * Cada vértice lleva la distancia acumulada de su nodo (atributo `distance`):
 * con ella se revela el crecimiento (`uGrowth`, jornada 7) y viajan los pulsos
 * (jornada 6).
 */
export interface TubeMeshData {
  positions: Float32Array
  normals: Float32Array
  distances: Float32Array
  indices: Uint32Array
}

interface Ring {
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
      chain.push({ position: parent.position, radius: start.radius, distance: parent.distance })
    }
    let current = start
    for (;;) {
      chain.push({ position: current.position, radius: current.radius, distance: current.distance })
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

export function buildTubes(graph: BranchGraph, radialSegments: number): TubeMeshData {
  const positions: number[] = []
  const normals: number[] = []
  const distances: number[] = []
  const indices: number[] = []

  const tangent = new Vector3()
  const previousTangent = new Vector3()
  const normal = new Vector3()
  const binormal = new Vector3()
  const radial = new Vector3()
  const turn = new Quaternion()

  for (const chain of chainsOf(graph)) {
    if (chain.length < 2) continue
    // Punta cerrada: un anillo casi nulo un poco más allá del último nodo.
    const last = chain[chain.length - 1]!
    const beforeLast = chain[chain.length - 2]!
    const end = last.position
      .clone()
      .add(tangent.subVectors(last.position, beforeLast.position).setLength(last.radius * 1.5))
    chain.push({
      position: end,
      radius: last.radius * 0.15,
      distance: last.distance + last.radius * 1.5,
    })

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
        positions.push(
          ring.position.x + radial.x * ring.radius,
          ring.position.y + radial.y * ring.radius,
          ring.position.z + radial.z * ring.radius,
        )
        normals.push(radial.x, radial.y, radial.z)
        distances.push(ring.distance)
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
    indices: new Uint32Array(indices),
  }
}
