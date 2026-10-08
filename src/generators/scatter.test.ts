import { describe, expect, it } from 'vitest'
import { createIslandShape } from './island.ts'
import { createRandom } from './random.ts'
import { scatterMoss, scatterPebbles, type Clearing } from './scatter.ts'

const shape = createIslandShape(createRandom('the-last-seed/isla'))
const clearings: Clearing[] = [
  { x: -0.024, z: -0.066, radius: 0.045 },
  { x: -0.27, z: -0.12, radius: 0.07 },
]

const positionsOf = (matrices: Float32Array) => {
  const out: [number, number, number][] = []
  for (let i = 0; i < matrices.length; i += 16)
    out.push([matrices[i + 12]!, matrices[i + 13]!, matrices[i + 14]!])
  return out
}

describe('scatterMoss', () => {
  const moss = scatterMoss(shape, createRandom('musgo'), 3000, clearings)

  it('coloca todas las instancias pedidas', () => {
    expect(moss.count).toBe(3000)
    expect(moss.matrices.length).toBe(3000 * 16)
    expect(moss.colors.length).toBe(3000 * 3)
  })

  it('es determinista', () => {
    const again = scatterMoss(shape, createRandom('musgo'), 3000, clearings)
    expect(again.matrices).toEqual(moss.matrices)
    expect(again.colors).toEqual(moss.colors)
  })

  it('solo crece sobre suelo intacto y respeta los claros', () => {
    for (const [x, , z] of positionsOf(moss.matrices)) {
      expect(shape.contains(x, z)).toBe(true)
      for (const c of clearings)
        expect(Math.hypot(x - c.x, z - c.z)).toBeGreaterThanOrEqual(c.radius)
    }
  })

  it('queda apoyado en la superficie', () => {
    for (const [x, y, z] of positionsOf(moss.matrices)) {
      const gap = shape.topY(x, z) - y
      expect(gap).toBeGreaterThanOrEqual(0)
      expect(gap).toBeLessThan(0.03)
    }
  })

  it('usa colores válidos', () => {
    expect(moss.colors.every((c) => Number.isFinite(c) && c >= 0 && c <= 1.5)).toBe(true)
  })
})

describe('scatterPebbles', () => {
  it('reparte piedras deterministas dentro de la isla', () => {
    const a = scatterPebbles(shape, createRandom('piedras'), 30, clearings)
    const b = scatterPebbles(shape, createRandom('piedras'), 30, clearings)
    expect(a.count).toBe(30)
    expect(a.matrices).toEqual(b.matrices)
    for (const [x, , z] of positionsOf(a.matrices)) expect(shape.contains(x, z)).toBe(true)
  })
})
