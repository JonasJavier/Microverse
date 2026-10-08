import { describe, expect, it } from 'vitest'
import { SPHERE_RADIUS } from '../config/world.ts'
import {
  ISLAND_PARAMS,
  buildIslandMesh,
  createIslandShape,
  mergeMeshData,
  strataColor,
  type MeshData,
} from './island.ts'
import { createRandom } from './random.ts'

const SEED = 'the-last-seed/isla'
const shape = createIslandShape(createRandom(SEED))
const mesh = buildIslandMesh(shape, createRandom(SEED))

/** Normales de los triángulos no degenerados, con su centroide. */
function triangles(data: MeshData) {
  const out: { n: [number, number, number]; c: [number, number, number] }[] = []
  const p = data.positions
  for (let i = 0; i < data.indices.length; i += 3) {
    const [a, b, c] = [data.indices[i]! * 3, data.indices[i + 1]! * 3, data.indices[i + 2]! * 3]
    const e1 = [p[b]! - p[a]!, p[b + 1]! - p[a + 1]!, p[b + 2]! - p[a + 2]!]
    const e2 = [p[c]! - p[a]!, p[c + 1]! - p[a + 1]!, p[c + 2]! - p[a + 2]!]
    const n: [number, number, number] = [
      e1[1]! * e2[2]! - e1[2]! * e2[1]!,
      e1[2]! * e2[0]! - e1[0]! * e2[2]!,
      e1[0]! * e2[1]! - e1[1]! * e2[0]!,
    ]
    if (Math.hypot(...n) < 1e-10) continue
    out.push({
      n,
      c: [
        (p[a]! + p[b]! + p[c]!) / 3,
        (p[a + 1]! + p[b + 1]! + p[c + 1]!) / 3,
        (p[a + 2]! + p[b + 2]! + p[c + 2]!) / 3,
      ],
    })
  }
  return out
}

/** Fracción de triángulos que cumplen una condición. */
const share = (data: MeshData, ok: (t: ReturnType<typeof triangles>[number]) => boolean) => {
  const list = triangles(data)
  return list.filter(ok).length / list.length
}

describe('createIslandShape', () => {
  it('es determinista con la misma semilla', () => {
    const other = buildIslandMesh(createIslandShape(createRandom(SEED)), createRandom(SEED))
    expect(other.top.positions).toEqual(mesh.top.positions)
    expect(other.underside.colors).toEqual(mesh.underside.colors)
  })

  it('cambia con otra semilla', () => {
    const other = createIslandShape(createRandom('otra'))
    expect(other.topY(0.2, -0.1)).not.toBe(shape.topY(0.2, -0.1))
  })

  it('el corte de diorama queda abierto hacia la cámara', () => {
    expect(
      shape.contains(
        0.25 * Math.sin(ISLAND_PARAMS.cutCenter),
        0.25 * Math.cos(ISLAND_PARAMS.cutCenter),
      ),
    ).toBe(false)
    const behind = ISLAND_PARAMS.cutCenter + Math.PI
    expect(shape.contains(0.25 * Math.sin(behind), 0.25 * Math.cos(behind))).toBe(true)
  })

  it('la superficie superior queda siempre por encima del fondo', () => {
    for (let x = -0.6; x <= 0.6; x += 0.05) {
      for (let z = -0.6; z <= 0.6; z += 0.05) {
        if (Math.hypot(x, z) < shape.rimRadius(Math.atan2(x, z))) {
          expect(shape.topY(x, z) - shape.bottomY(x, z)).toBeGreaterThan(
            ISLAND_PARAMS.rimThickness * 0.9,
          )
        }
      }
    }
  })
})

describe('buildIslandMesh', () => {
  const parts = Object.entries(mesh) as [keyof typeof mesh, MeshData][]

  it('no tiene valores NaN', () => {
    for (const [, data] of parts) {
      expect(data.positions.every(Number.isFinite)).toBe(true)
      expect(data.colors.every(Number.isFinite)).toBe(true)
    }
  })

  it('cabe dentro de la esfera de cristal con margen', () => {
    for (const [, data] of parts) {
      for (let i = 0; i < data.positions.length; i += 3) {
        const r = Math.hypot(data.positions[i]!, data.positions[i + 1]!, data.positions[i + 2]!)
        expect(r).toBeLessThan(SPHERE_RADIUS * 0.95)
      }
    }
  })

  it('cada parte mira hacia fuera del sólido', () => {
    const [low, high] = shape.cutAngles
    expect(share(mesh.top, (t) => t.n[1] > 0)).toBe(1)
    expect(share(mesh.underside, (t) => t.n[1] < 0)).toBeGreaterThan(0.99)
    expect(share(mesh.rim, (t) => t.n[0] * t.c[0] + t.n[2] * t.c[2] > 0)).toBe(1)
    // Tangente de θ creciente: (cos θ, 0, −sin θ).
    expect(share(mesh.cutLow, (t) => t.n[0] * Math.cos(low) - t.n[2] * Math.sin(low) > 0)).toBe(1)
    expect(share(mesh.cutHigh, (t) => t.n[0] * Math.cos(high) - t.n[2] * Math.sin(high) < 0)).toBe(
      1,
    )
  })

  it('mergeMeshData conserva vértices e índices', () => {
    const merged = mergeMeshData(mesh.underside, mesh.rim)
    expect(merged.positions.length).toBe(
      mesh.underside.positions.length + mesh.rim.positions.length,
    )
    expect(merged.indices.length).toBe(mesh.underside.indices.length + mesh.rim.indices.length)
    expect(Math.max(...merged.indices)).toBe(merged.positions.length / 3 - 1)
  })
})

describe('strataColor', () => {
  it('pasa de césped en la superficie a roca en el fondo', () => {
    const surface = strataColor(0)
    const deep = strataColor(0.8)
    expect(surface.g).toBeGreaterThan(surface.r) // césped (verde)
    expect(deep.equals(strataColor(2))).toBe(true) // roca estable
    expect(surface.equals(deep)).toBe(false)
  })
})
