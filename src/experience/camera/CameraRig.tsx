import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { CameraControls } from '@react-three/drei'
import { FRAMING, framingDistance } from '../../config/world.ts'

const DEG = Math.PI / 180

/**
 * Cámara orbital con límites (docs/04-arquitectura.md · Interacción): sin
 * desplazamiento lateral; se puede mirar desde abajo para ver las raíces colgantes.
 * La distancia se adapta al aspecto para que la esfera llene el encuadre.
 */
export function CameraRig() {
  const controls = useRef<CameraControls>(null)
  const aspect = useThree((s) => s.size.width / s.size.height)
  const distance = framingDistance(aspect)

  useEffect(() => {
    controls.current?.setLookAt(
      0,
      FRAMING.targetY + distance * FRAMING.elevation,
      distance,
      0,
      FRAMING.targetY,
      0,
      false,
    )
    // Solo al montar: después manda el visitante.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    controls.current?.dollyTo(distance, true)
  }, [distance])

  return (
    <CameraControls
      ref={controls}
      makeDefault
      // Jornada 9 (Discover): más cerca, para los primeros planos; el cristal queda fuera (radio 1).
      minDistance={1.6}
      maxDistance={distance * 1.4}
      minPolarAngle={20 * DEG}
      maxPolarAngle={150 * DEG}
      truckSpeed={0}
      smoothTime={0.35}
    />
  )
}
