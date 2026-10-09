import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { BranchGraph, validateGraph } from './graph.ts'
import { createRandom } from './random.ts'
import { colonize, type ColonizationOptions } from './spaceColonization.ts'

const OPTIONS: ColonizationOptions = {
  influenceRadius: 0.3,
  killDistance: 0.05,
  segmentLength: 0.03,
  maxIterations: 200,
}

/** Nube de atractores sobre el origen. */
function cloud(seed: string, count = 200) {
  const random = createRandom(seed)
  return Array.from(
    { length: count },
    () => new Vector3(random.range(-0.4, 0.4), random.range(0.3, 1), random.range(-0.4, 0.4)),
  )
}

function grow(options = OPTIONS, attractors = cloud('nube')) {
  const graph = new BranchGraph()
  graph.add(new Vector3(0, 0, 0), -1, true)
  graph.add(new Vector3(0, 0.25, 0), 0, true)
  const result = colonize(graph, attractors, options)
  return { graph, result }
}

describe('colonize', () => {
  it('crece hacia los atractores y los consume', () => {
    const { graph, result } = grow()
    expect(result.added).toBeGreaterThan(50)
    expect(result.remaining).toBeLessThan(20)
    expect(graph.size).toBe(2 + result.added)
    const top = Math.max(...graph.nodes.map((n) => n.position.y))
    expect(top).toBeGreaterThan(0.85)
  })

  it('produce un grafo válido: conectado, sin ciclos, ids estables', () => {
    const { graph } = grow()
    expect(validateGraph(graph)).toEqual([])
  })

  it('cada segmento nuevo mide segmentLength', () => {
    const { graph } = grow()
    for (const node of graph.nodes.slice(2)) {
      const parent = graph.node(node.parent)
      expect(node.position.distanceTo(parent.position)).toBeCloseTo(OPTIONS.segmentLength, 6)
    }
  })

  it('es determinista', () => {
    const a = grow().graph.nodes.map((n) => [n.parent, ...n.position.toArray()])
    const b = grow().graph.nodes.map((n) => [n.parent, ...n.position.toArray()])
    expect(a).toEqual(b)
  })

  it('respeta la restricción y los nodos que no pueden brotar', () => {
    const { graph } = grow({
      ...OPTIONS,
      constrain: (p) => p.x <= 0.1,
      canGrow: (n) => n.id !== 0,
    })
    for (const node of graph.nodes.slice(2)) {
      expect(node.position.x).toBeLessThanOrEqual(0.1)
      expect(node.parent).not.toBe(0)
    }
  })

  it('termina aunque haya atractores inalcanzables', () => {
    const { result } = grow({ ...OPTIONS, constrain: () => false })
    expect(result.added).toBe(0)
    expect(result.iterations).toBeLessThanOrEqual(1)
  })
})
