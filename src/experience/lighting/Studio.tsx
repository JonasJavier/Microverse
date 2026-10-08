import { useMemo } from 'react'
import { Environment, Lightformer } from '@react-three/drei'
import { Vector3 } from 'three'
import { palette } from '../../config/palette.ts'
import { KEY_LIGHT, LIGHTFORMER_DISTANCE, SOFTBOXES } from '../../config/studio.ts'

/**
 * Iluminación de estudio: los mismos softboxes que refleja el cristal, convertidos
 * en Lightformers para iluminar con PBR la isla, la semilla y el pedestal.
 * Sin HDRI: 0 KB descargados. El ciclo día/noche llegará en la jornada 8.
 */
export function Studio() {
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
      />
      <ambientLight intensity={0.04} color={palette.materia.bosque} />
    </>
  )
}
