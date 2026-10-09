import { create } from 'zustand'

/**
 * Decisiones de look-dev. En producción se quedan con los valores por defecto; en
 * desarrollo las cambia el panel Leva. El post-proceso las lee como props de
 * React; `velocidad` se lee por referencia en `useFrame` (sin re-render). El
 * ciclo del día vive en el motor (acción `sol`).
 */
export type ToneMappingName = 'agx' | 'neutral' | 'aces'

interface LookdevStore {
  toneMapping: ToneMappingName
  bloomIntensity: number
  bloomThreshold: number
  /** Velocidad de la simulación para calibrar (solo desarrollo): ×1, ×5, ×20. */
  velocidad: number
}

export const useLookdevStore = create<LookdevStore>()(() => ({
  // Neutral conserva el tono y la saturación de la paleta (ADR-012).
  toneMapping: 'neutral',
  bloomIntensity: 0.9,
  bloomThreshold: 1,
  velocidad: 1,
}))
