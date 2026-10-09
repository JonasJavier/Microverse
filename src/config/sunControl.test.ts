import { describe, expect, it } from 'vitest'
import { SUN_ARC, momentoDelCiclo, sunAngle } from './sunControl.ts'

describe('control del sol', () => {
  it('el arco pasa por sus puntos y baja de forma monótona', () => {
    for (const [ciclo, degrees] of SUN_ARC) expect(sunAngle(ciclo)).toBeCloseTo(degrees)
    let previous = sunAngle(0)
    for (let c = 0.05; c <= 1; c += 0.05) {
      const angle = sunAngle(c)
      expect(angle).toBeLessThan(previous)
      previous = angle
    }
    expect(sunAngle(-1)).toBe(sunAngle(0))
    expect(sunAngle(2)).toBe(sunAngle(1))
  })

  it('describe el día con palabras', () => {
    expect(momentoDelCiclo(0.1)).toBe('mañana')
    expect(momentoDelCiclo(0.35)).toBe('mediodía')
    expect(momentoDelCiclo(0.65)).toBe('atardecer')
    expect(momentoDelCiclo(0.95)).toBe('noche')
  })
})
