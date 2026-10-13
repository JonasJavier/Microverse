import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from './ecosystemConfig.ts'
import { EcosystemEngine } from './EcosystemEngine.ts'
import { estacionDe, factorEstacional, nombreEstacion } from './rules.ts'

describe('estaciones (jornada 15)', () => {
  it('un mundo dormido sigue en primavera aunque pase el tiempo', () => {
    const engine = new EcosystemEngine()
    for (let i = 0; i < 5000; i++) engine.step(0.1)
    expect(engine.visuals.estacion).toBe(0)
  })

  it('la estación sale del tiempo acumulado y es cíclica', () => {
    const ano = DEFAULT_CONFIG.DURACION_ANO
    expect(estacionDe(0, ano)).toBe(0)
    expect(estacionDe(ano / 2, ano)).toBeCloseTo(0.5)
    expect(estacionDe(ano * 1.25, ano)).toBeCloseTo(0.25)
    expect(nombreEstacion(0)).toBe('primavera')
    expect(nombreEstacion(0.3)).toBe('verano')
    expect(nombreEstacion(0.5)).toBe('otoño')
    expect(nombreEstacion(0.75)).toBe('invierno')
    expect(nombreEstacion(0.95)).toBe('primavera')
  })

  it('el invierno frena el crecimiento y la primavera no', () => {
    expect(factorEstacional(0.125, 0.3)).toBeCloseTo(1)
    expect(factorEstacional(0.625, 0.3)).toBeCloseTo(0.7)
    expect(factorEstacional(0, 0)).toBe(1)
    for (let e = 0; e < 1; e += 0.05) {
      const f = factorEstacional(e, 0.3)
      expect(f).toBeGreaterThanOrEqual(0.7 - 1e-9)
      expect(f).toBeLessThanOrEqual(1 + 1e-9)
    }
  })

  it('el motor expone la estación y crece menos en invierno', () => {
    const grow = (desdeTiempo: number) => {
      const engine = new EcosystemEngine()
      engine.dispatch({ type: 'despertar' })
      // El año empieza al despertar: se adelanta el reloj desde ahí.
      ;(engine.state as { tiempo: number }).tiempo = desdeTiempo
      engine.dispatch({ type: 'lluvia', intensidad: 0.7 })
      for (let i = 0; i < 1200; i++) {
        engine.dispatch({ type: 'lluvia', intensidad: engine.state.humedad < 0.5 ? 0.7 : 0 })
        engine.step(0.1)
      }
      return engine
    }
    const primavera = grow(0)
    const invierno = grow(DEFAULT_CONFIG.DURACION_ANO * 0.7)
    expect(primavera.visuals.estacion).toBeLessThan(0.1)
    expect(invierno.visuals.estacion).toBeGreaterThan(0.7)
    expect(invierno.state.vitalidad).toBeLessThan(primavera.state.vitalidad)
    // Un mundo guardado en otoño vuelve en otoño o más tarde, nunca antes.
    const saved = invierno.serialize(1000)
    expect(EcosystemEngine.hydrate(saved, 1000 + 600_000).visuals.estacion).toBeGreaterThanOrEqual(
      invierno.visuals.estacion,
    )
  })
})
