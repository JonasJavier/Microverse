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
  /**
   * Oclusión ambiental (N8AO, jornada 11b). `aoRadius` en unidades del mundo:
   * la isla mide ~1,3; con 0,1 la oclusión entra entre el musgo y bajo la copa
   * sin ennegrecer el corte entero. `aoIntensity` es el exponente del efecto.
   */
  aoIntensity: number
  aoRadius: number
  /** Velocidad de la simulación para calibrar (solo desarrollo): ×1, ×5, ×20. */
  velocidad: number
}

export const useLookdevStore = create<LookdevStore>()(() => ({
  // Neutral conserva el tono y la saturación de la paleta (ADR-012).
  toneMapping: 'neutral',
  bloomIntensity: 0.9,
  bloomThreshold: 1,
  aoIntensity: 2.4,
  aoRadius: 0.1,
  velocidad: 1,
}))
