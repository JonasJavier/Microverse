import { create } from 'zustand'
import { detectInitialTier, lowerTier, raiseTier, type QualityTier } from '../config/quality.ts'

const initialTier = detectInitialTier()

interface MicroverseStore {
  /**
   * Nivel con el que arrancó la experiencia. Fija lo que cuesta reconstruir
   * (MSAA y resolución del post-proceso): cambiarlo en caliente provoca un tirón
   * justo cuando el rendimiento ya va mal.
   */
  startupTier: QualityTier
  /** Nivel actual: adapta en caliente lo barato (DPR). */
  qualityTier: QualityTier
  /** Si el rendimiento oscila, el nivel queda fijo (PerformanceMonitor · onFallback). */
  qualityLocked: boolean
  declineQuality(): void
  inclineQuality(): void
  lockQuality(): void
}

export const useMicroverseStore = create<MicroverseStore>()((set) => ({
  startupTier: initialTier,
  qualityTier: initialTier,
  qualityLocked: false,
  declineQuality: () =>
    set((s) => (s.qualityLocked ? s : { qualityTier: lowerTier(s.qualityTier) })),
  inclineQuality: () =>
    set((s) => (s.qualityLocked ? s : { qualityTier: raiseTier(s.qualityTier) })),
  lockQuality: () => set({ qualityTier: 'baja', qualityLocked: true }),
}))
