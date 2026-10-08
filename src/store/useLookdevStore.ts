import { create } from 'zustand'

/**
 * Decisiones de look-dev que cambian props de React (el post-proceso). En producción
 * se quedan con los valores por defecto; en desarrollo las cambia el panel Leva.
 */
export type ToneMappingName = 'agx' | 'neutral' | 'aces'

interface LookdevStore {
  toneMapping: ToneMappingName
  bloomIntensity: number
  bloomThreshold: number
}

export const useLookdevStore = create<LookdevStore>()(() => ({
  // Neutral conserva el tono y la saturación de la paleta (ADR-012).
  toneMapping: 'neutral',
  bloomIntensity: 0.9,
  bloomThreshold: 1,
}))
