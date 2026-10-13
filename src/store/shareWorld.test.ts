import { describe, expect, it } from 'vitest'
import { EcosystemEngine } from '../simulation/EcosystemEngine.ts'
import { decodeWorld, encodeWorld, mundoFromSearch, shareUrl } from './shareWorld.ts'

function grownWorld() {
  const engine = new EcosystemEngine()
  engine.dispatch({ type: 'despertar' })
  engine.dispatch({ type: 'lluvia', intensidad: 0.7 })
  for (let i = 0; i < 600; i++) engine.step(0.1)
  engine.dispatch({ type: 'sol', ciclo: 0.8 })
  return engine
}

describe('compartir tu mundo por URL', () => {
  it('ida y vuelta: el mundo llega exactamente igual', () => {
    const saved = grownWorld().serialize(1_700_000_000_000)
    const text = encodeWorld(saved)
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(decodeWorld(text)).toEqual(saved)
  })

  it('el motor lo hidrata sin simular ausencia si se usa su marca de tiempo', () => {
    const engine = grownWorld()
    const saved = engine.serialize(1_700_000_000_000)
    const restored = EcosystemEngine.hydrate(decodeWorld(encodeWorld(saved)), saved.guardadoEn)
    expect(restored.state.vitalidad).toBeCloseTo(engine.state.vitalidad, 6)
    expect(restored.state.ciclo).toBeCloseTo(0.8, 6)
    expect(restored.state.despertado).toBe(true)
  })

  it('rechaza basura sin romperse', () => {
    expect(decodeWorld('no-es-base64-!!')).toBeNull()
    expect(decodeWorld(encodeWorld({ version: 2 as 1, estado: {} as never, guardadoEn: 1 }))).toBeNull()
    expect(mundoFromSearch('?mundo=')).toBeNull()
    expect(mundoFromSearch('?noche')).toBeNull()
    // Un estado con la forma mal: decodeWorld lo deja pasar y el motor empieza de cero.
    const bad = decodeWorld(encodeWorld({ version: 1, estado: { humedad: 99 } as never, guardadoEn: 1 }))
    expect(EcosystemEngine.hydrate(bad, 1).state.despertado).toBe(false)
  })

  it('la URL de compartir se puede volver a leer', () => {
    const saved = grownWorld().serialize(5)
    const url = shareUrl('https://ejemplo.test', '/Microverse/', saved)
    expect(url.startsWith('https://ejemplo.test/Microverse/?mundo=')).toBe(true)
    expect(mundoFromSearch(new URL(url).search)).toEqual(saved)
  })
})
