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
import { scatterRain } from '../../generators/rain.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { ecoUniforms } from '../signals.ts'
import { ISLAND, worldRandom } from '../world/island.ts'
import vertexShader from '../../shaders/rain/rain.vert?raw'
import fragmentShader from '../../shaders/rain/rain.frag?raw'

/**
 * Lluvia suave dentro de la esfera (acto 02): una draw call con instancing. Las
 * gotas caen hasta la isla o, fuera de ella, hasta el fondo del cristal. Con la
 * lluvia parada no se dibuja nada (umbral por gota); el número de gotas depende
 * del nivel de arranque.
 */
function createRain(count: number) {
  const rain = scatterRain(ISLAND, worldRandom.fork('lluvia'), count)
  const geometry = new InstancedBufferGeometry()
  const quad = new PlaneGeometry(1, 1)
  geometry.index = quad.index
  geometry.setAttribute('position', quad.getAttribute('position'))
  geometry.setAttribute('aDrop', new InstancedBufferAttribute(rain.drops, 4))
  geometry.setAttribute('aSeed', new InstancedBufferAttribute(rain.seeds, 4))
  geometry.instanceCount = rain.count

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: ecoUniforms.uTime,
      uRain: ecoUniforms.uRain,
      uWidth: { value: 0.0035 },
      uColor: { value: new Color(palette.materia.reflejo) },
      uOpacity: { value: 0.55 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const mesh = new Mesh(geometry, material)
  // Las gotas se mueven en el shader: la caja de la geometría no las contiene.
  mesh.frustumCulled = false
  // Transparente, antes del cristal (10 y 11).
  mesh.renderOrder = 5
  mesh.raycast = () => {}
  return mesh
}

export function RainSystem() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const count = QUALITY[tier].raindrops
  const rain = useMemo(() => createRain(count), [count])
  useEffect(
    () => () => {
      rain.geometry.dispose()
      rain.material.dispose()
    },
    [rain],
  )
  return <primitive object={rain} />
}
