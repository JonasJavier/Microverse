import { describe, expect, it } from 'vitest'
import {
  calidadFromSearch,
  cicloFromSearch,
  nuevoMundoFromSearch,
  statsFromSearch,
} from './urlParams.ts'

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

describe('nuevoMundoFromSearch', () => {
  it('solo con ?nuevo', () => {
    expect(nuevoMundoFromSearch('?nuevo')).toBe(true)
    expect(nuevoMundoFromSearch('?noche&nuevo')).toBe(true)
    expect(nuevoMundoFromSearch('?noche')).toBe(false)
    expect(nuevoMundoFromSearch('')).toBe(false)
  })
})

describe('calidadFromSearch', () => {
  it('acepta los tres niveles, sin distinguir mayúsculas', () => {
    expect(calidadFromSearch('?calidad=alta')).toBe('alta')
    expect(calidadFromSearch('?stats&calidad=Media')).toBe('media')
    expect(calidadFromSearch('?calidad=baja')).toBe('baja')
  })

  it('sin parámetro o con un nivel desconocido, no fija nada', () => {
    expect(calidadFromSearch('')).toBeNull()
    expect(calidadFromSearch('?calidad=')).toBeNull()
    expect(calidadFromSearch('?calidad=ultra')).toBeNull()
  })
})

describe('statsFromSearch', () => {
  it('solo con ?stats', () => {
    expect(statsFromSearch('?stats')).toBe(true)
    expect(statsFromSearch('?calidad=baja&stats')).toBe(true)
    expect(statsFromSearch('?noche')).toBe(false)
  })
})
