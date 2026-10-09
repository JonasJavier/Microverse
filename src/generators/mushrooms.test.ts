import { describe, expect, it } from 'vitest'
import { createIslandShape } from './island.ts'
import { scatterClusterMushrooms, scatterLampMushrooms } from './mushrooms.ts'
import { createRandom } from './random.ts'

const shape = createIslandShape(createRandom('isla'))
const options = {
  lamps: 6,
  clusters: 28,
  around: { x: -0.27, z: -0.12 },
  damp: [{ x: 0.1, z: 0.15 }],
  clearings: [{ x: -0.27, z: -0.12, radius: 0.06 }],
}

describe('hongos', () => {
  it('es determinista', () => {
    const a = scatterLampMushrooms(shape, createRandom('hongos'), options)
    const b = scatterLampMushrooms(shape, createRandom('hongos'), options)
    expect(a.matrices).toEqual(b.matrices)
    expect(a.thresholds).toEqual(b.thresholds)
  })

  it('los de lámpara rodean el tronco sin pisar el claro y casi siempre asoman', () => {
    const lamps = scatterLampMushrooms(shape, createRandom('hongos'), options)
    expect(lamps.count).toBe(options.lamps)
    for (let i = 0; i < lamps.count; i++) {
      const x = lamps.matrices[i * 16 + 12]!
      const z = lamps.matrices[i * 16 + 14]!
      const d = Math.hypot(x - options.around.x, z - options.around.z)
      expect(d).toBeGreaterThanOrEqual(0.06)
      expect(d).toBeLessThanOrEqual(0.17)
      expect(lamps.thresholds[i]).toBeLessThanOrEqual(0.2)
      expect(shape.contains(x, z)).toBe(true)
    }
  })

  it('los racimos asoman con el exceso de agua y caben todos en la isla', () => {
    const clusters = scatterClusterMushrooms(shape, createRandom('racimos'), options)
    expect(clusters.count).toBeGreaterThan(options.clusters * 0.6)
    expect(clusters.count).toBeLessThanOrEqual(options.clusters)
    let late = 0
    for (let i = 0; i < clusters.count; i++) {
      const x = clusters.matrices[i * 16 + 12]!
      const z = clusters.matrices[i * 16 + 14]!
      expect(shape.contains(x, z)).toBe(true)
      expect(clusters.phases[i]).toBeGreaterThanOrEqual(0)
      expect(clusters.phases[i]).toBeLessThan(1)
      if (clusters.thresholds[i]! > 0.4) late++
    }
    // Con la tierra sana (hongos ≈ 0,2) la mayoría sigue escondida.
    expect(late).toBeGreaterThan(clusters.count * 0.4)
  })
})
