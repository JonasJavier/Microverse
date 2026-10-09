import { useMemo } from 'react'
import { Color } from 'three'
import { palette } from '../../config/palette.ts'
import { PEDESTAL_TOP_Y } from '../../config/world.ts'
import { noRaycast } from '../utils.ts'

const DISC_HEIGHT = 0.04

/**
 * Pedestal casi invisible: un disco de cristal negro que flota bajo la esfera,
 * con un anillo de luz tenue (Sol de día; Vida de noche a partir de la jornada 8).
 */
export function Pedestal() {
  // Valor HDR > 1: lo justo para que el bloom dibuje un halo fino. Por debajo del
  // pulso de la semilla: la mirada va primero a la semilla y al árbol.
  const ringColor = useMemo(() => new Color(palette.luz.sol).multiplyScalar(1.4), [])

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
        <meshBasicMaterial color={ringColor} />
      </mesh>
    </group>
  )
}
