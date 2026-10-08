/**
 * PRNG determinista con semilla (mulberry32). Toda la aleatoriedad del mundo sale
 * de aquí: nunca Math.random(). Cada generador usa su propio `fork` para que
 * cambiar uno no altere la composición de los demás.
 */
export interface Random {
  /** Número en [0, 1). */
  next(): number
  /** Número en [min, max). */
  range(min: number, max: number): number
  /** Entero en [min, max]. */
  int(min: number, max: number): number
  /** Elemento al azar de una lista no vacía. */
  pick<T>(items: readonly T[]): T
  /** Nuevo PRNG independiente derivado de esta semilla y una etiqueta. */
  fork(label: string): Random
}

/** Hash FNV-1a de 32 bits: convierte una semilla de texto en un entero. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function createRandom(seed: string): Random {
  let state = hashSeed(seed)

  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0
    let t = state
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: <T>(items: readonly T[]): T => {
      const item = items[Math.floor(next() * items.length)]
      if (item === undefined) throw new Error('pick() con una lista vacía')
      return item
    },
    fork: (label) => createRandom(`${seed}/${label}`),
  }
}
