import { Color, type MeshStandardMaterial } from 'three'
import { palette } from '../../config/palette.ts'
import { QUALITY } from '../../config/quality.ts'
import { useMicroverseStore } from '../../store/useMicroverseStore.ts'
import { ecoUniforms } from '../signals.ts'
import { patchMaterial } from './materialPatch.ts'
import groundFragment from '../../shaders/life/ground.frag.glsl?raw'
import surfaceGlsl from '../../shaders/life/surface.glsl?raw'

const dryColor = { value: new Color(palette.materia.musgoSeco) }
/** Colores de estación (jornada 15), compartidos por todos los materiales del suelo. */
export const seasonUniforms = {
  uSeason: ecoUniforms.uSeason,
  uOtonoColor: { value: new Color(palette.materia.otono) },
  uInviernoColor: { value: new Color(palette.materia.invierno) },
}

/**
 * Microdetalle (jornada 11b): 0 lo apaga (calidad baja). Se decide con el nivel
 * de arranque, como todo lo que compila programas (ADR-013); lo comparten el
 * suelo, el musgo y la corteza.
 */
export const surfaceDetail = {
  value: QUALITY[useMicroverseStore.getState().startupTier].surfaceDetail,
}

export interface GroundOptions {
  wet: number
  wilt: number
  /** Cuánto tiñe la estación (0 = nada: la tierra no cambia; el musgo, sí). */
  season?: number
  /** Parche de vértice propio (posición para el grano, altura local…). */
  vertex?: string
  /** Parches de fragmento propios, tras el del agua; pueden usar surface.glsl. */
  fragment?: readonly string[]
  uniforms?: Record<string, { value: unknown }>
}

/**
 * Suelo que responde al agua (acto 02 · Nourish): mojado se oscurece y brilla;
 * seco, la vegetación pierde el verde. Cada material decide cuánto le afecta.
 * Desde la jornada 11b admite parches extra (grano, relieve, oclusión propia).
 */
export function groundMaterial(
  material: MeshStandardMaterial,
  key: string,
  { wet, wilt, season = 0, vertex, fragment = [], uniforms = {} }: GroundOptions,
) {
  return patchMaterial(material, {
    key: `suelo-${key}`,
    vertex,
    fragment: [groundFragment, ...(fragment.length > 0 ? [surfaceGlsl, ...fragment] : [])],
    uniforms: {
      uWet: ecoUniforms.uWet,
      uWilt: ecoUniforms.uWilt,
      uPuddle: ecoUniforms.uPuddle,
      uDryColor: dryColor,
      uWetAmount: { value: wet },
      uWiltAmount: { value: wilt },
      uDetail: surfaceDetail,
      ...seasonUniforms,
      uSeasonAmount: { value: season },
      ...uniforms,
    },
  })
}
