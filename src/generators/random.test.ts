import { describe, expect, it } from 'vitest'
import { createRandom, hashSeed } from './random.ts'

describe('createRandom', () => {
  it('es determinista: misma semilla → misma secuencia', () => {
    const a = createRandom('the-last-seed')
    const b = createRandom('the-last-seed')
    for (let i = 0; i < 1000; i++) expect(a.next()).toBe(b.next())
  })

  it('semillas distintas producen secuencias distintas', () => {
    const a = createRandom('a')
    const b = createRandom('b')
    expect([a.next(), a.next()]).not.toEqual([b.next(), b.next()])
  })

  it('next() está en [0, 1) y range/int respetan sus límites', () => {
    const r = createRandom('limites')
    for (let i = 0; i < 10_000; i++) {
      const n = r.next()
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
      const x = r.range(-2, 3)
      expect(x).toBeGreaterThanOrEqual(-2)
      expect(x).toBeLessThan(3)
      const k = r.int(1, 6)
      expect(Number.isInteger(k)).toBe(true)
      expect(k).toBeGreaterThanOrEqual(1)
      expect(k).toBeLessThanOrEqual(6)
    }
  })

  it('la distribución es aproximadamente uniforme', () => {
    const r = createRandom('uniforme')
    const buckets = new Array<number>(10).fill(0)
    const n = 100_000
    for (let i = 0; i < n; i++) {
      const b = Math.floor(r.next() * 10)
      buckets[b] = (buckets[b] ?? 0) + 1
    }
    for (const count of buckets) expect(Math.abs(count / n - 0.1)).toBeLessThan(0.01)
  })

  it('fork es estable e independiente del consumo del padre', () => {
    const a = createRandom('mundo')
    a.next()
    a.next()
    const b = createRandom('mundo')
    expect(a.fork('raices').next()).toBe(b.fork('raices').next())
    expect(b.fork('raices').next()).not.toBe(b.fork('arbol').next())
  })

  it('pick devuelve elementos de la lista y falla si está vacía', () => {
    const r = createRandom('pick')
    const items = ['musgo', 'helecho', 'hongo'] as const
    for (let i = 0; i < 100; i++) expect(items).toContain(r.pick(items))
    expect(() => r.pick([])).toThrow()
  })

  it('hashSeed devuelve un entero sin signo de 32 bits', () => {
    const h = hashSeed('the-last-seed')
    expect(Number.isInteger(h)).toBe(true)
    expect(h).toBeGreaterThanOrEqual(0)
    expect(h).toBeLessThan(2 ** 32)
  })
})
