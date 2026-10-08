import { palette } from '../../config/palette.ts'
import { noRaycast } from '../utils.ts'
import { TREE_BASE } from '../world/island.ts'

/**
 * TEMPORAL: volúmenes de referencia del árbol, apoyados en la isla real.
 * Se sustituyen por el árbol procedural en la jornada 3.
 */
export function LookDevProps() {
  return (
    <group position={TREE_BASE} raycast={noRaycast}>
      <mesh position={[0.05, 0.27, 0]} rotation={[0, 0, 0.28]} castShadow raycast={noRaycast}>
        <cylinderGeometry args={[0.022, 0.045, 0.6, 16]} />
        <meshStandardMaterial color={palette.materia.bosque} roughness={0.8} />
      </mesh>
      <mesh position={[-0.08, 0.6, 0.04]} scale={[1, 0.62, 1]} castShadow raycast={noRaycast}>
        <sphereGeometry args={[0.22, 32, 16]} />
        <meshStandardMaterial color={palette.materia.musgo} roughness={0.95} />
      </mesh>
      <mesh position={[0.15, 0.5, 0.13]} scale={[1, 0.6, 1]} castShadow raycast={noRaycast}>
        <sphereGeometry args={[0.14, 32, 16]} />
        <meshStandardMaterial color={palette.materia.musgo} roughness={0.95} />
      </mesh>
    </group>
  )
}
