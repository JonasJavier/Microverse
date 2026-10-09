# 05 · EcosystemEngine: especificación

## Objetivo

Pocas reglas, bien elegidas, que produzcan la sensación de un ecosistema autónomo. No es una simulación científica. El motor no sabe nada de Three.js ni de React: recibe acciones, avanza en el tiempo y expone parámetros visuales normalizados (0..1) que el render interpreta.

Todos los valores numéricos de este documento son **puntos de partida** y viven en `ecosystemConfig.ts`. Se calibran con pruebas reales (jornadas 5 y 10).

## Estado

| Variable | Rango | Origen | Descripción |
|---|---|---|---|
| `despertado` | bool | Acción | La semilla fue tocada |
| `despertadoEn` | segundos o null | Acción | `tiempo` del mundo al despertar: el render mide desde aquí el encendido (jornada 6) |
| `ciclo` | 0..1 | Acción (sol) | 0 mañana · 0.35 mediodía · 0.65 atardecer · 1 noche |
| `lluviaObjetivo` | 0..1 | Acción | Intensidad pedida por el usuario |
| `lluvia` | 0..1 | Interna | Sigue a `lluviaObjetivo` con suavizado (arranca y se detiene poco a poco) |
| `luz` | 0..1 | Derivada | Luz instantánea según `ciclo` |
| `energiaSolar` | 0..1 | Acumulada | Promedio lento de `luz` (constante de tiempo ~65 s) |
| `humedad` | 0..1 | Acumulada | Sube con la lluvia y baja por evaporación |
| `vitalidad` | 0..1 | Acumulada | Salud general del mundo |
| `hongos` | 0..1 | Acumulada | Desarrollo de los hongos (favorecido por el exceso de agua) |
| `equilibrio` | segundos | Oculta | Tiempo seguido en equilibrio |
| `etapa` | enum | Derivada | `dormido` · `despertando` · `creciendo` · `floreciendo` |
| `sincronia` | bool + tiempo | Evento | El final está en curso |
| `tiempo` | segundos | Interna | Tiempo simulado total |

**Estado inicial:** tierra seca y semilla dormida. `humedad = 0.05`, `energiaSolar = 0.5`, `ciclo = 0.15`, `vitalidad = 0`, `despertado = false`.

## Tick

- Paso fijo de **0.1 s (10 Hz)**, independiente de los FPS. El render suaviza entre ticks con `easing.damp`.
- Como máximo 5 pasos por frame (evita la espiral de la muerte si una pestaña se congela).
- La recuperación offline usa pasos de 1 s.

## Reglas

```
luz           = curvaLuz(ciclo)
lluvia       += (lluviaObjetivo - lluvia) * K_LLUVIA_SUAVE * dt
energiaSolar += (luz - energiaSolar) * K_SOL * dt
humedad      += lluvia * K_LLUVIA * dt
humedad      -= humedad * K_EVAP * (0.25 + luz) * dt       // más sol → más evaporación
humedad       = clamp01(humedad)

fH    = banda(humedad,      BANDA_HUMEDAD)                  // 1 dentro de la banda, cae lineal fuera
fE    = banda(energiaSolar, BANDA_ENERGIA)
salud = fH * (0.5 + 0.5 * fE)                               // sin agua no hay vida; sin sol, vida a medias

si despertado:
  k          = salud > vitalidad ? K_CRECER : K_DECAER      // crece despacio y decae aún más despacio
  vitalidad += (salud - vitalidad) * k * dt
  vitalidad  = max(vitalidad, VITALIDAD_MIN)                // el mundo nunca muere

encharcado = smoothstep(0.55, 0.90, humedad)
hongos    += ((despertado ? 0.2 + 0.8 * encharcado : 0) - hongos) * K_HONGOS * dt

// Aviso de exceso de agua (con histéresis): se enciende tras T_ENCHARCADO segundos
// por encima de UMBRAL_ENCHARCADO y se apaga al volver a la banda de humedad.
tiempoEncharcado = humedad > UMBRAL_ENCHARCADO ? tiempoEncharcado + dt : 0
encharcadoAviso  = encharcadoAviso ? humedad > BANDA_HUMEDAD[1] : tiempoEncharcado >= T_ENCHARCADO
```

**`banda(x, [a, b])`:** vale 1 si `a ≤ x ≤ b`; fuera, baja linealmente hasta 0 a una distancia `CAIDA_BANDA` (0.3).

**`curvaLuz(ciclo)`** (interpolación suave entre puntos):

| `ciclo` | 0.00 | 0.35 | 0.65 | ≥ 0.85 |
|---|---|---|---|---|
| `luz` | 0.40 | 1.00 | 0.45 | 0.00 |

**Consecuencias de diseño (a propósito):**
- Sin lluvia no hay crecimiento: la lluvia es la puerta del acto 02.
- Demasiada lluvia saca la humedad de la banda (baja la salud) pero dispara los hongos.
- Mediodía permanente → la energía supera la banda (exceso de sol) y la humedad se evapora más rápido. El punto dulce es la mañana o alternar día y noche.
- Una noche larga baja la vitalidad hacia la mitad, nunca a cero.

## Equilibrio y Sincronía

```
enEquilibrio = salud >= 0.85 && vitalidad >= 0.75
equilibrio   = enEquilibrio ? equilibrio + dt : max(0, equilibrio - 2 * dt)

si equilibrio >= T_SINCRONIA y pasó el COOLDOWN:
  emitir 'sincronia:inicio'; sincronia dura DURACION_SINCRONIA; luego 'sincronia:fin'
```

Objetivo de calibración: un visitante atento que no conoce las reglas llega a la Sincronía en **unos 2–3 minutos**.

## Salidas: `VisualParams` (todas 0..1)

| Parámetro | Fórmula inicial | Lo usa |
|---|---|---|
| `crecimiento` | `vitalidad` | `LifeTree` (`uGrowth`), escala de `Vegetation` |
| `brilloRaices` | despertado ? `lerp(0.15, 1, vitalidad) · (0.7 + 0.3·noche)` : 0 | `RootNetwork` |
| `frecuenciaPulso` | `0.25 + 0.75·vitalidad` (Hz, normalizado) | `RootNetwork` |
| `pulsoSemilla` | 1 si dormido, después baja | `Seed` |
| `marchitez` | `clamp01((0.25 − humedad) / 0.2)` | Shader de vegetación (desatura hacia Bosque e inclina) |
| `sueloHumedo` | `humedad` | Oscurecimiento del suelo, `Puddles` |
| `lluvia` | `lluvia` | `RainSystem`, ondas en `Puddles` |
| `hongos` | `hongos` | Escala de `Mushrooms` |
| `brilloHongos` | `hongos · (0.3 + 0.7·noche)` | Emisivo de `Mushrooms` |
| `luciernagas` | `noche · vitalidad · (0.5 + 0.5·min(1, humedad / 0.5))` | Proporción activa de `Fireflies` |
| `floracion` | `smoothstep(0.7, 0.95, vitalidad)`; 1 durante la Sincronía | Flores de `LifeTree` y `Vegetation` |
| `sincronia` | 0→1→0 en la duración del evento | Pulso sincronizado, luciérnagas al unísono, brillo global |

donde `noche = smoothstep(0.70, 0.90, ciclo)`. La iluminación (`Lighting`) lee `ciclo` directamente: es control del usuario, no decisión del motor.

## Eventos

`despertar` · `etapa` (cambio) · `primerBrote` (vitalidad > 0.2 por primera vez → aparece el control del sol) · `sincronia:inicio` · `sincronia:fin` · `encharcado` (el aviso de exceso de agua cambió; la interfaz muestra "La tierra necesita descansar").

## API

```ts
export type EcosystemAction =
  | { type: 'despertar' }
  | { type: 'lluvia'; intensidad: number } // 0..1; 0 = detener
  | { type: 'sol'; ciclo: number }         // 0..1

export class EcosystemEngine {
  constructor(config?: Partial<EcosystemConfig>, estado?: EcosystemState)
  dispatch(action: EcosystemAction): void
  step(dt: number): void                   // un frame: pasos fijos, como máximo MAX_PASOS_POR_FRAME
  advance(segundos: number, paso?: number): void // sin tope por frame: tests, calibración, ausencia
  configure(config: Partial<EcosystemConfig>): void // calibración en vivo
  get state(): Readonly<EcosystemState>
  get visuals(): Readonly<VisualParams>    // objeto reutilizado: no se crea uno por tick
  on(evento: EcosystemEvent, cb: () => void): () => void
  serialize(guardadoEn: number): SavedWorld // la marca de tiempo la pone quien guarda
  static hydrate(saved: SavedWorld | null, ahoraMs: number): EcosystemEngine
}
```

- El motor **no** llama a `Date.now()` ni a `Math.random()`: el tiempo entra por `step`, `advance` e `hydrate`. Así es determinista y testeable.

## Implementación (jornada 5)

Decisiones tomadas al implementar, donde la especificación dejaba hueco:

- **Dormido, el mundo está en pausa.** Antes de despertar no hay evaporación ni crecimiento, y la acción `lluvia` se ignora: la lluvia es la puerta del acto 02. Así se cumple el escenario 1 al pie de la letra. El `sol` sí funciona siempre (es iluminación).
- **Etapas:** `dormido` (sin despertar) → `despertando` (hasta el primer brote, vitalidad > 0.2) → `creciendo` → `floreciendo` (vitalidad ≥ 0.7). Para dejar de florecer hay que bajar de 0.6: sin esa histéresis, un mundo en el umbral cambiaría de etapa en cada tick.
- **`pulsoSemilla`** = 1 dormido; tras despertar, `1 − smoothstep(VITALIDAD_MIN, 0.4, vitalidad)`: la semilla se calma cuando el mundo coge vida.
- **`sincronia`** (visual) = `sin(π · t / DURACION)`: entra y sale suave. Al terminar, el equilibrio vuelve a 0.
- **`hydrate`** valida el guardado (localStorage puede venir corrupto: se empieza de nuevo) y durante la ausencia no puede empezar una Sincronía: el visitante tiene que vivirla.
- **Eventos → interfaz:** el motor emite dentro de su paso, que corre en `useFrame`. El store refleja `etapa`, `primerBrote` y `sincronia` aplazando el `setState` a una tarea aparte: nunca se hace setState dentro de `useFrame`.

**Calibración:** un visitante simulado que riega cuando la tierra se seca y para antes de encharcarla llega a la primera Sincronía en **~90 s**. Un visitante real, que antes tiene que descubrir la semilla y el gesto de la lluvia, debería quedar en los 2–3 min del objetivo; se valida con tres personas en la jornada 10. Sin regar no llega nunca, y con mediodía permanente tampoco (exceso de sol): los tests lo comprueban.

## Persistencia: "el mundo te recuerda"

- `hydrate` simula la ausencia: `min(ausencia, 2 h)`, sin lluvia, con el `ciclo` guardado.
- Durante la ausencia la evaporación se multiplica por `0.2` (un terrario cerrado recicla su agua).
- Al volver, el mundo está algo más seco, nunca muerto. Una línea sutil: *"Tu mundo te esperaba."*

## Configuración inicial (`ecosystemConfig.ts`)

| Constante | Valor | Efecto |
|---|---|---|
| `TICK` | 0.1 s | Paso fijo |
| `K_LLUVIA_SUAVE` | 1.5 /s | Arranque y parada de la lluvia (~1 s) |
| `K_LLUVIA` | 0.06 /s | Agua aportada a intensidad 1 |
| `K_EVAP` | 0.004 /s | Evaporación base |
| `K_SOL` | 0.015 /s | Inercia de la energía (~65 s) |
| `BANDA_HUMEDAD` | [0.35, 0.70] | Humedad ideal |
| `BANDA_ENERGIA` | [0.30, 0.75] | Energía ideal |
| `CAIDA_BANDA` | 0.3 | Tolerancia fuera de la banda |
| `K_CRECER` | 0.03 /s | 0.1 → 0.75 en ~45 s con salud plena |
| `K_DECAER` | 0.01 /s | Decaimiento indulgente |
| `VITALIDAD_MIN` | 0.1 | Suelo tras despertar |
| `K_HONGOS` | 0.02 /s | Crecimiento de los hongos |
| `UMBRAL_ENCHARCADO` | 0.8 | Humedad a partir de la cual se avisa del exceso de agua |
| `T_ENCHARCADO` | 2 s | Tiempo seguido por encima del umbral antes de avisar |
| `T_SINCRONIA` | 40 s | Equilibrio necesario |
| `DURACION_SINCRONIA` | 12 s | Duración del final |
| `COOLDOWN_SINCRONIA` | 180 s | Entre sincronías |
| `AUSENCIA_MAX` | 7200 s | Tope de la recuperación offline |
| `FACTOR_EVAP_OFFLINE` | 0.2 | Evaporación durante la ausencia |

## Escenarios de test (Vitest)

1. Sin despertar, el estado visual no cambia por mucho que llueva o pase el tiempo.
2. Lluvia moderada + mañana → `vitalidad ≥ 0.75` en menos de 120 s simulados.
3. Sequía (sin lluvia, mediodía) → `marchitez > 0.5` y la vitalidad baja, sin pasar de `VITALIDAD_MIN`.
4. Diluvio sostenido → `hongos > 0.7` y la salud baja.
5. De noche aparecen luciérnagas solo si `vitalidad > 0`.
6. La Sincronía se dispara una vez, dura lo configurado y respeta el cooldown.
7. Determinismo: la misma secuencia de acciones produce el mismo estado, bit a bit.
8. `serialize` → `hydrate` de ida y vuelta conserva el estado; la ausencia seca el mundo sin matarlo.
