import { useEffect, useMemo } from 'react'
import { IcosahedronGeometry, MeshStandardMaterial } from 'three'
import { QUALITY } from '../../config/quality.ts'
import { scatterMoss, scatterPebbles } from '../../generators/scatter.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { disposeMesh, toInstancedMesh } from './geometry.ts'
import { CLEARINGS, ISLAND, worldRandom } from './island.ts'

const PEBBLES = 28

/**
 * Musgo y piedras sobre la isla, con instancing (una draw call cada uno).
 * La cantidad de musgo depende del nivel de arranque: reconstruir el reparto en
 * caliente sería caro (ADR-013).
 */
function createGroundCover(mossCount: number) {
  const moss = toInstancedMesh(
    // Icosaedro sin subdividir (20 triángulos): a esta escala se lee como almohadilla.
    new IcosahedronGeometry(1, 0),
    new MeshStandardMaterial({ roughness: 1 }),
    scatterMoss(ISLAND, worldRandom.fork('musgo'), mossCount, CLEARINGS),
  )
  moss.receiveShadow = true

  const pebbles = toInstancedMesh(
    new IcosahedronGeometry(1, 1),
    new MeshStandardMaterial({ roughness: 0.85 }),
    scatterPebbles(ISLAND, worldRandom.fork('piedras'), PEBBLES, CLEARINGS),
  )
  pebbles.castShadow = true
  pebbles.receiveShadow = true

  return { moss, pebbles }
}

export function GroundCover() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const mossCount = QUALITY[tier].mossInstances
  const cover = useMemo(() => createGroundCover(mossCount), [mossCount])
  useEffect(
    () => () => {
      disposeMesh(cover.moss)
      disposeMesh(cover.pebbles)
    },
    [cover],
  )

  return (
    <>
      <primitive object={cover.moss} />
      <primitive object={cover.pebbles} />
    </>
  )
}
