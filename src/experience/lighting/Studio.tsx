import { useMemo } from 'react'
import { Environment, Lightformer } from '@react-three/drei'
import { Vector3 } from 'three'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import { FILL_LIGHT, KEY_LIGHT, LIGHTFORMER_DISTANCE, SOFTBOXES } from '../../config/studio.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'

/** Resolución del mapa de sombras según el nivel de arranque (ADR-013). */
const SHADOW_MAP_SIZE = { suaves: 2048, basicas: 1024, ninguna: 0 } as const

/**
 * Iluminación de estudio: los mismos softboxes que refleja el cristal, convertidos
 * en Lightformers para iluminar con PBR la isla, la semilla y el pedestal; una luz
 * principal cálida con sombras y un relleno frío. Sin HDRI: 0 KB descargados.
 * El ciclo día/noche llegará en la jornada 8.
 */
export function Studio() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const shadowMapSize = SHADOW_MAP_SIZE[QUALITY[tier].shadows]
  const formers = useMemo(
    () =>
      SOFTBOXES.map((box) => {
        const direction = new Vector3(...box.direction).normalize()
        return {
          ...box,
          position: direction.clone().multiplyScalar(LIGHTFORMER_DISTANCE).toArray(),
          scale: [
            box.halfSize[0] * 2 * LIGHTFORMER_DISTANCE,
            box.halfSize[1] * 2 * LIGHTFORMER_DISTANCE,
            1,
          ] as [number, number, number],
        }
      }),
    [],
  )

  const keyPosition = useMemo(
    () => new Vector3(...KEY_LIGHT.direction).normalize().multiplyScalar(5).toArray(),
    [],
  )
  const fillPosition = useMemo(
    () => new Vector3(...FILL_LIGHT.direction).normalize().multiplyScalar(5).toArray(),
    [],
  )

  return (
    <>
      <Environment resolution={256} frames={1}>
        {formers.map((former) => (
          <Lightformer
            key={former.name}
            form="rect"
            color={former.color}
            intensity={former.intensity}
            position={former.position}
            scale={former.scale}
            target={[0, 0, 0]}
          />
        ))}
      </Environment>
      <directionalLight
        position={keyPosition}
        intensity={KEY_LIGHT.intensity}
        color={KEY_LIGHT.color}
        castShadow={shadowMapSize > 0}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        // Cámara de sombras ajustada a la isla: más resolución donde importa.
        shadow-camera-left={-0.8}
        shadow-camera-right={0.8}
        shadow-camera-top={0.8}
        shadow-camera-bottom={-0.8}
        shadow-camera-near={2}
        shadow-camera-far={8}
        shadow-bias={-0.0004}
        shadow-normalBias={0.012}
        shadow-radius={3}
      />
      <directionalLight
        position={fillPosition}
        intensity={FILL_LIGHT.intensity}
        color={FILL_LIGHT.color}
      />
      <ambientLight intensity={0.04} color={palette.materia.bosque} />
    </>
  )
}
