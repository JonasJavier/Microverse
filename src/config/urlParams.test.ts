import { describe, expect, it } from 'vitest'
import { cicloFromSearch } from './urlParams.ts'

describe('cicloFromSearch', () => {
  it('reconoce los atajos de noche y mañana', () => {
    expect(cicloFromSearch('?noche')).toBe(1)
    expect(cicloFromSearch('?manana')).toBe(0)
    expect(cicloFromSearch('?dia')).toBe(0)
  })

  it('acepta un ciclo numérico y lo limita a 0..1', () => {
    expect(cicloFromSearch('?ciclo=0.65')).toBe(0.65)
    expect(cicloFromSearch('?ciclo=4')).toBe(1)
    expect(cicloFromSearch('?ciclo=-1')).toBe(0)
  })

  it('sin parámetros o con valores inválidos, no pide nada', () => {
    expect(cicloFromSearch('')).toBeNull()
    expect(cicloFromSearch('?ciclo=')).toBeNull()
    expect(cicloFromSearch('?ciclo=tarde')).toBeNull()
    expect(cicloFromSearch('?otra=1')).toBeNull()
  })
})
