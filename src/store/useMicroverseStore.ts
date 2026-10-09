import { create } from 'zustand'
import { detectInitialTier, lowerTier, raiseTier, type QualityTier } from '../config/quality.ts'
import { cicloFromSearch } from '../config/urlParams.ts'
import { EcosystemEngine } from '../simulation/EcosystemEngine.ts'
import type { Etapa } from '../simulation/types.ts'

const initialTier = detectInitialTier()

/** El motor del mundo: uno por sesión. El render lo lee por referencia en `useFrame`. */
function createEngine() {
  const engine = new EcosystemEngine()
  const ciclo = typeof window === 'undefined' ? null : cicloFromSearch(window.location.search)
  if (ciclo !== null) engine.dispatch({ type: 'sol', ciclo })
  return engine
}

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

  /** Instancia del motor. No es estado reactivo: no provoca renders. */
  engine: EcosystemEngine
  /** Copias reactivas de lo que la interfaz necesita saber (cambian pocas veces). */
  etapa: Etapa
  primerBrote: boolean
  sincronia: boolean
  despertar(): void
  llover(intensidad: number): void
  sol(ciclo: number): void
}

const engine = createEngine()

export const useMicroverseStore = create<MicroverseStore>()((set) => ({
  startupTier: initialTier,
  qualityTier: initialTier,
  qualityLocked: false,
  declineQuality: () =>
    set((s) => (s.qualityLocked ? s : { qualityTier: lowerTier(s.qualityTier) })),
  inclineQuality: () =>
    set((s) => (s.qualityLocked ? s : { qualityTier: raiseTier(s.qualityTier) })),
  lockQuality: () => set({ qualityTier: 'baja', qualityLocked: true }),

  engine,
  etapa: engine.state.etapa,
  primerBrote: engine.state.primerBrote,
  sincronia: engine.state.sincronia.activa,
  despertar: () => engine.dispatch({ type: 'despertar' }),
  llover: (intensidad) => engine.dispatch({ type: 'lluvia', intensidad }),
  sol: (ciclo) => engine.dispatch({ type: 'sol', ciclo }),
}))

/**
 * Eventos del motor → estado de la interfaz. El motor emite dentro de su paso,
 * que corre en `useFrame`; nunca se hace setState ahí: se aplaza a una tarea
 * aparte. Son pocos eventos por sesión.
 */
function mirror() {
  const { state } = engine
  useMicroverseStore.setState({
    etapa: state.etapa,
    primerBrote: state.primerBrote,
    sincronia: state.sincronia.activa,
  })
}
for (const event of [
  'despertar',
  'etapa',
  'primerBrote',
  'sincronia:inicio',
  'sincronia:fin',
] as const) {
  engine.on(event, () => setTimeout(mirror, 0))
}
