import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import { BackSide, FrontSide, type MeshStandardMaterial } from 'three'
import { palette } from '../config/palette.ts'
import { SPHERE_RADIUS } from '../config/world.ts'

/**
 * Escena provisional de la jornada 0: esfera, semilla latiendo y pedestal.
 * El cristal definitivo (shader Fresnel) llega en la jornada 1 (ADR-004).
 */
export function MicroverseScene() {
  const seedMaterial = useRef<MeshStandardMaterial>(null)

  useFrame(({ clock }) => {
    const material = seedMaterial.current
    if (!material) return
    // Pulso lento, como un latido: sin setState, solo se muta el material.
    const beat = Math.pow(Math.sin(clock.elapsedTime * 1.4) * 0.5 + 0.5, 3)
    material.emissiveIntensity = 0.4 + beat * 2.2
  })

  return (
    <>
      <ambientLight intensity={0.15} color={palette.materia.bosque} />
      <directionalLight position={[-3, 4, 2]} intensity={1.2} color={palette.luz.sol} />

      {/* Semilla */}
      <mesh position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.06, 32, 16]} />
        <meshStandardMaterial
          ref={seedMaterial}
          color={palette.materia.tierra}
          emissive={palette.luz.sol}
          roughness={0.6}
        />
      </mesh>

      {/* Cristal provisional: cara trasera y luego delantera (orden de transparencias) */}
      <mesh renderOrder={10} raycast={() => null}>
        <sphereGeometry args={[SPHERE_RADIUS, 96, 48]} />
        <meshPhysicalMaterial
          side={BackSide}
          color={palette.materia.reflejo}
          transparent
          opacity={0.05}
          roughness={0.05}
          depthWrite={false}
        />
      </mesh>
      <mesh renderOrder={11} raycast={() => null}>
        <sphereGeometry args={[SPHERE_RADIUS, 96, 48]} />
        <meshPhysicalMaterial
          side={FrontSide}
          color={palette.materia.reflejo}
          transparent
          opacity={0.08}
          roughness={0.05}
          clearcoat={1}
          depthWrite={false}
        />
      </mesh>

      {/* Pedestal casi invisible */}
      <mesh position={[0, -SPHERE_RADIUS - 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.38, 0.012, 16, 96]} />
        <meshStandardMaterial
          color={palette.fondo.vacio}
          emissive={palette.luz.sol}
          emissiveIntensity={0.25}
        />
      </mesh>

      <CameraControls
        makeDefault
        minDistance={3}
        maxDistance={9}
        minPolarAngle={(20 * Math.PI) / 180}
        maxPolarAngle={(150 * Math.PI) / 180}
        truckSpeed={0}
        smoothTime={0.35}
      />
    </>
  )
}
