import { Bloom, EffectComposer, Noise, ToneMapping, Vignette } from '@react-three/postprocessing'
import { BlendFunction, ToneMappingMode } from 'postprocessing'
import { useShallow } from 'zustand/react/shallow'
import { QUALITY } from '../../config/quality.ts'
import { useLookdevStore, type ToneMappingName } from '../../store/useLookdevStore.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'

const TONE_MAPPING: Record<ToneMappingName, ToneMappingMode> = {
  agx: ToneMappingMode.AGX,
  neutral: ToneMappingMode.NEUTRAL,
  aces: ToneMappingMode.ACES_FILMIC,
}

/**
 * Aspecto macro (docs/02-direccion-de-arte.md · Post-proceso). La escena se
 * renderiza en HDR: el bloom actúa sobre la luz real (solo emisivos > 1) y el
 * tone mapping se aplica al final. La profundidad de campo llega en la jornada 4.
 */
export function PostFX() {
  // Nivel de arranque, no el actual: MSAA y resolución del bloom reconstruyen el
  // EffectComposer. En caliente solo se adapta el DPR (MicroverseCanvas).
  const tier = useMicroverseStore((s) => s.startupTier)
  const { toneMapping, bloomIntensity, bloomThreshold } = useLookdevStore(
    useShallow((s) => ({
      toneMapping: s.toneMapping,
      bloomIntensity: s.bloomIntensity,
      bloomThreshold: s.bloomThreshold,
    })),
  )
  const quality = QUALITY[tier]

  return (
    <EffectComposer multisampling={quality.multisampling}>
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
