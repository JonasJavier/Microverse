import { describe, expect, it } from 'vitest'
import { createIslandShape } from './island.ts'
import { createRandom } from './random.ts'
import { findPuddles, scatterSprouts } from './vegetation.ts'

const shape = createIslandShape(createRandom('the-last-seed/isla'))
const SEED = { x: -0.024, z: -0.066 }

describe('scatterSprouts', () => {
  const sprouts = scatterSprouts(shape, createRandom('brotes'), 200, SEED)

  it('coloca los brotes sobre suelo intacto, de forma determinista', () => {
    expect(sprouts.count).toBe(200)
    expect(scatterSprouts(shape, createRandom('brotes'), 200, SEED).matrices).toEqual(
      sprouts.matrices,
    )
    for (let i = 0; i < sprouts.count; i++) {
      const x = sprouts.matrices[i * 16 + 12]!
      const z = sprouts.matrices[i * 16 + 14]!
      expect(shape.contains(x, z)).toBe(true)
    }
  })

  it('asoman primero cerca de la semilla y después hacia fuera', () => {
    const near: number[] = []
    const far: number[] = []
    for (let i = 0; i < sprouts.count; i++) {
      const x = sprouts.matrices[i * 16 + 12]!
      const z = sprouts.matrices[i * 16 + 14]!
      const d = Math.hypot(x - SEED.x, z - SEED.z)
      ;(d < 0.15 ? near : d > 0.35 ? far : []).push(sprouts.thresholds[i]!)
    }
    const mean = (a: number[]) => a.reduce((s, v) => s + v, 0) / a.length
    expect(near.length).toBeGreaterThan(10)
    expect(far.length).toBeGreaterThan(5)
    expect(mean(near)).toBeLessThan(mean(far))
    expect(Math.max(...sprouts.thresholds)).toBeLessThanOrEqual(0.85)
  })
})

describe('findPuddles', () => {
  const puddles = findPuddles(shape, createRandom('charcos'), 7)

  it('encuentra charcos separados en hondonadas de la superficie', () => {
    expect(puddles.count).toBeGreaterThanOrEqual(4)
    for (let i = 0; i < puddles.count; i++) {
      const [x, y, z, r] = puddles.spots.subarray(i * 4, i * 4 + 4) as unknown as number[]
      expect(shape.contains(x!, z!)).toBe(true)
      expect(y).toBeCloseTo(shape.topY(x!, z!), 5)
      expect(r).toBeGreaterThan(0)
      for (let j = 0; j < i; j++) {
        const ox = puddles.spots[j * 4]!
        const oz = puddles.spots[j * 4 + 2]!
        expect(Math.hypot(x! - ox, z! - oz)).toBeGreaterThanOrEqual(0.14)
      }
    }
  })

  it('es determinista', () => {
    expect(findPuddles(shape, createRandom('charcos'), 7).spots).toEqual(puddles.spots)
  })
})
