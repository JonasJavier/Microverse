/**
 * Tipos del motor del ecosistema (docs/05-ecosystem-engine.md). TypeScript puro:
 * sin React ni Three. El render solo lee `VisualParams` (todo 0..1).
 */

export type Etapa = 'dormido' | 'despertando' | 'creciendo' | 'floreciendo'

export interface EcosystemState {
  /** La semilla fue tocada. */
  despertado: boolean
  /**
   * `tiempo` del mundo al despertar (null: dormido). El render mide desde aquí
   * el encendido de la red: es determinista y un mundo recuperado no se vuelve
   * a encender.
   */
  despertadoEn: number | null
  /** 0 mañana · 0.35 mediodía · 0.65 atardecer · 1 noche. Lo controla el visitante. */
  ciclo: number
  /** Intensidad de lluvia pedida (0..1). */
  lluviaObjetivo: number
  /** Lluvia real: sigue a la pedida con suavizado. */
  lluvia: number
  /** Luz instantánea según el ciclo. */
  luz: number
  /** Promedio lento de la luz (~65 s). */
  energiaSolar: number
  humedad: number
  /** Salud del mundo: la memoria de cómo se le ha cuidado. */
  vitalidad: number
  hongos: number
  /**
   * Exceso de agua sostenido (humedad por encima de `UMBRAL_ENCHARCADO` durante
   * `T_ENCHARCADO`). Con histéresis: se apaga al volver a la banda de humedad.
   */
  encharcado: boolean
  /** Segundos seguidos por encima del umbral de encharcado. */
  tiempoEncharcado: number
  /** Segundos seguidos en equilibrio (oculto). */
  equilibrio: number
  etapa: Etapa
  /** La vitalidad pasó de 0.2 alguna vez (aparece el control del sol). */
  primerBrote: boolean
  sincronia: {
    activa: boolean
    /** Segundos desde el inicio de la Sincronía en curso. */
    tiempo: number
    /** `tiempo` del mundo al empezar la última (null: nunca). */
    ultimoInicio: number | null
  }
  /** Tiempo simulado total (s). */
  tiempo: number
}

/** Parámetros visuales normalizados (0..1) que interpreta el render. */
export interface VisualParams {
  crecimiento: number
  brilloRaices: number
  frecuenciaPulso: number
  pulsoSemilla: number
  marchitez: number
  sueloHumedo: number
  lluvia: number
  hongos: number
  brilloHongos: number
  luciernagas: number
  floracion: number
  /** 0 → 1 → 0 durante la Sincronía. */
  sincronia: number
  /** Noche (smoothstep del ciclo): la comparten varios parámetros. */
  noche: number
}

export type EcosystemAction =
  | { type: 'despertar' }
  /** 0..1; 0 = detener. */
  | { type: 'lluvia'; intensidad: number }
  /** 0..1. */
  | { type: 'sol'; ciclo: number }

export type EcosystemEvent =
  | 'despertar'
  | 'etapa'
  | 'primerBrote'
  | 'sincronia:inicio'
  | 'sincronia:fin'
  /** `encharcado` cambió (en cualquier sentido). */
  | 'encharcado'

/** Mundo guardado ("el mundo te recuerda", ADR-007). */
export interface SavedWorld {
  version: 1
  estado: EcosystemState
  /** Marca de tiempo (ms) del guardado. La pone quien guarda: el motor no lee el reloj. */
  guardadoEn: number
}
