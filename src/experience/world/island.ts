import { SEED_XZ, TREE_XZ, WORLD_SEED } from '../../config/world.ts'
import { createIslandShape } from '../../generators/island.ts'
import { createRandom } from '../../generators/random.ts'
import type { Clearing } from '../../generators/scatter.ts'

/**
 * La isla del mundo: una sola forma, compartida por la malla, el musgo, la semilla,
 * el árbol y (desde la jornada 3) las raíces. Determinista: sale de WORLD_SEED.
 */
export const worldRandom = createRandom(WORLD_SEED)
export const ISLAND = createIslandShape(worldRandom.fork('isla'))

export const SEED_RADIUS = 0.035

export const SEED_POSITION: [number, number, number] = [
  SEED_XZ[0],
  ISLAND.topY(SEED_XZ[0], SEED_XZ[1]) + SEED_RADIUS * 0.55,
  SEED_XZ[1],
]

export const TREE_BASE: [number, number, number] = [
  TREE_XZ[0],
  ISLAND.topY(TREE_XZ[0], TREE_XZ[1]),
  TREE_XZ[1],
]

/** Zonas sin musgo ni piedras: alrededor de la semilla y del tronco. */
export const CLEARINGS: readonly Clearing[] = [
  { x: SEED_XZ[0], z: SEED_XZ[1], radius: 0.045 },
  { x: TREE_XZ[0], z: TREE_XZ[1], radius: 0.06 },
]
