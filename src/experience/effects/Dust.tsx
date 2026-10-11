import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
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
import { scatterDust } from '../../generators/organisms.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { currentLook } from '../lighting/timeOfDay.ts'
import { ecoUniforms } from '../signals.ts'
import { ISLAND, worldRandom } from '../world/island.ts'
import vertexShader from '../../shaders/fireflies/fireflies.vert?raw'
import fragmentShader from '../../shaders/fireflies/fireflies.frag?raw'

/**
 * Polvo en suspensión (jornada 11b · Realismo): motas diminutas y lentas en el
 * aire del cristal, siempre presentes. Dan escala (fotografía macro) y hacen
 * visible el aire. Brillan con la luz principal: de día se ven más; por debajo
 * del umbral del bloom (no son luciérnagas). Una draw call; mismo shader que las
 * luciérnagas con brillo constante (`uSteady`).
 */
function createDust(count: number) {
  const dust = scatterDust(ISLAND, worldRandom.fork('polvo'), count)
  const geometry = new InstancedBufferGeometry()
  const quad = new PlaneGeometry(1, 1)
  geometry.index = quad.index
  geometry.setAttribute('position', quad.getAttribute('position'))
  geometry.setAttribute('aHome', new InstancedBufferAttribute(dust.homes, 4))
  geometry.setAttribute('aSeed', new InstancedBufferAttribute(dust.seeds, 4))
  geometry.instanceCount = dust.count

  const uniforms = {
    uTime: ecoUniforms.uTime,
    uFireflies: { value: 1 },
    uSync: { value: 0 },
    uSteady: { value: 1 },
    uSize: { value: 0.0045 },
    uColor: { value: new Color(palette.materia.reflejo) },
    uIntensity: { value: 0.5 },
  }
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false
  // Transparente, antes del cristal (10 y 11), con las luciérnagas (6).
  mesh.renderOrder = 6
  mesh.raycast = () => {}
  return { mesh, uniforms }
}

type Dust = ReturnType<typeof createDust>

/** El polvo se ve donde hay luz: con el sol alto brilla más; de noche, apenas. */
function syncDust({ uniforms }: Dust) {
  uniforms.uIntensity.value = 0.1 + 0.2 * currentLook().keyIntensity
}

export function Dust() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const count = QUALITY[tier].dust
  const dust = useMemo(() => createDust(count), [count])
  useEffect(
    () => () => {
      dust.mesh.geometry.dispose()
      dust.mesh.material.dispose()
    },
    [dust],
  )
  useFrame(() => syncDust(dust))
  return <primitive object={dust.mesh} />
}
