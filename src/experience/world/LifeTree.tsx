import { useEffect, useMemo } from 'react'
import { IcosahedronGeometry, Mesh, MeshStandardMaterial } from 'three'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import { buildTubes } from '../../generators/tubes.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { disposeMesh, toInstancedMesh, toTubeGeometry } from './geometry.ts'
import { TREE } from './life.ts'

/**
 * Árbol protagonista, estático (jornada 3): tronco y ramas como tubos (una draw
 * call) y la copa como masas de follaje instanciadas (otra). El crecimiento
 * (`uGrowth`) y el viento llegan en las jornadas 7 y 8.
 */
function createLifeTree(tubeSegments: number) {
  const bark = new Mesh(
    toTubeGeometry(buildTubes(TREE.graph, tubeSegments)),
    new MeshStandardMaterial({ color: palette.materia.corteza, roughness: 0.9 }),
  )
  bark.castShadow = true
  bark.receiveShadow = true
  bark.raycast = () => {}

  const foliage = toInstancedMesh(
    new IcosahedronGeometry(1, 1),
    new MeshStandardMaterial({ roughness: 0.85 }),
    TREE.foliage,
  )
  foliage.castShadow = true
  foliage.receiveShadow = true

  return { bark, foliage }
}

export function LifeTree() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const tubeSegments = QUALITY[tier].tubeSegments
  const tree = useMemo(() => createLifeTree(tubeSegments), [tubeSegments])
  useEffect(
    () => () => {
      disposeMesh(tree.bark)
      disposeMesh(tree.foliage)
    },
    [tree],
  )

  return (
    <>
      <primitive object={tree.bark} />
      <primitive object={tree.foliage} />
    </>
  )
}
