import { Vector3 } from 'three'
import { generateRootNetwork } from '../../generators/roots.ts'
import type { Clearing } from '../../generators/scatter.ts'
import { generateTree } from '../../generators/tree.ts'
import { findPuddles } from '../../generators/vegetation.ts'
import { ISLAND, SEED_POSITION, TREE_BASE, worldRandom } from './island.ts'

/**
 * La vida del mundo, generada una vez al cargar (determinista, ~0,1 s): la red de
 * raíces nace en la semilla y su nervio principal termina en la base del tronco,
 * donde empieza el árbol. Una señal puede recorrer semilla → raíces → tronco →
 * ramas siguiendo `distance` sin saltos.
 */
export const ROOT_NETWORK = generateRootNetwork(
  ISLAND,
  worldRandom.fork('raices'),
  new Vector3(...SEED_POSITION),
  new Vector3(...TREE_BASE),
)

export const TREE = generateTree(
  ISLAND,
  worldRandom.fork('arbol'),
  new Vector3(...TREE_BASE),
  ROOT_NETWORK.graph.node(ROOT_NETWORK.treeNode).distance,
)

/**
 * Zonas sin musgo ni piedras: alrededor de la semilla y del tronco, y un pasillo
 * estrecho sobre el nervio para que se vea asomar entre el musgo.
 */
export const CLEARINGS: readonly Clearing[] = [
  { x: SEED_POSITION[0], z: SEED_POSITION[2], radius: 0.045 },
  { x: TREE_BASE[0], z: TREE_BASE[2], radius: 0.06 },
  ...ROOT_NETWORK.nerve.map((id) => {
    const { x, z } = ROOT_NETWORK.graph.node(id).position
    return { x, z, radius: 0.02 }
  }),
  // Nebari: despejado cerca del tronco; hacia la punta, el musgo las va tapando.
  ...[...TREE.nebari].map((id) => {
    const { x, z } = TREE.graph.node(id).position
    return { x, z, radius: TREE.graph.node(id).radius * 1.6 + 0.008 }
  }),
]

/** Hondonadas donde se encharca: charcos (Vegetation) y racimos de hongos (Mushrooms). */
export const PUDDLES = findPuddles(ISLAND, worldRandom.fork('charcos'), 7, CLEARINGS)
