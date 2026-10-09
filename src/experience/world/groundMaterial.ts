import { Color, type MeshStandardMaterial } from 'three'
import { palette } from '../../config/palette.ts'
import { ecoUniforms } from '../signals.ts'
import { patchMaterial } from './materialPatch.ts'
import groundFragment from '../../shaders/life/ground.frag.glsl?raw'

const dryColor = { value: new Color(palette.materia.musgoSeco) }

/**
 * Suelo que responde al agua (acto 02 · Nourish): mojado se oscurece y brilla;
 * seco, la vegetación pierde el verde. Cada material decide cuánto le afecta.
 */
export function groundMaterial(
  material: MeshStandardMaterial,
  key: string,
  { wet, wilt }: { wet: number; wilt: number },
) {
  return patchMaterial(material, {
    key: `suelo-${key}`,
    fragment: [groundFragment],
    uniforms: {
      uWet: ecoUniforms.uWet,
      uWilt: ecoUniforms.uWilt,
      uDryColor: dryColor,
      uWetAmount: { value: wet },
      uWiltAmount: { value: wilt },
    },
  })
}
