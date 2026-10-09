import { describe, expect, it } from 'vitest'
import { DEFAULT_CONFIG } from './ecosystemConfig.ts'
import { EcosystemEngine } from './EcosystemEngine.ts'
import { banda, curvaLuz, salud } from './rules.ts'
import type { EcosystemEvent } from './types.ts'

const C = DEFAULT_CONFIG

function awake() {
  const engine = new EcosystemEngine()
  engine.dispatch({ type: 'despertar' })
  return engine
}

/** Cuenta los eventos emitidos. */
function recorder(engine: EcosystemEngine) {
  const counts: Partial<Record<EcosystemEvent, number>> = {}
  const events: EcosystemEvent[] = [
    'despertar',
    'etapa',
    'primerBrote',
    'sincronia:inicio',
    'sincronia:fin',
  ]
  for (const e of events) engine.on(e, () => (counts[e] = (counts[e] ?? 0) + 1))
  return counts
}

/**
 * Un visitante atento: riega cuando la tierra se seca y para antes de
 * encharcarla. Avanza segundo a segundo, como alguien que mira y reacciona.
 */
function attentiveVisitor(engine: EcosystemEngine, seconds: number) {
  for (let t = 0; t < seconds; t++) {
    const { humedad } = engine.state
    if (humedad < 0.42) engine.dispatch({ type: 'lluvia', intensidad: 0.5 })
    else if (humedad > 0.55) engine.dispatch({ type: 'lluvia', intensidad: 0 })
    engine.advance(1)
  }
}

describe('reglas', () => {
  it('banda: 1 dentro, cae lineal fuera hasta 0', () => {
    expect(banda(0.5, [0.35, 0.7], 0.3)).toBe(1)
    expect(banda(0.2, [0.35, 0.7], 0.3)).toBeCloseTo(0.5)
    expect(banda(0, [0.35, 0.7], 0.3)).toBe(0)
    expect(banda(1, [0.35, 0.7], 0.3)).toBeCloseTo(0)
  })

  it('curvaLuz pasa por los puntos de la especificación', () => {
    expect(curvaLuz(0)).toBeCloseTo(0.4)
    expect(curvaLuz(0.35)).toBeCloseTo(1)
    expect(curvaLuz(0.65)).toBeCloseTo(0.45)
    expect(curvaLuz(0.85)).toBeCloseTo(0)
    expect(curvaLuz(1)).toBe(0)
  })

  it('sin agua no hay vida; sin sol, vida a medias', () => {
    expect(salud(0, 0.5, C)).toBe(0)
    expect(salud(0.5, 0.5, C)).toBe(1)
    expect(salud(0.5, 0, C)).toBeCloseTo(0.5)
  })
})

describe('EcosystemEngine · escenarios (docs/05)', () => {
  it('1 · sin despertar, el estado visual no cambia por mucho que llueva', () => {
    const engine = new EcosystemEngine()
    const before = { ...engine.visuals }
    engine.dispatch({ type: 'lluvia', intensidad: 1 })
    engine.advance(600)
    expect({ ...engine.visuals }).toEqual(before)
    expect(engine.state.etapa).toBe('dormido')
  })

  it('2 · lluvia moderada y mañana → vitalidad ≥ 0.75 en menos de 120 s', () => {
    const engine = awake()
    engine.dispatch({ type: 'sol', ciclo: 0 })
    engine.dispatch({ type: 'lluvia', intensidad: 0.5 })
    engine.advance(15)
    engine.dispatch({ type: 'lluvia', intensidad: 0 })
    let reached = Infinity
    for (let t = 15; t < 120 && reached === Infinity; t++) {
      engine.advance(1)
      if (engine.state.vitalidad >= 0.75) reached = t + 1
    }
    expect(reached).toBeLessThan(120)
  })

  it('3 · sequía al mediodía → marchitez > 0.5 y la vitalidad baja hasta el mínimo, no más', () => {
    const engine = awake()
    engine.dispatch({ type: 'sol', ciclo: 0 })
    engine.dispatch({ type: 'lluvia', intensidad: 0.5 })
    engine.advance(15)
    engine.dispatch({ type: 'lluvia', intensidad: 0 })
    engine.advance(60)
    const grown = engine.state.vitalidad
    engine.dispatch({ type: 'sol', ciclo: 0.35 })
    engine.advance(900)
    expect(engine.visuals.marchitez).toBeGreaterThan(0.5)
    expect(engine.state.vitalidad).toBeLessThan(grown)
    expect(engine.state.vitalidad).toBeGreaterThanOrEqual(C.VITALIDAD_MIN)
  })

  it('4 · diluvio sostenido → hongos > 0.7 y la salud cae', () => {
    const engine = awake()
    engine.dispatch({ type: 'lluvia', intensidad: 1 })
    engine.advance(180)
    expect(engine.state.hongos).toBeGreaterThan(0.7)
    expect(salud(engine.state.humedad, engine.state.energiaSolar, C)).toBeLessThan(0.3)
  })

  it('4b · el aviso de encharcado llega tras pasarse un rato y se apaga al volver a la banda', () => {
    const engine = awake()
    let cambios = 0
    engine.on('encharcado', () => cambios++)
    engine.dispatch({ type: 'lluvia', intensidad: 1 })
    // Hasta el umbral no hay aviso; al cruzarlo, todavía no (hace falta T_ENCHARCADO).
    while (engine.state.humedad <= C.UMBRAL_ENCHARCADO) engine.advance(0.1)
    expect(engine.state.encharcado).toBe(false)
    engine.advance(C.T_ENCHARCADO + 0.2)
    expect(engine.state.encharcado).toBe(true)
    expect(cambios).toBe(1)
    // Parar la lluvia: el aviso sigue hasta volver a la banda, sin parpadear.
    engine.dispatch({ type: 'lluvia', intensidad: 0 })
    engine.advance(5)
    expect(engine.state.encharcado).toBe(true)
    while (engine.state.humedad > C.BANDA_HUMEDAD[1]) engine.advance(1)
    expect(engine.state.encharcado).toBe(false)
    expect(cambios).toBe(2)
  })

  it('4c · mantener la lluvia suave del visitante sin soltar acaba avisando antes de un minuto', () => {
    const engine = awake()
    engine.dispatch({ type: 'lluvia', intensidad: 0.7 })
    engine.advance(60)
    expect(engine.state.encharcado).toBe(true)
  })

  it('5 · de noche hay luciérnagas solo si hay vitalidad', () => {
    const asleep = new EcosystemEngine()
    asleep.dispatch({ type: 'sol', ciclo: 1 })
    asleep.advance(30)
    expect(asleep.visuals.luciernagas).toBe(0)

    const engine = awake()
    engine.dispatch({ type: 'sol', ciclo: 1 })
    engine.advance(30)
    expect(engine.state.vitalidad).toBeGreaterThan(0)
    expect(engine.visuals.luciernagas).toBeGreaterThan(0)
  })

  it('6 · la Sincronía se dispara una vez, dura lo configurado y respeta el cooldown', () => {
    const engine = awake()
    engine.dispatch({ type: 'sol', ciclo: 0 })
    const counts = recorder(engine)
    let start = -1
    let end = -1
    engine.on('sincronia:inicio', () => (start = engine.state.tiempo))
    engine.on('sincronia:fin', () => (end = engine.state.tiempo))

    attentiveVisitor(engine, 150)
    expect(counts['sincronia:inicio']).toBe(1)
    expect(end - start).toBeCloseTo(C.DURACION_SINCRONIA, 0)
    expect(engine.visuals.sincronia).toBe(0)

    // Durante el cooldown no hay otra, aunque el equilibrio se mantenga.
    const cooldownLeft = start + C.COOLDOWN_SINCRONIA - engine.state.tiempo
    attentiveVisitor(engine, Math.floor(cooldownLeft) - 1)
    expect(counts['sincronia:inicio']).toBe(1)
    // Pasado el cooldown, con equilibrio sostenido, llega la siguiente.
    attentiveVisitor(engine, 60)
    expect(counts['sincronia:inicio']).toBe(2)
  })

  it('7 · determinismo: la misma secuencia produce el mismo estado, bit a bit', () => {
    const run = () => {
      const engine = awake()
      engine.dispatch({ type: 'lluvia', intensidad: 0.7 })
      for (let i = 0; i < 400; i++) engine.step(1 / 60)
      engine.dispatch({ type: 'sol', ciclo: 0.8 })
      engine.dispatch({ type: 'lluvia', intensidad: 0 })
      for (let i = 0; i < 900; i++) engine.step(1 / 60)
      return JSON.stringify({ state: engine.state, visuals: engine.visuals })
    }
    expect(run()).toBe(run())
  })

  it('8 · serialize → hydrate conserva el estado; la ausencia seca sin matar', () => {
    const engine = awake()
    attentiveVisitor(engine, 90)
    const saved = engine.serialize(1_000_000)

    // Vuelta inmediata: mismo estado (salvo la lluvia, que se detiene al irse).
    const back = EcosystemEngine.hydrate(JSON.parse(JSON.stringify(saved)), 1_000_000)
    expect(back.state.vitalidad).toBe(engine.state.vitalidad)
    expect(back.state.humedad).toBe(engine.state.humedad)
    expect(back.state.lluvia).toBe(0)

    // Tres horas fuera (tope de 2 h): más seco, nunca muerto.
    const later = EcosystemEngine.hydrate(saved, 1_000_000 + 3 * 3600 * 1000)
    expect(later.state.humedad).toBeLessThan(engine.state.humedad)
    expect(later.state.vitalidad).toBeGreaterThanOrEqual(C.VITALIDAD_MIN)
    expect(later.state.despertado).toBe(true)
    expect(later.state.tiempo - engine.state.tiempo).toBeCloseTo(C.AUSENCIA_MAX, 0)
  })
})

describe('EcosystemEngine · comportamiento', () => {
  it('step respeta el tope de pasos por frame (sin espiral de la muerte)', () => {
    const engine = awake()
    engine.step(10) // una pestaña congelada 10 s
    expect(engine.state.tiempo).toBeCloseTo(C.TICK * C.MAX_PASOS_POR_FRAME)
  })

  it('emite despertar, primer brote y los cambios de etapa', () => {
    const engine = new EcosystemEngine()
    const counts = recorder(engine)
    const etapas: string[] = []
    engine.on('etapa', () => etapas.push(engine.state.etapa))
    engine.dispatch({ type: 'despertar' })
    engine.dispatch({ type: 'despertar' }) // idempotente
    attentiveVisitor(engine, 90)
    expect(counts.despertar).toBe(1)
    expect(engine.state.despertadoEn).toBe(0)
    expect(counts.primerBrote).toBe(1)
    expect(etapas.slice(0, 3)).toEqual(['despertando', 'creciendo', 'floreciendo'])
  })

  it('el mediodía permanente no lleva al equilibrio: el punto dulce es la mañana', () => {
    const engine = awake()
    engine.dispatch({ type: 'sol', ciclo: 0.35 })
    const counts = recorder(engine)
    attentiveVisitor(engine, 400)
    expect(counts['sincronia:inicio'] ?? 0).toBe(0)
  })

  it('un mundo guardado corrupto empieza de nuevo', () => {
    const broken = { version: 1, estado: { humedad: 'mucha' }, guardadoEn: 0 }
    const engine = EcosystemEngine.hydrate(broken as never, 1000)
    expect(engine.state.despertado).toBe(false)
    expect(engine.state.humedad).toBe(0.05)
  })
})

describe('calibración (docs/05 · objetivo: Sincronía en 2–3 min)', () => {
  it('un visitante atento llega a la Sincronía; sin regar, nunca', () => {
    const engine = awake()
    engine.dispatch({ type: 'sol', ciclo: 0 })
    let at = -1
    engine.on('sincronia:inicio', () => {
      if (at < 0) at = engine.state.tiempo
    })
    attentiveVisitor(engine, 300)
    // Con reacción perfecta tarda ~1,5 min: un visitante real, que antes tiene
    // que descubrir la semilla y el gesto de la lluvia, queda en la franja de
    // 2–3 min. Se valida con personas en la jornada 10.
    expect(at).toBeGreaterThan(60)
    expect(at).toBeLessThan(150)

    const dry = awake()
    const counts = recorder(dry)
    dry.advance(600)
    expect(counts['sincronia:inicio'] ?? 0).toBe(0)
  })
})
