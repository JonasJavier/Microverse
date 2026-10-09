import { useEffect, useMemo } from 'react'
import { Mesh, MeshStandardMaterial } from 'three'
import { buildIslandMesh, mergeMeshData } from '../../generators/island.ts'
import { disposeMesh, toGeometry } from './geometry.ts'
import { groundMaterial } from './groundMaterial.ts'
import { ISLAND, worldRandom } from './island.ts'

/**
 * La isla flotante: superficie superior (bajo el musgo) y suelo con estratos
 * (cono, borde y corte de diorama) en una sola malla. Dos draw calls. Con la
 * lluvia, la superficie se oscurece y brilla del todo; el suelo del corte, poco.
 */
function createIsland() {
  const parts = buildIslandMesh(ISLAND, worldRandom.fork('malla-isla'))

  const top = new Mesh(
    toGeometry(parts.top),
    groundMaterial(
      new MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }),
      'superficie',
      {
        wet: 1,
        wilt: 0,
      },
    ),
  )
  const soil = new Mesh(
    toGeometry(mergeMeshData(parts.underside, parts.rim, parts.cutLow, parts.cutHigh)),
    groundMaterial(new MeshStandardMaterial({ vertexColors: true, roughness: 1 }), 'estratos', {
      wet: 0.3,
      wilt: 0,
    }),
  )

  for (const mesh of [top, soil]) {
    mesh.castShadow = true
    mesh.receiveShadow = true
    mesh.raycast = () => {}
  }
  return { top, soil }
}

export function FloatingIsland() {
  const island = useMemo(() => createIsland(), [])
  useEffect(
    () => () => {
      disposeMesh(island.top)
      disposeMesh(island.soil)
    },
    [island],
  )

  return (
    <>
      <primitive object={island.top} />
      <primitive object={island.soil} />
    </>
  )
}
