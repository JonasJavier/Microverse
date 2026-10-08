import { create } from 'zustand'
import { detectInitialTier, lowerTier, raiseTier, type QualityTier } from '../config/quality.ts'

interface MicroverseStore {
  qualityTier: QualityTier
  /** Si el rendimiento oscila, el nivel queda fijo (PerformanceMonitor · onFallback). */
  qualityLocked: boolean
  declineQuality(): void
  inclineQuality(): void
  lockQuality(): void
}

export const useMicroverseStore = create<MicroverseStore>()((set) => ({
  qualityTier: detectInitialTier(),
  qualityLocked: false,
  declineQuality: () =>
    set((s) => (s.qualityLocked ? s : { qualityTier: lowerTier(s.qualityTier) })),
  inclineQuality: () =>
    set((s) => (s.qualityLocked ? s : { qualityTier: raiseTier(s.qualityTier) })),
  lockQuality: () => set({ qualityTier: 'baja', qualityLocked: true }),
}))
