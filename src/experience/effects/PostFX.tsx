import {
  Bloom,
  EffectComposer,
  N8AO,
  Noise,
  ToneMapping,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { Color } from 'three'
import { useShallow } from 'zustand/react/shallow'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import { useLookdevStore, type ToneMappingName } from '../../store/useLookdevStore.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'

const TONE_MAPPING: Record<ToneMappingName, ToneMappingMode> = {
  agx: ToneMappingMode.AGX,
  neutral: ToneMappingMode.NEUTRAL,
  aces: ToneMappingMode.ACES_FILMIC,
}

/**
 * Color de la oclusión: no negro puro, sino el Vacío tirando a Bosque, como la
 * luz rebotada de una sala oscura con vegetación (N8AO lo convierte a lineal).
 */
const AO_COLOR = new Color(palette.fondo.vacio).lerp(new Color(palette.materia.bosque), 0.25)

/**
 * Aspecto macro (docs/02-direccion-de-arte.md · Post-proceso). La escena se
 * renderiza en HDR: el bloom actúa sobre la luz real (solo emisivos > 1) y el
 * tone mapping se aplica al final. Sin profundidad de campo: en el A/B de la
 * jornada 4 no aportaba nada visible en el encuadre por defecto (ver roadmap).
 * Jornada 11b (ADR-014): oclusión ambiental de pantalla antes del bloom; es lo
 * que asienta el musgo, la copa y el corte (sin ella todo flotaba).
 */
export function PostFX() {
  // Nivel de arranque, no el actual: MSAA, resolución del bloom y la oclusión
  // reconstruyen el EffectComposer. En caliente solo se adapta el DPR (MicroverseCanvas).
  const tier = useMicroverseStore((s) => s.startupTier)
  const { toneMapping, bloomIntensity, bloomThreshold, aoIntensity, aoRadius } = useLookdevStore(
    useShallow((s) => ({
      toneMapping: s.toneMapping,
      bloomIntensity: s.bloomIntensity,
      bloomThreshold: s.bloomThreshold,
      aoIntensity: s.aoIntensity,
      aoRadius: s.aoRadius,
    })),
  )
  const quality = QUALITY[tier]

  return (
    <EffectComposer multisampling={quality.multisampling}>
      {quality.ambientOcclusion === 'ninguna' ? (
        <></>
      ) : (
        <N8AO
          // Media: a mitad de resolución con muestreo "low" (móvil). Alta: completa, "medium".
          halfRes={quality.ambientOcclusion === 'media'}
          quality={quality.ambientOcclusion === 'media' ? 'low' : 'medium'}
          aoRadius={aoRadius}
          distanceFalloff={1}
          intensity={aoIntensity}
          color={AO_COLOR}
        />
      )}
      <Bloom
        mipmapBlur
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={0.2}
        intensity={bloomIntensity}
        resolutionScale={quality.bloomHalfRes ? 0.5 : 1}
      />
      <ToneMapping mode={TONE_MAPPING[toneMapping]} />
      <Vignette offset={0.3} darkness={0.6} />
      <Noise opacity={0.06} blendFunction={BlendFunction.SOFT_LIGHT} />
    </EffectComposer>
  )
}
