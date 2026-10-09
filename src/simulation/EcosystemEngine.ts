import { DEFAULT_CONFIG, type EcosystemConfig } from './ecosystemConfig.ts'
import { clamp01, computeVisuals, curvaLuz, etapaDe, salud, smoothstep } from './rules.ts'
import type {
  EcosystemAction,
  EcosystemEvent,
  EcosystemState,
  SavedWorld,
  VisualParams,
} from './types.ts'

/** Estado inicial: tierra seca y semilla dormida (docs/05 · Estado). */
export function initialState(): EcosystemState {
  return {
    despertado: false,
    ciclo: 0.15,
    lluviaObjetivo: 0,
    lluvia: 0,
    luz: curvaLuz(0.15),
    energiaSolar: 0.5,
    humedad: 0.05,
    vitalidad: 0,
    hongos: 0,
    equilibrio: 0,
    etapa: 'dormido',
    primerBrote: false,
    sincronia: { activa: false, tiempo: 0, ultimoInicio: null },
    tiempo: 0,
  }
}

function emptyVisuals(): VisualParams {
  return {
    crecimiento: 0,
    brilloRaices: 0,
    frecuenciaPulso: 0,
    pulsoSemilla: 0,
    marchitez: 0,
    sueloHumedo: 0,
    lluvia: 0,
    hongos: 0,
    brilloHongos: 0,
    luciernagas: 0,
    floracion: 0,
    sincronia: 0,
    noche: 0,
  }
}

const copyState = (s: EcosystemState): EcosystemState => ({ ...s, sincronia: { ...s.sincronia } })

const NUMBER_KEYS = [
  'ciclo',
  'lluviaObjetivo',
  'lluvia',
  'luz',
  'energiaSolar',
  'humedad',
  'vitalidad',
  'hongos',
] as const

/** Un mundo guardado puede venir corrupto (localStorage): se valida antes de usarlo. */
function isValidState(s: unknown): s is EcosystemState {
  if (typeof s !== 'object' || s === null) return false
  const state = s as Record<string, unknown>
  return (
    typeof state.despertado === 'boolean' &&
    typeof state.primerBrote === 'boolean' &&
    NUMBER_KEYS.every((k) => {
      const v = state[k]
      return typeof v === 'number' && v >= 0 && v <= 1
    }) &&
    typeof state.tiempo === 'number' &&
    Number.isFinite(state.tiempo) &&
    typeof state.equilibrio === 'number' &&
    Number.isFinite(state.equilibrio) &&
    typeof state.sincronia === 'object' &&
    state.sincronia !== null
  )
}

/**
 * Motor del ecosistema (ADR-005): TypeScript puro, determinista, a paso fijo.
 * No lee el reloj ni usa azar: el tiempo entra por `step` y por `hydrate`.
 */
export class EcosystemEngine {
  private config: EcosystemConfig
  private readonly estado: EcosystemState
  private readonly salida = emptyVisuals()
  private readonly listeners = new Map<EcosystemEvent, Set<() => void>>()
  private acumulado = 0
  /** Simulando una ausencia: evaporación reducida y sin Sincronía. */
  private offline = false

  constructor(config: Partial<EcosystemConfig> = {}, estado: EcosystemState = initialState()) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.estado = copyState(estado)
    computeVisuals(this.estado, this.config, this.salida)
  }

  get state(): Readonly<EcosystemState> {
    return this.estado
  }

  /** Objeto reutilizado: no se crea uno por tick. El render lo lee por referencia. */
  get visuals(): Readonly<VisualParams> {
    return this.salida
  }

  get settings(): Readonly<EcosystemConfig> {
    return this.config
  }

  /** Calibración en vivo (panel de desarrollo). */
  configure(config: Partial<EcosystemConfig>) {
    this.config = { ...this.config, ...config }
  }

  on(event: EcosystemEvent, callback: () => void): () => void {
    let set = this.listeners.get(event)
    if (!set) this.listeners.set(event, (set = new Set()))
    set.add(callback)
    return () => set.delete(callback)
  }

  private emit(event: EcosystemEvent) {
    for (const callback of this.listeners.get(event) ?? []) callback()
  }

  dispatch(action: EcosystemAction) {
    const s = this.estado
    switch (action.type) {
      case 'despertar':
        if (s.despertado) return
        s.despertado = true
        s.vitalidad = Math.max(s.vitalidad, this.config.VITALIDAD_MIN)
        this.emit('despertar')
        this.updateEtapa()
        break
      case 'lluvia':
        // Antes de despertar, la lluvia no existe: es la puerta del acto 02.
        if (s.despertado) s.lluviaObjetivo = clamp01(action.intensidad)
        break
      case 'sol':
        s.ciclo = clamp01(action.ciclo)
        s.luz = curvaLuz(s.ciclo)
        break
    }
    computeVisuals(s, this.config, this.salida)
  }

  /**
   * Avanza el tiempo de un frame con pasos fijos. Como máximo
   * `MAX_PASOS_POR_FRAME`: tras un parón (pestaña congelada) se descarta el resto.
   */
  step(dt: number) {
    const { TICK, MAX_PASOS_POR_FRAME } = this.config
    this.acumulado = Math.min(this.acumulado + Math.max(0, dt), TICK * MAX_PASOS_POR_FRAME)
    // El margen evita perder un tick por el redondeo de sumar 0.1 muchas veces.
    while (this.acumulado >= TICK - 1e-9) {
      this.tick(TICK)
      this.acumulado -= TICK
    }
  }

  /** Avanza `seconds` sin el tope por frame (tests, calibración, recuperación). */
  advance(seconds: number, paso = this.config.TICK) {
    const steps = Math.round(seconds / paso)
    for (let i = 0; i < steps; i++) this.tick(paso)
  }

  private updateEtapa() {
    const etapa = etapaDe(this.estado)
    if (etapa === this.estado.etapa) return
    this.estado.etapa = etapa
    this.emit('etapa')
  }

  private tick(dt: number) {
    const s = this.estado
    const c = this.config
    s.tiempo += dt
    s.luz = curvaLuz(s.ciclo)

    // Dormido, el mundo está en pausa: espera a que lo toquen.
    if (!s.despertado) {
      computeVisuals(s, c, this.salida)
      return
    }

    s.lluvia += (s.lluviaObjetivo - s.lluvia) * Math.min(1, c.K_LLUVIA_SUAVE * dt)
    s.energiaSolar += (s.luz - s.energiaSolar) * c.K_SOL * dt
    s.humedad += s.lluvia * c.K_LLUVIA * dt
    const evaporacion = c.K_EVAP * (this.offline ? c.FACTOR_EVAP_OFFLINE : 1)
    s.humedad -= s.humedad * evaporacion * (0.25 + s.luz) * dt
    s.humedad = clamp01(s.humedad)

    const ahora = salud(s.humedad, s.energiaSolar, c)
    const k = ahora > s.vitalidad ? c.K_CRECER : c.K_DECAER
    s.vitalidad = Math.max(c.VITALIDAD_MIN, s.vitalidad + (ahora - s.vitalidad) * k * dt)

    const encharcado = smoothstep(0.55, 0.9, s.humedad)
    s.hongos += (0.2 + 0.8 * encharcado - s.hongos) * c.K_HONGOS * dt

    if (!s.primerBrote && s.vitalidad > 0.2) {
      s.primerBrote = true
      this.emit('primerBrote')
    }
    this.updateEtapa()

    const enEquilibrio = ahora >= c.EQUILIBRIO_SALUD && s.vitalidad >= c.EQUILIBRIO_VITALIDAD
    s.equilibrio = enEquilibrio ? s.equilibrio + dt : Math.max(0, s.equilibrio - 2 * dt)

    const sync = s.sincronia
    if (sync.activa) {
      sync.tiempo += dt
      if (sync.tiempo >= c.DURACION_SINCRONIA) {
        sync.activa = false
        sync.tiempo = 0
        s.equilibrio = 0
        this.emit('sincronia:fin')
      }
    } else if (
      !this.offline &&
      s.equilibrio >= c.T_SINCRONIA &&
      (sync.ultimoInicio === null || s.tiempo - sync.ultimoInicio >= c.COOLDOWN_SINCRONIA)
    ) {
      sync.activa = true
      sync.tiempo = 0
      sync.ultimoInicio = s.tiempo
      this.emit('sincronia:inicio')
    }

    computeVisuals(s, c, this.salida)
  }

  /** `guardadoEn`: marca de tiempo en ms; la pone quien guarda (el motor no lee el reloj). */
  serialize(guardadoEn: number): SavedWorld {
    return { version: 1, estado: copyState(this.estado), guardadoEn }
  }

  /**
   * Recupera un mundo guardado y simula la ausencia ("el mundo te recuerda"):
   * hasta `AUSENCIA_MAX`, sin lluvia, con el ciclo guardado y la evaporación
   * reducida. Vuelve algo más seco, nunca muerto. Si el guardado no es válido,
   * empieza un mundo nuevo.
   */
  static hydrate(
    saved: SavedWorld | null | undefined,
    ahoraMs: number,
    config: Partial<EcosystemConfig> = {},
  ): EcosystemEngine {
    if (!saved || saved.version !== 1 || !isValidState(saved.estado)) {
      return new EcosystemEngine(config)
    }
    const engine = new EcosystemEngine(config, saved.estado)
    const s = engine.estado
    s.lluviaObjetivo = 0
    s.lluvia = 0
    s.sincronia = { ...s.sincronia, activa: false, tiempo: 0 }
    const ausencia = Math.min(
      Math.max(0, (ahoraMs - saved.guardadoEn) / 1000),
      engine.config.AUSENCIA_MAX,
    )
    engine.offline = true
    engine.advance(ausencia, engine.config.PASO_OFFLINE)
    engine.offline = false
    return engine
  }
}
