import { EcosystemEngine } from '../simulation/EcosystemEngine.ts'
import type { SavedWorld } from '../simulation/types.ts'

/**
 * "El mundo te recuerda" (ADR-007, docs/04 · Persistencia): el estado del motor
 * se guarda en `localStorage` cada `SAVE_INTERVAL_MS` y cuando la pestaña pasa a
 * segundo plano. Al volver, `EcosystemEngine.hydrate` simula la ausencia (más
 * seco, nunca muerto). Un guardado corrupto empieza un mundo nuevo.
 */
export const STORAGE_KEY = 'microverse:v1'
export const SAVE_INTERVAL_MS = 10_000

/** Lo mínimo de `Storage` que se usa (inyectable en tests). */
export interface WorldStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

export function readSavedWorld(storage: WorldStorage): SavedWorld | null {
  try {
    const raw = storage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as SavedWorld
  } catch {
    return null
  }
}

export function writeSavedWorld(storage: WorldStorage, engine: EcosystemEngine, now: number) {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(engine.serialize(now)))
  } catch {
    // Sin espacio o almacenamiento bloqueado: el mundo sigue, solo no se recuerda.
  }
}

/** Motor recuperado del almacenamiento o nuevo si no hay nada (o no vale). */
export function restoreEngine(storage: WorldStorage | null, now: number): EcosystemEngine {
  if (!storage) return new EcosystemEngine()
  return EcosystemEngine.hydrate(readSavedWorld(storage), now)
}

/**
 * Guarda periódicamente y al ocultar la pestaña. Devuelve la función que lo para.
 * Solo guarda mundos despiertos: un mundo dormido no tiene nada que recordar.
 */
/** Lo mínimo de `document` que se usa (inyectable en tests). */
export interface VisibilityTarget {
  readonly visibilityState: string
  addEventListener(type: 'visibilitychange', listener: () => void): void
  removeEventListener(type: 'visibilitychange', listener: () => void): void
}

export function startPersistence(
  engine: EcosystemEngine,
  storage: WorldStorage,
  target: VisibilityTarget,
  now: () => number = Date.now,
): () => void {
  const save = () => {
    if (engine.state.despertado) writeSavedWorld(storage, engine, now())
  }
  const onVisibility = () => {
    if (target.visibilityState === 'hidden') save()
  }
  const timer = setInterval(save, SAVE_INTERVAL_MS)
  target.addEventListener('visibilitychange', onVisibility)
  return () => {
    clearInterval(timer)
    target.removeEventListener('visibilitychange', onVisibility)
    save()
  }
}
