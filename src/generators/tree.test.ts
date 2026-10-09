import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { validateGraph } from './graph.ts'
import { createIslandShape } from './island.ts'
import { createRandom } from './random.ts'
import { TREE_PARAMS, generateTree } from './tree.ts'

const shape = createIslandShape(createRandom('the-last-seed/isla'))
const BASE = new Vector3(-0.27, shape.topY(-0.27, -0.12), -0.12)
const START = 0.3
const make = () => generateTree(shape, createRandom('arbol'), BASE, START)
const tree = make()
const { graph } = tree

describe('generateTree', () => {
  it('es un grafo válido que nace en la base del tronco', () => {
    expect(validateGraph(graph)).toEqual([])
    expect(graph.node(0).position.toArray()).toEqual(BASE.toArray())
    expect(graph.tips().length).toBeGreaterThan(60)
  })

  it('continúa la distancia de la red de raíces', () => {
    expect(graph.node(0).distance).toBe(START)
    for (const node of graph.nodes.slice(1))
      expect(node.distance).toBeGreaterThan(graph.node(node.parent).distance)
  })

  it('cabe en el cristal y no se mete en el suelo', () => {
    for (const node of graph.nodes) {
      expect(node.position.length() + node.radius).toBeLessThan(TREE_PARAMS.maxReach + 0.01)
      const { x, y, z } = node.position
      if (node.id > 0) expect(y).toBeGreaterThan(shape.topY(x, z))
    }
  })

  it('el tronco queda limpio: sin ramas por debajo de clearTrunk', () => {
    for (const node of graph.nodes) {
      if (node.main) continue
      const parent = graph.node(node.parent)
      if (parent.main) expect(parent.position.y - BASE.y).toBeGreaterThan(TREE_PARAMS.clearTrunk)
    }
  })

  it('es más grueso en la base que en las puntas', () => {
    const base = graph.node(0).radius
    expect(base).toBeGreaterThan(0.015)
    for (const tip of graph.tips()) expect(tip.radius).toBeLessThan(base / 4)
  })

  it('reparte el follaje sobre las puntas, dentro del cristal', () => {
    const { foliage } = tree
    expect(foliage.count).toBe(graph.tips().length * TREE_PARAMS.foliage.perTip)
    for (let i = 0; i < foliage.count; i++) {
      const p = new Vector3(
        foliage.matrices[i * 16 + 12],
        foliage.matrices[i * 16 + 13],
        foliage.matrices[i * 16 + 14],
      )
      expect(p.length()).toBeLessThanOrEqual(TREE_PARAMS.maxReach + 1e-6)
    }
    expect(foliage.colors.every((c) => Number.isFinite(c) && c >= 0 && c <= 1)).toBe(true)
  })

  it('es determinista', () => {
    const again = make()
    expect(again.graph.nodes.map((n) => n.position.toArray())).toEqual(
      graph.nodes.map((n) => n.position.toArray()),
    )
    expect(again.foliage.matrices).toEqual(tree.foliage.matrices)
  })
})
