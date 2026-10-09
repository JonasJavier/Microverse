import { describe, expect, it } from 'vitest'
import { FIREFLY_OPTIONS, scatterFireflies } from './fireflies.ts'
import { createIslandShape } from './island.ts'
import { createRandom } from './random.ts'

const shape = createIslandShape(createRandom('isla'))

describe('scatterFireflies', () => {
  it('es determinista y coloca todas', () => {
    const a = scatterFireflies(shape, createRandom('luciernagas'), 60)
    const b = scatterFireflies(shape, createRandom('luciernagas'), 60)
    expect(a.count).toBe(60)
    expect(a.homes).toEqual(b.homes)
    expect(a.seeds).toEqual(b.seeds)
  })

  it('vuelan sobre la isla y dentro del cristal, con umbrales repartidos', () => {
    const f = scatterFireflies(shape, createRandom('luciernagas'), 60)
    for (let i = 0; i < f.count; i++) {
      const [x, y, z, flight] = f.homes.subarray(i * 4, i * 4 + 4)
      expect(shape.contains(x!, z!)).toBe(true)
      expect(y!).toBeGreaterThan(shape.topY(x!, z!))
      expect(Math.hypot(x!, y!, z!) + flight!).toBeLessThan(FIREFLY_OPTIONS.sphereRadius)
      const threshold = f.seeds[i * 4 + 3]!
      expect(threshold).toBeGreaterThan(0)
      expect(threshold).toBeLessThan(1)
    }
  })
})
