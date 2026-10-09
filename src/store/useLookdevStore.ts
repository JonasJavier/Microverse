import { create } from 'zustand'

/**
 * Decisiones de look-dev. En producción se quedan con los valores por defecto; en
 * desarrollo las cambia el panel Leva. El post-proceso las lee como props de
 * React; `ciclo` se lee por referencia en `useFrame` (sin re-render).
 */
export type ToneMappingName = 'agx' | 'neutral' | 'aces'

interface LookdevStore {
  toneMapping: ToneMappingName
  bloomIntensity: number
  bloomThreshold: number
  /** 0 = mañana, 1 = noche (config/timeOfDay.ts). En la jornada 8 lo controla el visitante. */
  ciclo: number
}

export const useLookdevStore = create<LookdevStore>()(() => ({
  // Neutral conserva el tono y la saturación de la paleta (ADR-012).
  toneMapping: 'neutral',
  bloomIntensity: 0.9,
  bloomThreshold: 1,
  ciclo: 0,
}))
