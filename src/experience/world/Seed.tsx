import { useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import type { MeshStandardMaterial, PointLight } from 'three'
import { palette } from '../../config/palette.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { seedSignal, signalUniforms } from '../signals.ts'
import { SEED_POSITION, SEED_RADIUS } from './island.ts'

/** Radio del área de toque: en un móvil de 390 px mide ~45 px (mínimo recomendado: 44). */
const HIT_RADIUS = 0.12
/** Un clic que arrastra más de esto (px) es un giro de cámara, no un toque. */
const MAX_TAP_DRAG = 6

interface SeedParts {
  material: MeshStandardMaterial | null
  light: PointLight | null
}

/**
 * Latido de la semilla. Dormida, late sola, lenta y fuerte. Despierta, cada
 * destello coincide con la salida de un pulso hacia las raíces (fase 0) y se
 * calma a medida que el mundo coge vida. El despertar es un estallido de luz Sol.
 */
function syncSeed({ material, light }: SeedParts, elapsed: number) {
  const awake = signalUniforms.uIgnition.value >= 0
  const phase = signalUniforms.uPhase.value
  const beat = awake
    ? Math.exp(-((phase / 0.08) ** 2)) + Math.exp(-(((1 - phase) / 0.03) ** 2))
    : Math.pow(Math.sin(elapsed * 1.4) * 0.5 + 0.5, 3)
  const calm = 0.35 + 0.65 * seedSignal.pulse
  const flash = signalUniforms.uFlash.value
  if (material) material.emissiveIntensity = (0.6 + beat * 5) * calm + flash * 30
  if (light) light.intensity = (0.02 + beat * 0.05) * calm + flash * 0.9
}

function setCursor(cursor: string) {
  document.body.style.cursor = cursor
}

/** La semilla: el punto de partida del acto 01. Tocarla despierta el mundo. */
export function Seed() {
  const material = useRef<MeshStandardMaterial>(null)
  const light = useRef<PointLight>(null)
  const dormant = useMicroverseStore((s) => s.etapa === 'dormido')
  const despertar = useMicroverseStore((s) => s.despertar)

  useFrame(({ clock }) =>
    syncSeed({ material: material.current, light: light.current }, clock.elapsedTime),
  )

  const onClick = (event: ThreeEvent<MouseEvent>) => {
    if (event.delta > MAX_TAP_DRAG) return
    event.stopPropagation()
    despertar()
    setCursor('')
  }

  return (
    <group position={SEED_POSITION}>
      <mesh scale={[1, 0.8, 1]} castShadow raycast={() => null}>
        <sphereGeometry args={[SEED_RADIUS, 32, 16]} />
        <meshStandardMaterial
          ref={material}
          color={palette.materia.tierra}
          emissive={palette.luz.sol}
          roughness={0.55}
        />
      </mesh>
      {/* Luz cálida de la semilla: ilumina el musgo de alrededor al latir. */}
      <pointLight ref={light} color={palette.luz.sol} distance={0.7} decay={2} intensity={0} />
      {/* Área de toque invisible (no se dibuja, pero recibe el puntero). */}
      <mesh
        visible={false}
        onClick={onClick}
        onPointerOver={() => dormant && setCursor('pointer')}
        onPointerOut={() => setCursor('')}
      >
        <sphereGeometry args={[HIT_RADIUS, 12, 8]} />
      </mesh>
    </group>
  )
}
