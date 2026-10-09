import { describe, expect, it } from 'vitest'
import { createIslandShape } from './island.ts'
import { createRandom } from './random.ts'
import { RAIN_OPTIONS, scatterRain } from './rain.ts'

const shape = createIslandShape(createRandom('the-last-seed/isla'))
const rain = scatterRain(shape, createRandom('lluvia'), 800)

describe('scatterRain', () => {
  it('reparte las gotas pedidas, de forma determinista', () => {
    expect(rain.drops.length).toBe(800 * 4)
    expect(rain.seeds.length).toBe(800 * 4)
    expect(scatterRain(shape, createRandom('lluvia'), 800).drops).toEqual(rain.drops)
  })

  it('cada gota cae dentro del cristal, de arriba abajo', () => {
    const inner = RAIN_OPTIONS.sphereRadius - RAIN_OPTIONS.margin
    for (let i = 0; i < rain.count; i++) {
      const [x, z, top, floor] = rain.drops.subarray(i * 4, i * 4 + 4) as unknown as number[]
      expect(top).toBeGreaterThan(floor!)
      expect(Math.hypot(x!, top!, z!)).toBeLessThanOrEqual(inner + 1e-5)
      expect(Math.hypot(x!, floor!, z!)).toBeLessThanOrEqual(inner + 1e-5)
    }
  })

  it('sobre la isla, la gota llega a la superficie', () => {
    let onIsland = 0
    for (let i = 0; i < rain.count; i++) {
      const [x, z, , floor] = rain.drops.subarray(i * 4, i * 4 + 4) as unknown as number[]
      if (!shape.contains(x!, z!)) continue
      onIsland++
      expect(floor).toBeCloseTo(shape.topY(x!, z!), 5)
    }
    expect(onIsland).toBeGreaterThan(rain.count * 0.5)
  })

  it('con la lluvia parada no cae ninguna gota (umbral > 0)', () => {
    for (let i = 0; i < rain.count; i++) expect(rain.seeds[i * 4 + 3]).toBeGreaterThan(0)
  })
})
