import { useEffect, useMemo } from 'react'
import { Mesh, MeshStandardMaterial, OctahedronGeometry } from 'three'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import { scatterTreeFoliage } from '../../generators/tree.ts'
import { buildTubes } from '../../generators/tubes.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { disposeMesh, toInstancedMesh, toTubeGeometry } from './geometry.ts'
import { worldRandom } from './island.ts'
import { TREE } from './life.ts'

/** Corteza con crestas en espiral en el tronco y el cuello; las ramas finas, lisas. */
const BARK_FLUTES = { count: 5, depth: 0.14, minRadius: 0.012, twist: 9 }

/**
 * Árbol protagonista, estático: tronco, ramas y nebari como tubos (una draw call)
 * y las nubes de follaje como mechones instanciados (otra). El crecimiento
 * (`uGrowth`) y el viento llegan en las jornadas 7 y 8.
 */
function createLifeTree(tubeSegments: number, tufts: number) {
  const bark = new Mesh(
    toTubeGeometry(buildTubes(TREE.graph, tubeSegments, { flutes: BARK_FLUTES }), true),
    new MeshStandardMaterial({ color: palette.materia.corteza, roughness: 0.9 }),
  )
  // Nombres: los usa la prueba de silueta del look-dev (rúbrica del H1).
  bark.name = 'arbol'
  bark.castShadow = true
  bark.receiveShadow = true
  bark.raycast = () => {}

  const foliage = toInstancedMesh(
    // Octaedro (8 triángulos): a esta escala, un mechón de agujas.
    new OctahedronGeometry(1, 0),
    new MeshStandardMaterial({ roughness: 0.85, flatShading: true }),
    scatterTreeFoliage(TREE, worldRandom.fork('follaje'), tufts),
  )
  foliage.name = 'arbol'
  foliage.castShadow = true
  foliage.receiveShadow = true

  return { bark, foliage }
}

export function LifeTree() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const { tubeSegments, foliageTufts } = QUALITY[tier]
  const tree = useMemo(
    () => createLifeTree(tubeSegments, foliageTufts),
    [tubeSegments, foliageTufts],
  )
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
