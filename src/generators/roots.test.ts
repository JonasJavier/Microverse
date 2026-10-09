import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { pathToRoot, validateGraph } from './graph.ts'
import { createIslandShape } from './island.ts'
import { createRandom } from './random.ts'
import { ROOT_PARAMS, generateRootNetwork } from './roots.ts'

const shape = createIslandShape(createRandom('the-last-seed/isla'))
const SEED = new Vector3(-0.024, shape.topY(-0.024, -0.066) + 0.019, -0.066)
const TREE = new Vector3(-0.27, shape.topY(-0.27, -0.12), -0.12)
const make = () => generateRootNetwork(shape, createRandom('raices'), SEED, TREE)
const roots = make()
const { graph } = roots

describe('generateRootNetwork', () => {
  it('es un grafo válido: una raíz, sin ciclos, ids estables', () => {
    expect(validateGraph(graph)).toEqual([])
    expect(graph.size).toBeGreaterThan(1000)
    expect(graph.junctions().length).toBeGreaterThan(100)
  })

  // Varias semillas: los parámetros deben propagar la red siempre, no por suerte.
  it.each(['raices', 'raices-b', 'raices-c'])(
    'la red se propaga por todo el suelo (semilla %s)',
    (label) => {
      const net =
        label === 'raices' ? roots : generateRootNetwork(shape, createRandom(label), SEED, TREE)
      const { reached, blocked, remaining } = net.growth
      const total = reached + blocked + remaining
      // Contabilidad del algoritmo: los bloqueados no cuentan como alcanzados.
      expect(reached / total).toBeGreaterThan(0.85)
      expect(blocked / total).toBeLessThan(0.1)
      // Comprobación geométrica independiente sobre la red terminada.
      expect(net.coverage).toBeGreaterThan(0.95)
    },
  )

  it('nace en la semilla y garantiza el camino hasta el tronco', () => {
    expect(graph.node(0).position.toArray()).toEqual(SEED.toArray())
    expect(graph.node(roots.treeNode).position.toArray()).toEqual(TREE.toArray())
    // Subiendo desde el tronco se llega a la semilla por el nervio.
    expect(pathToRoot(graph, roots.treeNode).reverse()).toEqual(roots.nerve)
    expect(roots.nerve.every((id) => graph.node(id).main)).toBe(true)
  })

  it('todos los nodos están conectados con la semilla', () => {
    for (const node of graph.nodes) expect(pathToRoot(graph, node.id).at(-1)).toBe(0)
  })

  it('acumula la distancia por las conexiones', () => {
    expect(graph.node(0).distance).toBe(0)
    for (const node of graph.nodes.slice(1)) {
      const parent = graph.node(node.parent)
      expect(node.distance - parent.distance).toBeCloseTo(
        node.position.distanceTo(parent.position),
        6,
      )
    }
  })

  it('toTree es la distancia por el grafo hasta el tronco', () => {
    const treeDistance = graph.node(roots.treeNode).distance
    expect(roots.toTree[roots.treeNode]).toBeCloseTo(0, 6)
    expect(roots.toTree[0]).toBeCloseTo(treeDistance, 5)
    for (const node of graph.nodes) {
      // Nunca más corta que la línea recta (desigualdad triangular).
      expect(roots.toTree[node.id]! + 1e-5).toBeGreaterThanOrEqual(
        node.position.distanceTo(graph.node(roots.treeNode).position),
      )
    }
  })

  it('la ramificación queda dentro del suelo macizo y fuera del corte', () => {
    for (const node of graph.nodes) {
      // Las colgantes viven fuera del suelo a propósito (tienen su propio test).
      if (node.main || roots.hanging[node.id] === 1) continue
      const { x, y, z } = node.position
      const theta = Math.atan2(x, z)
      expect(Math.hypot(x, z)).toBeLessThanOrEqual(
        shape.rimRadius(theta) - ROOT_PARAMS.rimMargin + 1e-6,
      )
      expect(y).toBeLessThanOrEqual(shape.topY(x, z) - ROOT_PARAMS.minCover + 1e-6)
      expect(y).toBeGreaterThanOrEqual(shape.bottomY(x, z) + ROOT_PARAMS.bottomMargin - 1e-6)
      if (Math.hypot(x, z) > 1e-3) expect(shape.inCut(theta)).toBe(false)
    }
  })

  it('se ven raíces en las caras del corte', () => {
    const [low, high] = shape.cutAngles
    const onFace = graph.nodes.filter((node) => {
      const { x, z } = node.position
      const r = Math.hypot(x, z)
      const gap = (face: number) => Math.abs(x * Math.cos(face) - z * Math.sin(face))
      return r > 0.05 && Math.min(gap(low), gap(high)) < node.radius
    })
    expect(onFace.length).toBeGreaterThan(200)
    // También en profundidad, no solo bajo el musgo.
    const deep = onFace.filter((n) => shape.topY(n.position.x, n.position.z) - n.position.y > 0.15)
    expect(deep.length).toBeGreaterThan(50)
  })

  it('marca como visibles el nervio y lo que aflora en el corte, nada más', () => {
    for (const id of roots.nerve) expect(roots.exposed[id]).toBe(1)
    const visible = roots.exposed.reduce((n, v) => n + v, 0)
    expect(visible).toBeGreaterThan(200)
    // La mayor parte de la red está dentro del suelo macizo: no genera malla.
    expect(visible / graph.size).toBeLessThan(0.5)
  })

  it('las raíces colgantes salen por la base, cuelgan en el vacío y se ven', () => {
    const ids = [...roots.hanging.keys()].filter((id) => roots.hanging[id] === 1)
    expect(ids.length).toBeGreaterThan(ROOT_PARAMS.hanging.count * 8)
    let tips = 0
    for (const id of ids) {
      const node = graph.node(id)
      expect(roots.exposed[id]).toBe(1)
      expect(node.radius).toBeGreaterThanOrEqual(ROOT_PARAMS.hanging.minRadius)
      const { x, y, z } = node.position
      // Dentro del cristal y, las puntas, claramente por debajo de la base.
      expect(Math.hypot(x, y, z)).toBeLessThan(0.95)
      if (node.children.length === 0) {
        tips++
        expect(y).toBeLessThan(shape.bottomY(x, z) - ROOT_PARAMS.hanging.length[0] * 0.9)
      }
    }
    expect(tips).toBe(ROOT_PARAMS.hanging.count)
  })

  it('el nervio asoma entre el musgo y se hunde', () => {
    const depths = roots.nerve.slice(1, -1).map((id) => {
      const { x, y, z } = graph.node(id).position
      return shape.topY(x, z) - y
    })
    const radius = ROOT_PARAMS.nerve.radius
    expect(depths.some((d) => d < radius * 0.6)).toBe(true)
    expect(depths.some((d) => d > radius * 1.5)).toBe(true)
  })

  it('los radios decrecen hacia las puntas', () => {
    for (const node of graph.nodes.slice(1)) {
      if (node.main || roots.hanging[node.id] === 1) continue
      expect(node.radius).toBeLessThanOrEqual(graph.node(node.parent).radius + 1e-9)
    }
  })

  it('es determinista, también el carácter de los nodos', () => {
    const again = make()
    expect(again.graph.size).toBe(graph.size)
    expect(again.graph.nodes.map((n) => n.position.toArray())).toEqual(
      graph.nodes.map((n) => n.position.toArray()),
    )
    expect(again.temperament).toEqual(roots.temperament)
  })
})
