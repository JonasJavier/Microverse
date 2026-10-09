import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  Color,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  ShaderMaterial,
  SphereGeometry,
} from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import { scatterSpores, sleepingCreature } from '../../generators/organisms.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { ecoUniforms } from '../signals.ts'
import { ISLAND, worldRandom } from './island.ts'
import vertexShader from '../../shaders/fireflies/fireflies.vert?raw'
import fragmentShader from '../../shaders/fireflies/fireflies.frag?raw'

/** Esporas: el shader de las luciérnagas con brillo constante, más lentas y más pequeñas. */
function createSpores(count: number) {
  const spores = scatterSpores(ISLAND, worldRandom.fork('esporas'), count)
  const geometry = new InstancedBufferGeometry()
  const quad = new PlaneGeometry(1, 1)
  geometry.index = quad.index
  geometry.setAttribute('position', quad.getAttribute('position'))
  geometry.setAttribute('aHome', new InstancedBufferAttribute(spores.homes, 4))
  geometry.setAttribute('aSeed', new InstancedBufferAttribute(spores.seeds, 4))
  geometry.instanceCount = spores.count
  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: ecoUniforms.uTime,
      uFireflies: ecoUniforms.uSpores,
      uSync: { value: 0 },
      uSteady: { value: 1 },
      uSize: { value: 0.011 },
      uColor: { value: new Color(palette.luz.vida) },
      uIntensity: { value: 1.1 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  const mesh = new Mesh(geometry, material)
  mesh.frustumCulled = false
  mesh.renderOrder = 6
  mesh.raycast = () => {}
  return mesh
}

/** Criatura dormida: cuerpo de esferas fundidas y motas emisivas aparte (respiran). */
function createCreature() {
  const creature = sleepingCreature(ISLAND, worldRandom.fork('criatura'))
  const parts = creature.segments.map((p, i) => {
    const sphere = new SphereGeometry(creature.radii[i]!, 14, 10)
    sphere.translate(p.x, p.y, p.z)
    return sphere
  })
  const body = new Mesh(
    mergeGeometries(parts),
    // Bajo la isla no llega luz: el cuerpo se intuye por un brillo propio muy tenue.
    new MeshStandardMaterial({
      color: palette.estratos.tierraProfunda,
      roughness: 0.95,
      emissive: palette.luz.vida,
      emissiveIntensity: 0.06,
    }),
  )
  for (const part of parts) part.dispose()
  body.castShadow = false
  body.receiveShadow = true
  body.raycast = () => {}

  const spotParts = creature.spots.map((p) => {
    const sphere = new SphereGeometry(0.0055, 8, 6)
    sphere.translate(p.x, p.y, p.z)
    return sphere
  })
  const spots = new Mesh(
    mergeGeometries(spotParts),
    new MeshStandardMaterial({
      color: palette.materia.tierra,
      emissive: palette.luz.vida,
      emissiveIntensity: 0.5,
      roughness: 0.6,
    }),
  )
  for (const part of spotParts) part.dispose()
  spots.raycast = () => {}
  return { body, spots }
}

type Creature = ReturnType<typeof createCreature>

/** Respiración lenta: el cuerpo se hincha apenas y las motas laten con ella (más de noche). */
function breathe({ body, spots }: Creature, elapsed: number) {
  const breath = 0.5 + 0.5 * Math.sin(elapsed * 0.55)
  const s = 1 + 0.035 * breath
  body.scale.set(s, s, s)
  const awake = useMicroverseStore.getState().engine.state.despertado ? 1 : 0.4
  spots.material.emissiveIntensity = (0.3 + 1.6 * breath) * awake
  body.material.emissiveIntensity = (0.025 + 0.06 * breath) * awake
}

/**
 * Organismos ocultos (acto 04 · Discover): esporas que flotan en el hueco del
 * corte y una criatura dormida bajo la isla. Premian a quien explora con la
 * cámara; desde el encuadre frontal apenas se intuyen. (Los gusanos luminosos
 * de las raíces quedan fuera: orden de recorte del roadmap.)
 */
export function HiddenOrganisms() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const count = QUALITY[tier].spores
  const spores = useMemo(() => createSpores(count), [count])
  const creature = useMemo(() => createCreature(), [])
  useEffect(
    () => () => {
      spores.geometry.dispose()
      spores.material.dispose()
      creature.body.geometry.dispose()
      creature.body.material.dispose()
      creature.spots.geometry.dispose()
      creature.spots.material.dispose()
    },
    [spores, creature],
  )
  useFrame(({ clock }) => breathe(creature, clock.elapsedTime))
  return (
    <>
      <primitive object={spores} />
      <primitive object={creature.body} />
      <primitive object={creature.spots} />
    </>
  )
}
