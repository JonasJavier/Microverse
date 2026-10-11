import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  Color,
  MeshBasicMaterial,
  ShaderMaterial,
  type SpotLight,
} from 'three'
import { palette } from '../../config/palette.ts'
import { PEDESTAL_LIGHT } from '../../config/studio.ts'
import { PEDESTAL_RING_RADIUS, PEDESTAL_TOP_Y } from '../../config/world.ts'
import { currentLook } from '../lighting/timeOfDay.ts'
import { ecoUniforms } from '../signals.ts'
import { noRaycast } from '../utils.ts'
import glowVertex from '../../shaders/pedestal/glow.vert?raw'
import glowFragment from '../../shaders/pedestal/glow.frag?raw'

const DISC_HEIGHT = 0.04
const SYNC_RING = new Color(palette.luz.vida).lerp(new Color(palette.luz.sol), 0.5)

function createPedestalLights() {
  const ring = new MeshBasicMaterial()
  const glow = new ShaderMaterial({
    vertexShader: glowVertex,
    fragmentShader: glowFragment,
    uniforms: {
      uColor: { value: new Color() },
      uRing: { value: PEDESTAL_RING_RADIUS },
      uWidth: { value: 0.045 },
    },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })
  return { ring, glow }
}

type PedestalLights = ReturnType<typeof createPedestalLights>

/**
 * Color del anillo según el ciclo: Sol de día, Vida de noche. Valor HDR algo > 1:
 * lo justo para que el bloom dibuje un halo fino, por debajo del pulso de la
 * semilla (la mirada va primero a la semilla y al árbol). Jornada 11b: la misma
 * luz baña el disco (halo) y sube hasta la roca y las raíces colgantes (punto de luz).
 */
function syncRing({ ring, glow }: PedestalLights, light: SpotLight | null) {
  const look = currentLook()
  // Sincronía: Sol y Vida conviven por primera vez (docs/02 · narrativa del color).
  const sync = ecoUniforms.uSync.value
  ring.color
    .copy(look.ringColor)
    .lerp(SYNC_RING, 0.5 * sync)
    .multiplyScalar(look.ringGain * (1 + 0.8 * sync))
  glow.uniforms.uColor!.value.copy(ring.color).multiplyScalar(0.09)
  if (light) {
    light.color.copy(ring.color)
    light.intensity = PEDESTAL_LIGHT.intensity * (1 + 0.8 * sync)
  }
}

function disposePedestalLights({ ring, glow }: PedestalLights) {
  ring.dispose()
  glow.dispose()
}

/** Pedestal casi invisible: un disco de cristal negro que flota bajo la esfera, con un anillo de luz tenue. */
export function Pedestal() {
  const lights = useMemo(() => createPedestalLights(), [])
  const light = useRef<SpotLight>(null)
  useEffect(() => () => disposePedestalLights(lights), [lights])
  useFrame(() => syncRing(lights, light.current))

  return (
    <group position={[0, PEDESTAL_TOP_Y - DISC_HEIGHT / 2, 0]}>
      <mesh receiveShadow raycast={noRaycast}>
        <cylinderGeometry args={[0.56, 0.6, DISC_HEIGHT, 96]} />
        <meshPhysicalMaterial
          color={palette.fondo.vacio}
          roughness={0.2}
          metalness={0}
          clearcoat={1}
          clearcoatRoughness={0.06}
        />
      </mesh>
      <mesh
        position={[0, DISC_HEIGHT / 2 + 0.002, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        raycast={noRaycast}
      >
        <torusGeometry args={[PEDESTAL_RING_RADIUS, 0.004, 12, 160]} />
        <primitive object={lights.ring} attach="material" />
      </mesh>
      {/* Halo de la lámpara sobre el disco: aditivo, bajo el anillo. */}
      <mesh
        position={[0, DISC_HEIGHT / 2 + 0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        renderOrder={4}
        raycast={noRaycast}
      >
        <ringGeometry args={[0.01, 0.56, 96]} />
        <primitive object={lights.glow} attach="material" />
      </mesh>
      {/*
        La luz del anillo sube hasta la base de roca y las raíces colgantes. Es un
        foco hacia arriba (su objetivo por defecto es el origen): un punto de luz
        dejaba su brillo especular sobre el cristal negro del disco.
      */}
      <spotLight
        ref={light}
        position={[0, DISC_HEIGHT / 2 + 0.12, 0]}
        angle={0.8}
        penumbra={0.8}
        distance={PEDESTAL_LIGHT.distance}
        decay={2}
        intensity={0}
      />
    </group>
  )
}
