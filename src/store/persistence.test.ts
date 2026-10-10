import { describe, expect, it, vi } from 'vitest'
import {
  SAVE_INTERVAL_MS,
  STORAGE_KEY,
  readSavedWorld,
  restoreEngine,
  startPersistence,
  writeSavedWorld,
  type WorldStorage,
} from './persistence.ts'
import { EcosystemEngine } from '../simulation/EcosystemEngine.ts'

function memoryStorage(): WorldStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

function fakeDocument() {
  const listeners = new Set<() => void>()
  return {
    visibilityState: 'visible' as DocumentVisibilityState,
    addEventListener: (_: string, fn: () => void) => void listeners.add(fn),
    removeEventListener: (_: string, fn: () => void) => void listeners.delete(fn),
    hide() {
      this.visibilityState = 'hidden'
      for (const fn of listeners) fn()
    },
  }
}

describe('persistencia (ADR-007)', () => {
  it('guarda y recupera el mundo simulando la ausencia', () => {
    const storage = memoryStorage()
    const engine = new EcosystemEngine()
    engine.dispatch({ type: 'despertar' })
    engine.dispatch({ type: 'lluvia', intensidad: 0.5 })
    engine.advance(60)
    writeSavedWorld(storage, engine, 1_000)
    expect(readSavedWorld(storage)?.version).toBe(1)

    // Vuelve media hora después: más seco, pero despierto y con lo crecido.
    const back = restoreEngine(storage, 1_000 + 30 * 60 * 1000)
    expect(back.state.despertado).toBe(true)
    expect(back.state.humedad).toBeLessThan(engine.state.humedad)
    expect(back.state.vitalidad).toBeGreaterThanOrEqual(back.settings.VITALIDAD_MIN)
    expect(back.state.lluvia).toBe(0)
  })

  it('sin almacenamiento o con basura, empieza un mundo nuevo', () => {
    expect(restoreEngine(null, 0).state.despertado).toBe(false)
    const storage = memoryStorage()
    storage.setItem(STORAGE_KEY, '{not json')
    expect(restoreEngine(storage, 0).state.despertado).toBe(false)
    storage.setItem(STORAGE_KEY, JSON.stringify({ version: 2, estado: {}, guardadoEn: 0 }))
    expect(restoreEngine(storage, 0).state.despertado).toBe(false)
  })

  it('con el almacenamiento bloqueado, el mundo funciona igual (solo no se recuerda)', () => {
    const blocked: WorldStorage = {
      getItem: () => {
        throw new DOMException('bloqueado', 'SecurityError')
      },
      setItem: () => {
        throw new DOMException('lleno', 'QuotaExceededError')
      },
      removeItem: () => {
        throw new DOMException('bloqueado', 'SecurityError')
      },
    }
    const engine = restoreEngine(blocked, 0)
    expect(engine.state.despertado).toBe(false)
    engine.dispatch({ type: 'despertar' })
    expect(() => writeSavedWorld(blocked, engine, 0)).not.toThrow()
    const doc = fakeDocument()
    const stop = startPersistence(engine, blocked, doc)
    expect(() => doc.hide()).not.toThrow()
    expect(() => stop()).not.toThrow()
  })

  it('guarda cada intervalo y al ocultar la pestaña; dormido no guarda nada', () => {
    vi.useFakeTimers()
    const storage = memoryStorage()
    const doc = fakeDocument()
    const engine = new EcosystemEngine()
    const stop = startPersistence(engine, storage, doc, () => 42)
    vi.advanceTimersByTime(SAVE_INTERVAL_MS)
    expect(storage.data.size).toBe(0)
    engine.dispatch({ type: 'despertar' })
    vi.advanceTimersByTime(SAVE_INTERVAL_MS)
    expect(readSavedWorld(storage)?.guardadoEn).toBe(42)
    storage.removeItem(STORAGE_KEY)
    doc.hide()
    expect(readSavedWorld(storage)).not.toBeNull()
    stop()
    vi.useRealTimers()
  })
})
