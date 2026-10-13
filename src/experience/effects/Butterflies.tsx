import { useEffect, useMemo } from 'react'
import {
  Color,
  DoubleSide,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
} from 'three'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import { SPHERE_RADIUS } from '../../config/world.ts'
import { scatterButterflies } from '../../generators/species.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { ecoUniforms } from '../signals.ts'
import { worldRandom } from '../world/island.ts'
import { TREE } from '../world/life.ts'
import vertexShader from '../../shaders/butterflies/butterflies.vert?raw'
import fragmentShader from '../../shaders/butterflies/butterflies.frag?raw'

/**
 * Mariposas (jornada 16, fase 2): llegan de día cuando el árbol florece
 * (`uButterflies`), cada una con su nube de la copa como casa. Vuelo y aleteo
 * en el shader; una draw call con instancing. De noche no se dibuja ninguna.
 */
function createButterflies(count: number) {
  const flies = scatterButterflies(TREE.pads, worldRandom.fork('mariposas'), count, SPHERE_RADIUS)
  const geometry = new InstancedBufferGeometry()
  const quad = new PlaneGeometry(1, 1)
  geometry.index = quad.index
  geometry.setAttribute('position', quad.getAttribute('position'))
  geometry.setAttribute('aHome', new InstancedBufferAttribute(flies.homes, 4))
  geometry.setAttribute('aSeed', new InstancedBufferAttribute(flies.seeds, 4))
  geometry.instanceCount = flies.count

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: ecoUniforms.uTime,
      uButterflies: ecoUniforms.uButterflies,
      uSize: { value: 0.038 },
      uColor: { value: new Color(palette.organismos.mariposa) },
    },
    transparent: true,
    side: DoubleSide,
  })
  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false
  mesh.renderOrder = 4
  mesh.raycast = () => {}
  return mesh
}

export function Butterflies() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const count = QUALITY[tier].butterflies
  const butterflies = useMemo(() => createButterflies(count), [count])
  useEffect(
    () => () => {
      butterflies.geometry.dispose()
      butterflies.material.dispose()
    },
    [butterflies],
  )
  return <primitive object={butterflies} />
}
