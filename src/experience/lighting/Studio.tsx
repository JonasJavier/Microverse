import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer } from '@react-three/drei'
import {
  Color,
  Vector3,
  type DirectionalLight,
  type Fog,
  type HemisphereLight,
  type Scene,
} from 'three'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import {
  FILL_LIGHT,
  FOG,
  KEY_LIGHT,
  LIGHTFORMER_DISTANCE,
  RIM_LIGHT,
  SOFTBOXES,
} from '../../config/studio.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { ecoUniforms } from '../signals.ts'
import { currentLook } from './timeOfDay.ts'

/** Resolución del mapa de sombras según el nivel de arranque (ADR-013). */
const SHADOW_MAP_SIZE = { suaves: 2048, basicas: 1024, ninguna: 0 } as const
const KEY_LIGHT_DISTANCE = 5
/**
 * La hemisférica reparte su intensidad entre cielo y suelo: para dar el mismo
 * nivel que la ambiental plana que sustituye (jornada 11b) necesita más ganancia.
 */
const HEMISPHERE_GAIN = 2.4
const VACIO = new Color(palette.fondo.vacio)
const VIDA = new Color(palette.luz.vida)

interface StudioLights {
  key: DirectionalLight | null
  fill: DirectionalLight | null
  rim: DirectionalLight | null
  hemisphere: HemisphereLight | null
  fog: Fog | null
}

/** Aplica el momento del ciclo a las luces, la niebla y el entorno (cada frame, sin asignar memoria). */
function applyLook(lights: StudioLights, scene: Scene) {
  const look = currentLook()
  if (lights.key) {
    lights.key.intensity = look.keyIntensity
    lights.key.color.copy(look.keyColor)
    // La luz gira con el ciclo (sombras cortas a mediodía, largas al atardecer).
    // El objetivo es el origen: la cámara de sombras sigue encuadrando la isla.
    lights.key.position.copy(look.keyDirection).multiplyScalar(KEY_LIGHT_DISTANCE)
  }
  if (lights.fill) {
    lights.fill.intensity = look.fillIntensity
    lights.fill.color.copy(look.fillColor)
  }
  if (lights.rim) lights.rim.intensity = look.rimIntensity
  if (lights.hemisphere) {
    lights.hemisphere.intensity = look.ambientIntensity * HEMISPHERE_GAIN
    lights.hemisphere.color.copy(look.fillColor)
  }
  if (lights.fog) {
    // De noche la niebla interior se tiñe de Vida; en la Sincronía, un poco más.
    const vida = Math.min(1, look.fogVida * (1 + ecoUniforms.uSync.value))
    lights.fog.color.copy(VACIO).lerp(VIDA, vida * 0.35)
  }
  scene.environmentIntensity = look.environment
}

/**
 * Iluminación de estudio: los mismos softboxes que refleja el cristal, convertidos
 * en Lightformers para iluminar con PBR la isla, la semilla y el pedestal; una luz
 * principal cálida con sombras y un relleno frío. Sin HDRI: 0 KB descargados.
 * El momento del día sale de `ciclo` (config/timeOfDay.ts).
 * Jornada 11b: luz hemisférica (cielo frío, suelo Bosque) en vez de ambiental
 * plana, contraluz que recorta la copa, y niebla interior leve (profundidad).
 */
export function Studio() {
  const tier = useMicroverseStore((s) => s.startupTier)
  const scene = useThree((s) => s.scene)
  const key = useRef<DirectionalLight>(null)
  const fill = useRef<DirectionalLight>(null)
  const rim = useRef<DirectionalLight>(null)
  const hemisphere = useRef<HemisphereLight>(null)
  const fog = useRef<Fog>(null)
  useFrame(() =>
    applyLook(
      {
        key: key.current,
        fill: fill.current,
        rim: rim.current,
        hemisphere: hemisphere.current,
        fog: fog.current,
      },
      scene,
    ),
  )
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
    () =>
      new Vector3(...KEY_LIGHT.direction).normalize().multiplyScalar(KEY_LIGHT_DISTANCE).toArray(),
    [],
  )
  const fillPosition = useMemo(
    () => new Vector3(...FILL_LIGHT.direction).normalize().multiplyScalar(5).toArray(),
    [],
  )
  const rimPosition = useMemo(
    () => new Vector3(...RIM_LIGHT.direction).normalize().multiplyScalar(5).toArray(),
    [],
  )

  return (
    <>
      <fog ref={fog} attach="fog" args={[palette.fondo.vacio, FOG.near, FOG.far]} />
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
        ref={key}
        position={keyPosition}
        intensity={KEY_LIGHT.intensity}
        color={KEY_LIGHT.color}
        castShadow={shadowMapSize > 0}
        shadow-mapSize={[shadowMapSize, shadowMapSize]}
        // Cámara de sombras ajustada a la isla y al árbol: más resolución donde importa.
        shadow-camera-left={-1}
        shadow-camera-right={1}
        shadow-camera-top={1}
        shadow-camera-bottom={-1}
        shadow-camera-near={2}
        shadow-camera-far={8}
        shadow-bias={-0.0004}
        shadow-normalBias={0.012}
        shadow-radius={3}
      />
      <directionalLight
        ref={fill}
        position={fillPosition}
        intensity={FILL_LIGHT.intensity}
        color={FILL_LIGHT.color}
      />
      <directionalLight ref={rim} position={rimPosition} intensity={0.5} color={RIM_LIGHT.color} />
      <hemisphereLight
        ref={hemisphere}
        intensity={0.1}
        color={palette.materia.reflejo}
        groundColor={palette.materia.bosque}
      />
    </>
  )
}
