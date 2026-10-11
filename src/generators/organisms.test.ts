import { describe, expect, it } from 'vitest'
import { createIslandShape } from './island.ts'
import { scatterDust, scatterSpores, sleepingCreature } from './organisms.ts'
import { createRandom } from './random.ts'

const shape = createIslandShape(createRandom('isla'))

describe('organismos ocultos', () => {
  it('las esporas flotan dentro del hueco del corte', () => {
    const spores = scatterSpores(shape, createRandom('esporas'), 40)
    expect(spores.count).toBe(40)
    for (let i = 0; i < spores.count; i++) {
      const [x, y, z] = spores.homes.subarray(i * 4, i * 4 + 3)
      expect(shape.inCut(Math.atan2(x!, z!))).toBe(true)
      expect(y!).toBeLessThan(shape.topY(x!, z!))
      expect(y!).toBeGreaterThan(shape.bottomY(x!, z!))
      expect(spores.seeds[i * 4 + 1]!).toBeLessThan(0.1)
    }
    expect(scatterSpores(shape, createRandom('esporas'), 40).homes).toEqual(spores.homes)
  })

  it('la criatura duerme bajo la roca, en el lado opuesto al corte', () => {
    const creature = sleepingCreature(shape, createRandom('criatura'))
    expect(creature.segments.length).toBeGreaterThan(8)
    expect(creature.spots.length).toBeGreaterThan(2)
    for (const [i, p] of creature.segments.entries()) {
      expect(shape.inCut(Math.atan2(p.x, p.z))).toBe(false)
      expect(p.y).toBeLessThan(shape.bottomY(p.x, p.z))
      if (i > 0) expect(creature.radii[i]!).toBeLessThanOrEqual(creature.radii[i - 1]!)
    }
  })

  it('el polvo flota en el aire del cristal, fuera de la tierra', () => {
    const dust = scatterDust(shape, createRandom('polvo'), 50)
    expect(dust.count).toBe(50)
    for (let i = 0; i < dust.count; i++) {
      const [x, y, z] = dust.homes.subarray(i * 4, i * 4 + 3)
      expect(Math.hypot(x!, y!, z!)).toBeLessThan(0.87)
      const overIsland = Math.hypot(x!, z!) < shape.rimRadius(Math.atan2(x!, z!))
      if (overIsland) {
        const inside = y! < shape.topY(x!, z!) && y! > shape.bottomY(x!, z!)
        expect(inside).toBe(false)
      }
      expect(dust.seeds[i * 4 + 1]!).toBeLessThan(0.07)
    }
    expect(scatterDust(shape, createRandom('polvo'), 50).homes).toEqual(dust.homes)
  })
})
