import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Color,
  InstancedBufferAttribute,
  Mesh,
  MeshStandardMaterial,
  OctahedronGeometry,
} from 'three'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import { scatterTreeFoliage } from '../../generators/tree.ts'
import { buildTubes } from '../../generators/tubes.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { currentLook } from '../lighting/timeOfDay.ts'
import { ecoUniforms, signalUniforms } from '../signals.ts'
import { disposeMesh, toInstancedMesh, toTubeGeometry } from './geometry.ts'
import { worldRandom } from './island.ts'
import { TREE } from './life.ts'
import { patchMaterial, patchedDepthMaterial } from './materialPatch.ts'
import signalsGlsl from '../../shaders/life/signals.glsl?raw'
import barkVertex from '../../shaders/life/bark.vert.glsl?raw'
import barkFragment from '../../shaders/life/bark.frag.glsl?raw'
import foliageVertex from '../../shaders/life/foliage.vert.glsl?raw'
import foliageFragment from '../../shaders/life/foliage.frag.glsl?raw'

/** Corteza con crestas en espiral en el tronco y el cuello; las ramas finas, lisas. */
const BARK_FLUTES = { count: 5, depth: 0.14, minRadius: 0.012, twist: 9 }

/** Recorrido del crecimiento: de la base del tronco a la punta más lejana. */
const treeStart = TREE.graph.node(0).distance
const growthUniforms = {
  uGrowth: ecoUniforms.uGrowth,
  // Viento del follaje (también en su material de sombra).
  uTime: ecoUniforms.uTime,
  uWind: ecoUniforms.uWind,
  uTreeStart: { value: treeStart },
  uTreeLength: { value: Math.max(...TREE.graph.nodes.map((n) => n.distance)) - treeStart },
}

/**
 * Árbol protagonista: tronco, ramas y nebari como tubos (una draw call) y las
 * nubes de follaje como mechones instanciados (otra).
 *  - Jornada 6: lo recorren las señales de la semilla (la chispa del encendido
 *    trepa por el tronco, los pulsos suben como luz bajo la corteza y cada nube
 *    destella al llegarle el frente).
 *  - Jornada 7: crece con la vitalidad. El mundo seco tiene un árbol desnudo; al
 *    cuidarlo, las ramas se alargan y las nubes se llenan mechón a mechón
 *    (`uGrowth`). Las sombras crecen igual: materiales de sombra con el mismo
 *    parche de vértice. Seca, la copa pierde el verde (`uWilt`).
 *  - Jornada 8: la copa se mece con el viento (`uWind`, más con lluvia).
 */
function createLifeTree(tubeSegments: number, tufts: number) {
  const barkUniforms = {
    ...signalUniforms,
    ...growthUniforms,
    uBarkPulse: { value: 0.2 },
    uSparkGain: { value: 4 },
  }
  const bark = new Mesh(
    toTubeGeometry(buildTubes(TREE.graph, tubeSegments, { flutes: BARK_FLUTES }), true),
    patchMaterial(new MeshStandardMaterial({ color: palette.materia.corteza, roughness: 0.9 }), {
      key: 'corteza',
      vertex: barkVertex,
      fragment: [signalsGlsl, barkFragment],
      uniforms: barkUniforms,
    }),
  )
  bark.customDepthMaterial = patchedDepthMaterial({
    key: 'corteza',
    vertex: barkVertex,
    uniforms: growthUniforms,
  })
  // Nombres: los usa la prueba de silueta del look-dev (rúbrica del H1).
  bark.name = 'arbol'
  bark.castShadow = true
  bark.receiveShadow = true
  bark.raycast = () => {}

  const scatter = scatterTreeFoliage(TREE, worldRandom.fork('follaje'), tufts)
  const foliage = toInstancedMesh(
    // Octaedro (8 triángulos): a esta escala, un mechón de agujas.
    new OctahedronGeometry(1, 0),
    patchMaterial(new MeshStandardMaterial({ roughness: 0.85, flatShading: true }), {
      key: 'follaje',
      vertex: foliageVertex,
      fragment: [signalsGlsl, foliageFragment],
      uniforms: {
        ...signalUniforms,
        ...growthUniforms,
        uFoliageFlash: { value: 0.35 },
        uWilt: ecoUniforms.uWilt,
        uDryColor: { value: new Color(palette.materia.musgoSeco) },
      },
    }),
    scatter,
  )
  foliage.geometry.setAttribute('pathDistance', new InstancedBufferAttribute(scatter.distances, 1))
  foliage.customDepthMaterial = patchedDepthMaterial({
    key: 'follaje',
    vertex: foliageVertex,
    uniforms: growthUniforms,
  })
  foliage.name = 'arbol'
  foliage.castShadow = true
  foliage.receiveShadow = true

  return { bark, foliage, barkUniforms }
}

type LifeTreeResources = ReturnType<typeof createLifeTree>

/** La luz bajo la corteza sigue el brillo de las raíces (más de noche). */
function syncTree({ barkUniforms }: LifeTreeResources) {
  barkUniforms.uBarkPulse.value = 0.55 * currentLook().rootGlow
}

function disposeTree({ bark, foliage }: LifeTreeResources) {
  disposeMesh(bark)
  disposeMesh(foliage)
  bark.customDepthMaterial?.dispose()
  foliage.customDepthMaterial?.dispose()
}

export function LifeTree() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const { tubeSegments, foliageTufts } = QUALITY[tier]
  const tree = useMemo(
    () => createLifeTree(tubeSegments, foliageTufts),
    [tubeSegments, foliageTufts],
  )
  useEffect(() => () => disposeTree(tree), [tree])
  useFrame(() => syncTree(tree))

  return (
    <>
      <primitive object={tree.bark} />
      <primitive object={tree.foliage} />
    </>
  )
}
