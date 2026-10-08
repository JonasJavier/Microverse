import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { MeshStandardMaterial } from 'three'
import { palette } from '../../config/palette.ts'
import { SEED_POSITION } from '../../config/world.ts'

/**
 * La semilla dormida: late con luz Sol. Es el punto de partida del acto 01
 * (la interacción llega en la jornada 6).
 */
export function Seed() {
  const material = useRef<MeshStandardMaterial>(null)

  useFrame(({ clock }) => {
    if (!material.current) return
    // Latido lento y asimétrico; sin setState, solo se muta el material.
    const beat = Math.pow(Math.sin(clock.elapsedTime * 1.4) * 0.5 + 0.5, 3)
    material.current.emissiveIntensity = 0.6 + beat * 5
  })

  return (
    <mesh position={SEED_POSITION}>
      <sphereGeometry args={[0.035, 32, 16]} />
      <meshStandardMaterial
        ref={material}
        color={palette.materia.tierra}
        emissive={palette.luz.sol}
        roughness={0.55}
      />
    </mesh>
  )
}
