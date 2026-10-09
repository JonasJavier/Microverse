import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import {
  BranchGraph,
  computeDistances,
  computeRadii,
  pathToRoot,
  smoothGraph,
  validateGraph,
} from './graph.ts'

/** Y simple: raíz → 1 → 2, y 1 → 3. */
function sample() {
  const g = new BranchGraph()
  g.add(new Vector3(0, 0, 0), -1, true)
  g.add(new Vector3(0, 1, 0), 0, true)
  g.add(new Vector3(0, 2, 0), 1)
  g.add(new Vector3(1, 1, 0), 1)
  return g
}

describe('BranchGraph', () => {
  it('asigna ids estables y enlaza padres e hijos', () => {
    const g = sample()
    expect(g.nodes.map((n) => n.id)).toEqual([0, 1, 2, 3])
    expect(g.node(1).children).toEqual([2, 3])
    expect(validateGraph(g)).toEqual([])
    expect(g.tips().map((n) => n.id)).toEqual([2, 3])
    expect(g.junctions().map((n) => n.id)).toEqual([1])
  })

  it('rechaza padres que crearían ciclos o una segunda raíz', () => {
    const g = sample()
    expect(() => g.add(new Vector3(), 9)).toThrow()
    expect(() => g.add(new Vector3(), -1)).toThrow()
  })

  it('acumula la distancia por las conexiones, no en línea recta', () => {
    const g = sample()
    computeDistances(g, 10)
    expect(g.node(0).distance).toBe(10)
    expect(g.node(2).distance).toBeCloseTo(12)
    // En línea recta, el nodo 3 está a √2 de la raíz; por las conexiones, a 2.
    expect(g.node(3).distance).toBeCloseTo(12)
    expect(pathToRoot(g, 3)).toEqual([3, 1, 0])
  })

  it('calcula radios con el modelo de tuberías', () => {
    const g = sample()
    computeRadii(g, { tip: 1, exponent: 2, max: 10 })
    expect(g.node(2).radius).toBe(1)
    expect(g.node(1).radius).toBeCloseTo(Math.SQRT2)
    computeRadii(g, { tip: 1, exponent: 2, max: 1.2, mainMin: 1.1 })
    expect(g.node(1).radius).toBe(1.2)
    expect(g.node(0).radius).toBe(1.2)
  })

  it('suaviza sin mover la raíz, las puntas ni los nodos fijos', () => {
    const g = new BranchGraph()
    g.add(new Vector3(0, 0, 0), -1)
    g.add(new Vector3(1, 1, 0), 0)
    g.add(new Vector3(2, 0, 0), 1)
    smoothGraph(g, 1, 1)
    expect(g.node(1).position.toArray()).toEqual([1, 0, 0])
    expect(g.node(0).position.toArray()).toEqual([0, 0, 0])
    expect(g.node(2).position.toArray()).toEqual([2, 0, 0])
    g.node(1).position.set(1, 1, 0)
    smoothGraph(g, 1, 1, (n) => n.id === 1)
    expect(g.node(1).position.toArray()).toEqual([1, 1, 0])
  })
})
