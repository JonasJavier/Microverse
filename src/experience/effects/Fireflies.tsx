import { useEffect, useMemo } from 'react'
import {
  AdditiveBlending,
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  PlaneGeometry,
  ShaderMaterial,
} from 'three'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import { scatterFireflies } from '../../generators/fireflies.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { ecoUniforms } from '../signals.ts'
import { ISLAND, worldRandom } from '../world/island.ts'
import vertexShader from '../../shaders/fireflies/fireflies.vert?raw'
import fragmentShader from '../../shaders/fireflies/fireflies.frag?raw'

/**
 * Luciérnagas (acto 03 · Transform): pocas, lentas, con vuelo de ruido y
 * parpadeo asíncrono; emergen poco a poco con la noche y la vitalidad
 * (`luciernagas` del motor) y en la Sincronía parpadean al unísono. Una draw
 * call con instancing; de día no se dibuja ninguna (umbral por luciérnaga).
 */
function createFireflies(count: number) {
  const flies = scatterFireflies(ISLAND, worldRandom.fork('luciernagas'), count)
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
      uFireflies: ecoUniforms.uFireflies,
      uSync: ecoUniforms.uSync,
      uSize: { value: 0.028 },
      uColor: { value: new Color(palette.luz.vida) },
      // HDR: por encima de 1 el bloom dibuja el halo.
      uIntensity: { value: 3 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false
  // Transparente, antes del cristal (10 y 11) y junto a la lluvia (5).
  mesh.renderOrder = 6
  mesh.raycast = () => {}
  return mesh
}

export function Fireflies() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const count = QUALITY[tier].fireflies
  const fireflies = useMemo(() => createFireflies(count), [count])
  useEffect(
    () => () => {
      fireflies.geometry.dispose()
      fireflies.material.dispose()
    },
    [fireflies],
  )
  return <primitive object={fireflies} />
}
