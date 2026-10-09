import { Vector3 } from 'three'

/**
 * Grafo de ramificación compartido por el árbol y la red de raíces (ADR-003:
 * mismo lenguaje formal arriba y abajo).
 *
 * Es un árbol en sentido de teoría de grafos: una raíz y un único padre por nodo.
 * Los ids son estables (coinciden con el índice, en orden de creación) y el padre
 * siempre tiene un id menor que el hijo, así que no puede haber ciclos.
 */
export interface GraphNode {
  readonly id: number
  /** -1 en la raíz. */
  readonly parent: number
  readonly children: number[]
  readonly position: Vector3
  /**
   * Longitud acumulada por las conexiones desde el origen de la señal (la
   * semilla), no distancia en línea recta: los pulsos viajan por las raíces.
   */
  distance: number
  /** Radio del tubo (modelo de tuberías: ver `computeRadii`). */
  radius: number
  /** Camino principal: el nervio semilla → tronco, o el tronco del árbol. */
  readonly main: boolean
}

export class BranchGraph {
  readonly nodes: GraphNode[] = []

  add(position: Vector3, parent: number, main = false): GraphNode {
    const id = this.nodes.length
    if (parent >= id || (parent < 0 && id > 0)) {
      throw new Error(`Padre inválido ${parent} para el nodo ${id}`)
    }
    const node: GraphNode = {
      id,
      parent,
      children: [],
      position: position.clone(),
      distance: 0,
      radius: 0,
      main,
    }
    this.nodes.push(node)
    if (parent >= 0) this.nodes[parent]!.children.push(id)
    return node
  }

  get size() {
    return this.nodes.length
  }

  node(id: number): GraphNode {
    const node = this.nodes[id]
    if (!node) throw new Error(`No existe el nodo ${id}`)
    return node
  }

  /** Puntas: nodos sin hijos. */
  tips(): GraphNode[] {
    return this.nodes.filter((n) => n.children.length === 0)
  }

  /** Bifurcaciones: las "sinapsis" de la red. */
  junctions(): GraphNode[] {
    return this.nodes.filter((n) => n.children.length >= 2)
  }
}

/** Longitud acumulada desde la raíz del grafo, que arranca en `start`. */
export function computeDistances(graph: BranchGraph, start = 0) {
  for (const node of graph.nodes) {
    node.distance =
      node.parent < 0
        ? start
        : graph.node(node.parent).distance +
          node.position.distanceTo(graph.node(node.parent).position)
  }
}

export interface RadiusOptions {
  /** Radio de las puntas. */
  tip: number
  /** Exponente del modelo de tuberías: r^e = Σ r_hijo^e (Da Vinci: 2; árboles reales: 2–3). */
  exponent: number
  max: number
  /** Radio mínimo del camino principal. */
  mainMin?: number
}

/** Radios por el modelo de tuberías, de las puntas hacia la raíz. */
export function computeRadii(graph: BranchGraph, options: RadiusOptions) {
  const { tip, exponent, max, mainMin = 0 } = options
  for (let i = graph.size - 1; i >= 0; i--) {
    const node = graph.node(i)
    let r = tip
    if (node.children.length > 0) {
      let sum = 0
      for (const c of node.children) sum += graph.node(c).radius ** exponent
      r = sum ** (1 / exponent)
    }
    if (node.main) r = Math.max(r, mainMin)
    node.radius = Math.min(r, max)
  }
}

/**
 * Suaviza el trazo quebrado de la colonización: cada nodo se acerca al punto
 * medio entre su padre y la media de sus hijos. La topología no cambia.
 */
export function smoothGraph(
  graph: BranchGraph,
  iterations: number,
  strength = 0.5,
  isFixed: (node: GraphNode) => boolean = () => false,
) {
  const next = graph.nodes.map((n) => n.position.clone())
  const mean = new Vector3()
  for (let it = 0; it < iterations; it++) {
    for (const node of graph.nodes) {
      const target = next[node.id]!
      target.copy(node.position)
      if (node.parent < 0 || node.children.length === 0 || isFixed(node)) continue
      mean.set(0, 0, 0)
      for (const c of node.children) mean.add(graph.node(c).position)
      mean
        .divideScalar(node.children.length)
        .add(graph.node(node.parent).position)
        .multiplyScalar(0.5)
      target.lerp(mean, strength)
    }
    for (const node of graph.nodes) node.position.copy(next[node.id]!)
  }
}

/** Problemas estructurales del grafo (vacío si es válido). Lo usan los tests. */
export function validateGraph(graph: BranchGraph): string[] {
  const errors: string[] = []
  let roots = 0
  for (const [index, node] of graph.nodes.entries()) {
    if (node.id !== index) errors.push(`id ${node.id} en la posición ${index}`)
    if (node.parent < 0) roots++
    else {
      if (node.parent >= node.id) errors.push(`el nodo ${node.id} tiene un padre posterior`)
      if (!graph.nodes[node.parent]?.children.includes(node.id))
        errors.push(`el padre de ${node.id} no lo lista como hijo`)
    }
    for (const c of node.children) {
      if (graph.nodes[c]?.parent !== node.id) errors.push(`el hijo ${c} no apunta a ${node.id}`)
    }
    if (!node.position.toArray().every(Number.isFinite))
      errors.push(`posición no finita en ${node.id}`)
  }
  if (graph.size > 0 && roots !== 1) errors.push(`${roots} raíces (debe haber 1)`)
  const edges = graph.nodes.reduce((n, node) => n + node.children.length, 0)
  if (graph.size > 0 && edges !== graph.size - 1)
    errors.push(`${edges} aristas para ${graph.size} nodos`)
  return errors
}

/** Camino de un nodo a la raíz del grafo (incluidos ambos extremos). */
export function pathToRoot(graph: BranchGraph, id: number): number[] {
  const path = [id]
  let current = graph.node(id)
  while (current.parent >= 0) {
    path.push(current.parent)
    current = graph.node(current.parent)
  }
  return path
}
