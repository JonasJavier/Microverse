import { palette } from '../../config/palette.ts'
import { noRaycast } from '../utils.ts'

/**
 * TEMPORAL (jornada 1): volúmenes de referencia para juzgar el cristal con algo
 * dentro. Se sustituyen por la isla, el árbol y las raíces reales en las jornadas 2–3.
 */
export function LookDevProps() {
  return (
    <group raycast={noRaycast}>
      {/* Montículo de musgo */}
      <mesh position={[0, -0.25, 0]} scale={[0.62, 0.22, 0.62]} raycast={noRaycast}>
        <sphereGeometry args={[1, 64, 32]} />
        <meshStandardMaterial color={palette.materia.musgo} roughness={0.9} />
      </mesh>
      {/* Cono de roca bajo la isla */}
      <mesh position={[0, -0.52, 0]} rotation={[Math.PI, 0, 0]} raycast={noRaycast}>
        <coneGeometry args={[0.58, 0.5, 48]} />
        <meshStandardMaterial color={palette.materia.piedra} roughness={1} />
      </mesh>
      {/* Tronco inclinado y copas */}
      <mesh position={[-0.24, 0.08, -0.06]} rotation={[0, 0, 0.28]} raycast={noRaycast}>
        <cylinderGeometry args={[0.022, 0.045, 0.62, 16]} />
        <meshStandardMaterial color={palette.materia.bosque} roughness={0.8} />
      </mesh>
      <mesh position={[-0.36, 0.42, -0.08]} scale={[1, 0.62, 1]} raycast={noRaycast}>
        <sphereGeometry args={[0.22, 32, 16]} />
        <meshStandardMaterial color={palette.materia.musgo} roughness={0.95} />
      </mesh>
      <mesh position={[-0.12, 0.33, 0.04]} scale={[1, 0.6, 1]} raycast={noRaycast}>
        <sphereGeometry args={[0.14, 32, 16]} />
        <meshStandardMaterial color={palette.materia.musgo} roughness={0.95} />
      </mesh>
    </group>
  )
}
