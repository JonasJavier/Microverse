import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { validateGraph } from './graph.ts'
import { createIslandShape } from './island.ts'
import { createRandom } from './random.ts'
import { TREE_PARAMS, generateTree, scatterTreeFoliage } from './tree.ts'

const shape = createIslandShape(createRandom('the-last-seed/isla'))
const BASE = new Vector3(-0.27, shape.topY(-0.27, -0.12), -0.12)
const START = 0.3
const make = () => generateTree(shape, createRandom('arbol'), BASE, START)
const tree = make()
const { graph } = tree

const positionsOf = (matrices: Float32Array) => {
  const out: Vector3[] = []
  for (let i = 0; i < matrices.length; i += 16)
    out.push(new Vector3(matrices[i + 12], matrices[i + 13], matrices[i + 14]))
  return out
}

describe('generateTree', () => {
  it('es un grafo válido que nace en la base del tronco', () => {
    expect(validateGraph(graph)).toEqual([])
    expect(graph.node(0).position.toArray()).toEqual(BASE.toArray())
    expect(graph.tips().length).toBeGreaterThan(100)
  })

  it('continúa la distancia de la red de raíces', () => {
    expect(graph.node(0).distance).toBe(START)
    for (const node of graph.nodes.slice(1))
      expect(node.distance).toBeGreaterThan(graph.node(node.parent).distance)
  })

  it('cabe en el cristal y las ramas no se meten en el suelo', () => {
    for (const node of graph.nodes) {
      expect(node.position.length() + node.radius).toBeLessThan(TREE_PARAMS.maxReach + 0.01)
      const { x, y, z } = node.position
      if (node.id > 0 && !tree.nebari.has(node.id)) expect(y).toBeGreaterThan(shape.topY(x, z))
    }
  })

  it('el tronco queda limpio: sin ramas por debajo de clearTrunk', () => {
    for (const node of graph.nodes) {
      if (node.main || tree.nebari.has(node.id)) continue
      const parent = graph.node(node.parent)
      if (parent.main)
        expect(parent.position.y - BASE.y).toBeGreaterThan(
          TREE_PARAMS.clearTrunk * TREE_PARAMS.scale,
        )
    }
  })

  it('es más grueso en la base que en las puntas', () => {
    const base = graph.node(0).radius
    expect(base).toBeGreaterThan(0.03)
    for (const tip of graph.tips()) {
      if (!tree.nebari.has(tip.id)) expect(tip.radius).toBeLessThan(base / 6)
    }
  })

  it('cada nube está sostenida por ramas', () => {
    for (const pad of tree.pads) {
      const inside = graph.nodes.filter((n) => {
        const d = n.position.clone().sub(pad.center).divide(pad.radii)
        return d.length() < 1.15
      })
      expect(inside.length).toBeGreaterThan(5)
    }
  })

  it('el nebari sale del cuello, corre por el suelo y se hunde en la tierra', () => {
    expect(tree.nebari.size).toBeGreaterThan(0)
    const tips = graph.tips().filter((n) => tree.nebari.has(n.id))
    expect(tips.length).toBe(TREE_PARAMS.nebari.count)
    for (const tip of tips) {
      const { x, y, z } = tip.position
      // La punta queda bajo la superficie: ahí sigue la red de raíces.
      expect(y).toBeLessThan(shape.topY(x, z))
      expect(Math.hypot(x - BASE.x, z - BASE.z)).toBeGreaterThan(TREE_PARAMS.nebari.length[0] * 0.9)
    }
    for (const id of tree.nebari) {
      const { x, y, z } = graph.node(id).position
      expect(y).toBeGreaterThan(shape.topY(x, z) - TREE_PARAMS.nebari.sink - 0.005)
    }
  })

  it('es determinista', () => {
    const again = make()
    expect(again.graph.nodes.map((n) => n.position.toArray())).toEqual(
      graph.nodes.map((n) => n.position.toArray()),
    )
  })
})

describe('scatterTreeFoliage', () => {
  const foliage = scatterTreeFoliage(tree, createRandom('follaje'), 3000)

  it('coloca los mechones pedidos, en las nubes y dentro del cristal', () => {
    expect(foliage.count).toBe(3000)
    for (const p of positionsOf(foliage.matrices)) {
      expect(p.length()).toBeLessThanOrEqual(TREE_PARAMS.maxReach + 1e-6)
      const inPad = tree.pads.some(
        (pad) => p.clone().sub(pad.center).divide(pad.radii).length() < 1.25,
      )
      expect(inPad).toBe(true)
    }
    expect(foliage.colors.every((c) => Number.isFinite(c) && c >= 0 && c <= 1)).toBe(true)
  })

  it('con menos mechones, cada uno es mayor', () => {
    const scaleOf = (m: Float32Array) => {
      let sum = 0
      for (let i = 0; i < m.length; i += 16) sum += Math.hypot(m[i]!, m[i + 1]!, m[i + 2]!)
      return sum / (m.length / 16)
    }
    const few = scatterTreeFoliage(tree, createRandom('follaje'), 1000)
    expect(scaleOf(few.matrices)).toBeGreaterThan(scaleOf(foliage.matrices) * 1.2)
  })

  it('es determinista', () => {
    const again = scatterTreeFoliage(tree, createRandom('follaje'), 3000)
    expect(again.matrices).toEqual(foliage.matrices)
  })
})
