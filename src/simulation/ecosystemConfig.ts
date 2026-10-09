/**
 * Constantes del motor (docs/05-ecosystem-engine.md · Configuración inicial).
 * Son puntos de partida: se calibran con el panel de la jornada 5 y con
 * personas reales en la jornada 10.
 */
export interface EcosystemConfig {
  /** Paso fijo de la simulación (s). */
  TICK: number
  /** Máximo de pasos por frame: evita la espiral de la muerte tras un parón. */
  MAX_PASOS_POR_FRAME: number
  /** Arranque y parada de la lluvia (/s). */
  K_LLUVIA_SUAVE: number
  /** Agua aportada a intensidad 1 (/s). */
  K_LLUVIA: number
  /** Evaporación base (/s). */
  K_EVAP: number
  /** Inercia de la energía solar (/s). */
  K_SOL: number
  BANDA_HUMEDAD: readonly [number, number]
  BANDA_ENERGIA: readonly [number, number]
  /** Tolerancia fuera de una banda: distancia a la que su factor llega a 0. */
  CAIDA_BANDA: number
  K_CRECER: number
  K_DECAER: number
  /** Suelo de la vitalidad tras despertar: el mundo nunca muere. */
  VITALIDAD_MIN: number
  K_HONGOS: number
  /** Humedad a partir de la cual el mundo avisa de exceso de agua. */
  UMBRAL_ENCHARCADO: number
  /** Segundos seguidos por encima del umbral antes de avisar. */
  T_ENCHARCADO: number
  /** Salud y vitalidad mínimas para estar en equilibrio. */
  EQUILIBRIO_SALUD: number
  EQUILIBRIO_VITALIDAD: number
  /** Segundos de equilibrio necesarios para la Sincronía. */
  T_SINCRONIA: number
  DURACION_SINCRONIA: number
  /** Segundos entre el inicio de una Sincronía y la siguiente. */
  COOLDOWN_SINCRONIA: number
  /** Tope de la recuperación offline (s). */
  AUSENCIA_MAX: number
  /** Paso de la recuperación offline (s). */
  PASO_OFFLINE: number
  /** Evaporación durante la ausencia (un terrario cerrado recicla su agua). */
  FACTOR_EVAP_OFFLINE: number
}

export const DEFAULT_CONFIG: EcosystemConfig = {
  TICK: 0.1,
  MAX_PASOS_POR_FRAME: 5,
  K_LLUVIA_SUAVE: 1.5,
  K_LLUVIA: 0.06,
  K_EVAP: 0.004,
  K_SOL: 0.015,
  BANDA_HUMEDAD: [0.35, 0.7],
  BANDA_ENERGIA: [0.3, 0.75],
  CAIDA_BANDA: 0.3,
  K_CRECER: 0.03,
  K_DECAER: 0.01,
  VITALIDAD_MIN: 0.1,
  K_HONGOS: 0.02,
  UMBRAL_ENCHARCADO: 0.8,
  T_ENCHARCADO: 2,
  EQUILIBRIO_SALUD: 0.85,
  EQUILIBRIO_VITALIDAD: 0.75,
  T_SINCRONIA: 40,
  DURACION_SINCRONIA: 12,
  COOLDOWN_SINCRONIA: 180,
  AUSENCIA_MAX: 7200,
  PASO_OFFLINE: 1,
  FACTOR_EVAP_OFFLINE: 0.2,
}
