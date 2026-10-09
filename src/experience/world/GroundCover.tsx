import { useEffect, useMemo } from 'react'
import { IcosahedronGeometry, MeshStandardMaterial, OctahedronGeometry } from 'three'
import { QUALITY, type QualitySettings } from '../../config/quality.ts'
import { scatterMoss, scatterPebbles } from '../../generators/scatter.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { disposeMesh, toInstancedMesh } from './geometry.ts'
import { groundMaterial } from './groundMaterial.ts'
import { ISLAND, worldRandom } from './island.ts'
import { CLEARINGS } from './life.ts'

const PEBBLES = 28

/**
 * Musgo y piedras sobre la isla, con instancing (una draw call cada uno).
 * La cantidad de musgo depende del nivel de arranque: reconstruir el reparto en
 * caliente sería caro (ADR-013).
 */
function createGroundCover(mossCount: number, mossShape: QualitySettings['mossShape']) {
  const moss = toInstancedMesh(
    // Icosaedro sin subdividir (20 triángulos): a esta escala se lee como almohadilla.
    // En media y baja, octaedro (8): a escala de móvil no se distingue y libera presupuesto.
    mossShape === 'icosaedro' ? new IcosahedronGeometry(1, 0) : new OctahedronGeometry(1, 0),
    // El musgo se moja (oscurece y brilla) y, seco, pierde el verde.
    groundMaterial(new MeshStandardMaterial({ roughness: 1 }), 'musgo', { wet: 0.8, wilt: 0.65 }),
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
  const { mossInstances, mossShape } = QUALITY[tier]
  const cover = useMemo(
    () => createGroundCover(mossInstances, mossShape),
    [mossInstances, mossShape],
  )
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
