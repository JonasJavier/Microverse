import { describe, expect, it } from 'vitest'
import { ambientMix, type MixInput } from './mix.ts'

const base: MixInput = {
  despertado: true,
  lluvia: 0,
  noche: 0,
  sincronia: 0,
  vitalidad: 0.5,
  luciernagas: 0,
}

describe('mezcla del audio ambiente', () => {
  it('dormido, todo en silencio', () => {
    const mix = ambientMix({ ...base, despertado: false, lluvia: 1, sincronia: 1 })
    expect(mix.drone + mix.air + mix.rain + mix.night + mix.swell).toBe(0)
  })

  it('la lluvia solo suena cuando llueve y la Sincronía solo en la Sincronía', () => {
    expect(ambientMix(base).rain).toBe(0)
    expect(ambientMix({ ...base, lluvia: 1 }).rain).toBeGreaterThan(0.2)
    expect(ambientMix(base).swell).toBe(0)
    expect(ambientMix({ ...base, sincronia: 1 }).swell).toBeGreaterThan(0.1)
  })

  it('la noche cierra el filtro y da voz a las luciérnagas', () => {
    const dia = ambientMix(base)
    const noche = ambientMix({ ...base, noche: 1, luciernagas: 1 })
    expect(noche.cutoff).toBeLessThan(dia.cutoff)
    expect(noche.night).toBeGreaterThan(0)
    expect(dia.night).toBe(0)
  })

  it('todos los niveles quedan en 0..1 y acotados (fondo, no protagonista)', () => {
    for (const noche of [0, 1]) {
      for (const lluvia of [0, 1]) {
        const mix = ambientMix({ ...base, noche, lluvia, sincronia: 1, vitalidad: 1, luciernagas: 1 })
        for (const level of [mix.drone, mix.air, mix.rain, mix.night, mix.swell]) {
          expect(level).toBeGreaterThanOrEqual(0)
          expect(level).toBeLessThanOrEqual(0.3)
        }
      }
    }
  })
})
