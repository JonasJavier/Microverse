import { useEffect, useMemo } from 'react'
import {
  Color,
  InstancedBufferAttribute,
  InstancedMesh,
  LatheGeometry,
  MeshStandardMaterial,
  Vector2,
} from 'three'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import {
  CLUSTER_PROFILE,
  LAMP_PROFILE,
  scatterClusterMushrooms,
  scatterLampMushrooms,
  type Mushrooms as MushroomSet,
} from '../../generators/mushrooms.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { ecoUniforms, signalUniforms } from '../signals.ts'
import { disposeMesh } from './geometry.ts'
import { ISLAND, TREE_BASE, worldRandom } from './island.ts'
import { CLEARINGS, PUDDLES } from './life.ts'
import { patchMaterial, patchedDepthMaterial } from './materialPatch.ts'
import mushroomsVertex from '../../shaders/life/mushrooms.vert.glsl?raw'
import mushroomsFragment from '../../shaders/life/mushrooms.frag.glsl?raw'

const LAMPS = 6

/** Geometría de revolución a partir de un perfil (pie abajo, sombrero arriba). */
function mushroomGeometry(profile: readonly (readonly [number, number])[], segments: number) {
  const geometry = new LatheGeometry(
    profile.map(([x, y]) => new Vector2(x, y)),
    segments,
  )
  geometry.computeVertexNormals()
  return geometry
}

const growthUniforms = {
  uMushrooms: ecoUniforms.uMushrooms,
}

function createMushroomMesh(
  set: MushroomSet,
  profile: readonly (readonly [number, number])[],
  segments: number,
  key: string,
) {
  const material = patchMaterial(
    new MeshStandardMaterial({ color: palette.organismos.hongoPie, roughness: 0.7 }),
    {
      key: `hongos-${key}`,
      vertex: mushroomsVertex,
      fragment: [mushroomsFragment],
      uniforms: {
        ...growthUniforms,
        uMushroomGlow: ecoUniforms.uMushroomGlow,
        uTime: ecoUniforms.uTime,
        uCapColor: { value: new Color(palette.organismos.hongo) },
        uVidaColor: signalUniforms.uVidaColor,
      },
    },
  )
  const mesh = new InstancedMesh(mushroomGeometry(profile, segments), material, set.count)
  mesh.instanceMatrix.array.set(set.matrices)
  mesh.instanceMatrix.needsUpdate = true
  mesh.geometry.setAttribute('aThreshold', new InstancedBufferAttribute(set.thresholds, 1))
  mesh.geometry.setAttribute('aPhase', new InstancedBufferAttribute(set.phases, 1))
  // La sombra crece con el hongo: material de sombra con el mismo parche de vértice.
  mesh.customDepthMaterial = patchedDepthMaterial({
    key: `hongos-${key}`,
    vertex: mushroomsVertex,
    uniforms: growthUniforms,
  })
  mesh.computeBoundingSphere()
  mesh.raycast = () => {}
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/**
 * Hongos (acto 03 · Transform): lámparas altas alrededor del tronco y racimos
 * pequeños junto a lo húmedo. Asoman cuando `hongos` supera su umbral (más con
 * el exceso de agua: son la señal viva del desequilibrio) y brillan con Vida de
 * noche. Dos draw calls (instancing).
 */
function createMushrooms(clusterCount: number) {
  const damp = Array.from({ length: PUDDLES.count }, (_, i) => ({
    x: PUDDLES.spots[i * 4]!,
    z: PUDDLES.spots[i * 4 + 2]!,
  }))
  const options = {
    lamps: LAMPS,
    clusters: clusterCount,
    around: { x: TREE_BASE[0], z: TREE_BASE[2] },
    damp,
    clearings: CLEARINGS,
  }
  const lamps = createMushroomMesh(
    scatterLampMushrooms(ISLAND, worldRandom.fork('hongos'), options),
    LAMP_PROFILE,
    10,
    'lampara',
  )
  const clusters = createMushroomMesh(
    scatterClusterMushrooms(ISLAND, worldRandom.fork('racimos'), options),
    CLUSTER_PROFILE,
    7,
    'racimo',
  )
  return { lamps, clusters }
}

export function Mushrooms() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const clusterCount = QUALITY[tier].mushroomClusters
  const mushrooms = useMemo(() => createMushrooms(clusterCount), [clusterCount])
  useEffect(
    () => () => {
      disposeMesh(mushrooms.lamps)
      disposeMesh(mushrooms.clusters)
      mushrooms.lamps.customDepthMaterial?.dispose()
      mushrooms.clusters.customDepthMaterial?.dispose()
    },
    [mushrooms],
  )
  return (
    <>
      <primitive object={mushrooms.lamps} />
      <primitive object={mushrooms.clusters} />
    </>
  )
}
