import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, MeshBasicMaterial } from 'three'
import { palette } from '../../config/palette.ts'
import { PEDESTAL_TOP_Y } from '../../config/world.ts'
import { currentLook } from '../lighting/timeOfDay.ts'
import { ecoUniforms } from '../signals.ts'
import { noRaycast } from '../utils.ts'

const DISC_HEIGHT = 0.04
const SYNC_RING = new Color(palette.luz.vida).lerp(new Color(palette.luz.sol), 0.5)

/**
 * Color del anillo según el ciclo: Sol de día, Vida de noche. Valor HDR algo > 1:
 * lo justo para que el bloom dibuje un halo fino, por debajo del pulso de la
 * semilla (la mirada va primero a la semilla y al árbol).
 */
function syncRing(material: MeshBasicMaterial) {
  const look = currentLook()
  // Sincronía: Sol y Vida conviven por primera vez (docs/02 · narrativa del color).
  const sync = ecoUniforms.uSync.value
  material.color
    .copy(look.ringColor)
    .lerp(SYNC_RING, 0.5 * sync)
    .multiplyScalar(look.ringGain * (1 + 0.8 * sync))
}

/** Pedestal casi invisible: un disco de cristal negro que flota bajo la esfera, con un anillo de luz tenue. */
export function Pedestal() {
  const ring = useMemo(() => new MeshBasicMaterial(), [])
  useEffect(() => () => ring.dispose(), [ring])
  useFrame(() => syncRing(ring))

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
        <torusGeometry args={[0.48, 0.004, 12, 160]} />
        <primitive object={ring} attach="material" />
      </mesh>
    </group>
  )
}
