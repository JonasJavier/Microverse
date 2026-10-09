import { create } from 'zustand'
import { detectInitialTier, lowerTier, raiseTier, type QualityTier } from '../config/quality.ts'
import { cicloFromSearch, nuevoMundoFromSearch } from '../config/urlParams.ts'
import { EcosystemEngine } from '../simulation/EcosystemEngine.ts'
import { STORAGE_KEY, restoreEngine } from './persistence.ts'
import type { Etapa } from '../simulation/types.ts'

const initialTier = detectInitialTier()

/** Intensidad de la lluvia del visitante: suave (docs/01 · acto 02). */
export const LLUVIA_SUAVE = 0.7

/**
 * Quién mantiene la lluvia. Cada fuente se cuenta por separado: soltar la tecla
 * mientras se sigue pulsando el control no la para (y viceversa).
 */
export type FuenteLluvia = 'control' | 'gesto' | 'tecla'
const fuentesLluvia = new Set<FuenteLluvia>()

/** `localStorage` puede no existir o estar bloqueado (modo privado): entonces no se recuerda nada. */
function safeStorage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

/**
 * El motor del mundo: uno por sesión. El render lo lee por referencia en `useFrame`.
 * Si hay un mundo guardado, vuelve como lo dejaste, algo más seco (ADR-007);
 * `?nuevo` lo olvida y empieza de cero.
 */
function createEngine() {
  const search = typeof window === 'undefined' ? '' : window.location.search
  const storage = safeStorage()
  if (storage && nuevoMundoFromSearch(search)) storage.removeItem(STORAGE_KEY)
  const engine = restoreEngine(storage, Date.now())
  const ciclo = cicloFromSearch(search)
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
  /** El visitante ya ha hecho llover alguna vez (la pista de la lluvia desaparece). */
  haLlovido: boolean
  /** Exceso de agua sostenido: la interfaz pide descanso ("La tierra necesita descansar"). */
  encharcado: boolean
  /** El visitante ya ha movido el sol alguna vez (la pista del sol desaparece). */
  haMovidoSol: boolean
  despertar(): void
  llover(intensidad: number): void
  /**
   * Lluvia del visitante: control, pulsación larga o tecla R. Llueve mientras
   * quede alguna fuente activa; parar una fuente que no estaba activa no hace nada.
   */
  empezarLluvia(fuente: FuenteLluvia): void
  pararLluvia(fuente: FuenteLluvia): void
  /** Ciclo absoluto (URL, panel de desarrollo). */
  sol(ciclo: number): void
  /** Sol del visitante (control, orbe, flechas): desplaza el ciclo y cuenta como usado. */
  moverSol(delta: number): void
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
  // Un mundo recuperado ya pasó por esas pistas: no se repiten.
  haLlovido: engine.state.primerBrote,
  encharcado: engine.state.encharcado,
  despertar: () => engine.dispatch({ type: 'despertar' }),
  llover: (intensidad) => engine.dispatch({ type: 'lluvia', intensidad }),
  empezarLluvia: (fuente) => {
    // Antes de despertar no hay lluvia (el motor la ignora): tampoco cuenta como hecha.
    if (!engine.state.despertado) return
    fuentesLluvia.add(fuente)
    engine.dispatch({ type: 'lluvia', intensidad: LLUVIA_SUAVE })
    set({ haLlovido: true })
  },
  pararLluvia: (fuente) => {
    if (!fuentesLluvia.delete(fuente) || fuentesLluvia.size > 0) return
    engine.dispatch({ type: 'lluvia', intensidad: 0 })
  },
  sol: (ciclo) => engine.dispatch({ type: 'sol', ciclo }),
  haMovidoSol: engine.state.primerBrote,
  moverSol: (delta) => {
    // El control del sol aparece con el primer brote: antes no hay sol que mover.
    if (!engine.state.primerBrote || delta === 0) return
    engine.dispatch({ type: 'sol', ciclo: engine.state.ciclo + delta })
    set({ haMovidoSol: true })
  },
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
    encharcado: state.encharcado,
  })
}
for (const event of [
  'despertar',
  'etapa',
  'primerBrote',
  'sincronia:inicio',
  'sincronia:fin',
  'encharcado',
] as const) {
  engine.on(event, () => setTimeout(mirror, 0))
}
