import { useEffect, useMemo } from 'react'
import { ConeGeometry, InstancedBufferAttribute, MeshStandardMaterial } from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { QUALITY } from '../../config/quality.ts'
import { scatterFerns } from '../../generators/species.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { ecoUniforms } from '../signals.ts'
import { disposeMesh, toInstancedMesh } from './geometry.ts'
import { groundMaterial } from './groundMaterial.ts'
import { ISLAND, TREE_BASE, worldRandom } from './island.ts'
import { CLEARINGS } from './life.ts'
import fernsVertex from '../../shaders/life/ferns.vert.glsl?raw'
import fernsFragment from '../../shaders/life/ferns.frag.glsl?raw'

/** Helecho: seis frondas finas abiertas en abanico (~36 triángulos). */
function fernGeometry() {
  const fronds = [0, 1, 2, 3, 4, 5].map((k) => {
    // Frondas anchas y planas (tres lados, aplastadas): hoja, no brizna.
    const frond = new ConeGeometry(0.2, 1.1, 3, 1)
    frond.scale(1, 1, 0.35)
    frond.translate(0, 0.55, 0)
    frond.rotateZ(1.05)
    frond.rotateY((k / 6) * Math.PI * 2 + 0.3)
    return frond
  })
  const merged = mergeGeometries(fronds)
  for (const frond of fronds) frond.dispose()
  return merged
}

/**
 * Helechos (jornada 16, fase 2): brotan en la sombra del tronco cuando el mundo
 * está vivo y húmedo (`uFerns`), cada uno a su umbral (los más cercanos al
 * tronco, antes). Se mojan, se marchitan y cambian con la estación como el
 * resto de la vegetación. Una draw call.
 */
function createFerns(count: number) {
  const ferns = scatterFerns(
    ISLAND,
    worldRandom.fork('helechos'),
    count,
    { x: TREE_BASE[0], z: TREE_BASE[2] },
    CLEARINGS,
  )
  const mesh = toInstancedMesh(
    fernGeometry(),
    groundMaterial(new MeshStandardMaterial({ roughness: 0.75 }), 'helechos', {
      wet: 0.5,
      wilt: 0.7,
      season: 0.6,
      vertex: fernsVertex,
      fragment: [fernsFragment],
      uniforms: { uFerns: ecoUniforms.uFerns, uTime: ecoUniforms.uTime },
    }),
    ferns,
  )
  mesh.geometry.setAttribute('aThreshold', new InstancedBufferAttribute(ferns.thresholds, 1))
  mesh.geometry.setAttribute('aPhase', new InstancedBufferAttribute(ferns.phases, 1))
  mesh.receiveShadow = true
  return mesh
}

export function Ferns() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const count = QUALITY[tier].ferns
  const mesh = useMemo(() => createFerns(count), [count])
  useEffect(() => () => disposeMesh(mesh), [mesh])
  return <primitive object={mesh} />
}
