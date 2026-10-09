import { Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { BranchGraph, computeDistances, computeRadii } from './graph.ts'
import { buildTubes } from './tubes.ts'

function fork() {
  const g = new BranchGraph()
  g.add(new Vector3(0, 0, 0), -1)
  g.add(new Vector3(0, 0.1, 0), 0)
  g.add(new Vector3(0.02, 0.2, 0), 1)
  g.add(new Vector3(-0.06, 0.16, 0.01), 1)
  g.add(new Vector3(-0.1, 0.2, 0.02), 3)
  computeDistances(g, 0)
  computeRadii(g, { tip: 0.004, exponent: 2, max: 1 })
  return g
}

describe('buildTubes', () => {
  const S = 6
  const mesh = buildTubes(fork(), S)
  const vertexCount = mesh.positions.length / 3

  it('genera atributos coherentes', () => {
    expect(mesh.normals.length).toBe(mesh.positions.length)
    expect(mesh.distances.length).toBe(vertexCount)
    // Dos cadenas: 0-1-2 (3 anillos + punta) y 1-3-4 (3 anillos + punta).
    expect(vertexCount).toBe((4 + 4) * S)
    expect(mesh.indices.length).toBe((3 + 3) * S * 6)
    expect(Math.max(...mesh.indices)).toBeLessThan(vertexCount)
  })

  it('normales unitarias y caras hacia fuera', () => {
    const a = new Vector3()
    const b = new Vector3()
    const c = new Vector3()
    const face = new Vector3()
    const n = new Vector3()
    for (let v = 0; v < vertexCount; v++) {
      expect(n.fromArray(mesh.normals, v * 3).length()).toBeCloseTo(1, 5)
    }
    for (let t = 0; t < mesh.indices.length; t += 3) {
      const [i, j, k] = [mesh.indices[t]!, mesh.indices[t + 1]!, mesh.indices[t + 2]!]
      a.fromArray(mesh.positions, i * 3)
      b.fromArray(mesh.positions, j * 3)
      c.fromArray(mesh.positions, k * 3)
      face.subVectors(b, a).cross(c.sub(a))
      if (face.lengthSq() < 1e-14) continue
      n.fromArray(mesh.normals, i * 3)
      expect(face.dot(n)).toBeGreaterThan(0)
    }
  })

  it('solo genera malla para los tramos visibles', () => {
    expect(buildTubes(fork(), S, { visible: () => false }).indices.length).toBe(0)
    // Solo la rama lateral (nodos 3 y 4): un tramo con un anillo de margen.
    const partial = buildTubes(fork(), S, { visible: (id) => id >= 3 })
    expect(partial.indices.length).toBeGreaterThan(0)
    expect(partial.indices.length).toBeLessThan(mesh.indices.length)
  })

  it('cada vértice sabe el centro de su anillo, a un radio de distancia', () => {
    const p = new Vector3()
    const c = new Vector3()
    expect(mesh.centers.length).toBe(mesh.positions.length)
    for (let v = 0; v < vertexCount; v++) {
      p.fromArray(mesh.positions, v * 3)
      c.fromArray(mesh.centers, v * 3)
      expect(p.distanceTo(c)).toBeCloseTo(mesh.thicknesses[v]!, 3)
    }
  })

  it('lleva un valor por nodo a cada vértice', () => {
    const tagged = buildTubes(fork(), S, { nodeValue: (id) => id / 10 })
    expect(tagged.nodeValues.length).toBe(tagged.positions.length / 3)
    // Float32: se compara con la misma precisión.
    expect(new Set(tagged.nodeValues)).toEqual(new Set([0, 0.1, 0.2, 0.3, 0.4].map(Math.fround)))
    expect(mesh.nodeValues.every((v) => v === 0)).toBe(true)
  })

  it('lleva la distancia acumulada de cada nodo', () => {
    expect(mesh.distances[0]).toBe(0)
    expect(Math.max(...mesh.distances)).toBeGreaterThan(0.2)
    expect(mesh.distances.every(Number.isFinite)).toBe(true)
  })
})
