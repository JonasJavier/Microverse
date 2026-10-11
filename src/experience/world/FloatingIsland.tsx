import { useEffect, useMemo } from 'react'
import { Mesh, MeshStandardMaterial } from 'three'
import { buildIslandMesh, mergeMeshData } from '../../generators/island.ts'
import { disposeMesh, toGeometry } from './geometry.ts'
import { groundMaterial } from './groundMaterial.ts'
import { ISLAND, worldRandom } from './island.ts'
import soilVertex from '../../shaders/life/soil.vert.glsl?raw'
import soilFragment from '../../shaders/life/soil.frag.glsl?raw'

/**
 * Grano y relieve del suelo (jornada 11b). La escala es en unidades del mundo
 * (la isla mide ~1,3): 28 → manchas de ~3,5 cm con grano fino encima. La altura
 * del relieve es pequeña: la luz rasante del atardecer lo dibuja; de frente,
 * apenas se nota (como la tierra real).
 */
const SOIL_DETAIL = {
  superficie: { grain: 34, bump: 0.0035 },
  estratos: { grain: 32, bump: 0.008 },
} as const

/**
 * La isla flotante: superficie superior (bajo el musgo) y suelo con estratos
 * (cono, borde y corte de diorama) en una sola malla. Dos draw calls. Con la
 * lluvia, la superficie se oscurece y brilla del todo; el suelo del corte, poco.
 */
function createIsland() {
  const parts = buildIslandMesh(ISLAND, worldRandom.fork('malla-isla'))

  const soilPatch = (key: keyof typeof SOIL_DETAIL) => ({
    vertex: soilVertex,
    fragment: [soilFragment],
    uniforms: {
      uGrainScale: { value: SOIL_DETAIL[key].grain },
      uBumpHeight: { value: SOIL_DETAIL[key].bump },
    },
  })

  const top = new Mesh(
    toGeometry(parts.top),
    groundMaterial(
      new MeshStandardMaterial({ vertexColors: true, roughness: 0.95 }),
      'superficie',
      { wet: 1, wilt: 0, ...soilPatch('superficie') },
    ),
  )
  const soil = new Mesh(
    toGeometry(mergeMeshData(parts.underside, parts.rim, parts.cutLow, parts.cutHigh)),
    groundMaterial(new MeshStandardMaterial({ vertexColors: true, roughness: 1 }), 'estratos', {
      wet: 0.3,
      wilt: 0,
      ...soilPatch('estratos'),
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
