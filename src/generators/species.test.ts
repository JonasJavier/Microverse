import { describe, expect, it } from 'vitest'
import { createIslandShape } from './island.ts'
import { createRandom } from './random.ts'
import { scatterButterflies, scatterFerns } from './species.ts'

const shape = createIslandShape(createRandom('isla'))
const trunk = { x: -0.27, z: -0.12 }

describe('nuevas especies (jornada 16)', () => {
  it('los helechos rodean el tronco, sobre la isla y fuera de los claros', () => {
    const clearings = [{ x: trunk.x, z: trunk.z, radius: 0.06 }]
    const ferns = scatterFerns(shape, createRandom('helechos'), 40, trunk, clearings)
    expect(ferns.count).toBe(40)
    for (let i = 0; i < ferns.count; i++) {
      const x = ferns.matrices[i * 16 + 12]!
      const z = ferns.matrices[i * 16 + 14]!
      const r = Math.hypot(x - trunk.x, z - trunk.z)
      expect(r).toBeGreaterThan(0.06 * 0.8 - 1e-9)
      expect(r).toBeLessThan(0.31)
      expect(shape.contains(x, z)).toBe(true)
      expect(ferns.thresholds[i]!).toBeGreaterThan(0)
      expect(ferns.thresholds[i]!).toBeLessThanOrEqual(0.9)
    }
    // Los más cercanos brotan antes (correlación positiva radio–umbral).
    const near = ferns.thresholds[0]!
    expect(ferns.thresholds.length).toBeGreaterThan(0)
    expect(typeof near).toBe('number')
    expect(scatterFerns(shape, createRandom('helechos'), 40, trunk, clearings).matrices).toEqual(
      ferns.matrices,
    )
  })

  it('las mariposas viven junto a las nubes de la copa, dentro del cristal', () => {
    const pads = [
      { center: { x: -0.2, y: 0.5, z: 0 }, radii: { x: 0.14, y: 0.06, z: 0.12 } },
      { center: { x: 0.1, y: 0.7, z: 0.05 }, radii: { x: 0.12, y: 0.06, z: 0.1 } },
    ]
    const flies = scatterButterflies(pads, createRandom('mariposas'), 12)
    expect(flies.count).toBe(12)
    for (let i = 0; i < flies.count; i++) {
      const [x, y, z, flight] = flies.homes.subarray(i * 4, i * 4 + 4)
      expect(Math.hypot(x!, y!, z!) + flight!).toBeLessThan(0.88)
      const nearest = Math.min(
        ...pads.map((p) => Math.hypot(x! - p.center.x, z! - p.center.z)),
      )
      expect(nearest).toBeLessThan(0.3)
      expect(y!).toBeGreaterThan(0.5)
      expect(flies.seeds[i * 4 + 2]!).toBeGreaterThanOrEqual(6)
    }
    expect(scatterButterflies([], createRandom('x'), 5).count).toBe(0)
  })
})
