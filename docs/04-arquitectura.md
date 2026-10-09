# 04 · Arquitectura

## Principios

1. **La simulación va separada del render.** `EcosystemEngine` es TypeScript puro, determinista y testeable. No sabe que existe Three.js.
2. **Flujo unidireccional.** Gesto → acción → motor → parámetros visuales (0..1) → uniforms suavizados.
3. **Cero re-renders de React por frame.** El render lee el motor por referencia dentro de `useFrame`.
4. **Procedural y determinista.** Árbol, raíces, isla y distribución de la vegetación salen de generadores con semilla fija: la composición se dirige artísticamente y siempre se ve igual.
5. **La calidad adaptativa es parte del diseño**, no un parche final.

## Estructura de carpetas

```
microverse/
├── CLAUDE.md
├── README.md
├── docs/
├── public/
│   ├── fonts/
│   └── audio/                    # ambiente (opcional, jornada 10)
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── config/
    │   ├── palette.ts            # tokens de color (única fuente)
    │   ├── quality.ts            # niveles alto / medio / bajo
    │   └── world.ts              # semilla del mundo, dimensiones, constantes
    ├── simulation/               # TS puro: sin react, sin three
    │   ├── types.ts
    │   ├── ecosystemConfig.ts
    │   ├── rules.ts              # funciones puras (bienestar, curvaLuz…)
    │   ├── EcosystemEngine.ts
    │   ├── persistence.ts        # serializar / hidratar + recuperación offline
    │   └── EcosystemEngine.test.ts
    ├── generators/               # geometría procedural (sin react)
    │   ├── random.ts             # PRNG con semilla
    │   ├── graph.ts              # grafo de ramificación: ids estables, distancias, radios
    │   ├── spaceColonization.ts  # algoritmo común a árbol y raíces
    │   ├── tree.ts               # tronco trazado + copa por colonización + follaje
    │   ├── roots.ts              # nervio semilla → tronco + red por colonización
    │   ├── tubes.ts              # grafo → malla de tubos (atributo `distance`)
    │   ├── island.ts             # forma de la isla, malla con corte de diorama y estratos
    │   ├── scatter.ts            # distribución de musgo, piedras, hongos
    │   └── *.test.ts
    ├── store/
    │   └── useMicroverseStore.ts # instancia del motor, acciones, UI, nivel de calidad
    ├── experience/
    │   ├── MicroverseCanvas.tsx  # <Canvas>, PerformanceMonitor, AdaptiveDpr
    │   ├── MicroverseScene.tsx   # composición de la escena
    │   ├── SimulationDriver.tsx  # useFrame → engine.step a tick fijo
    │   ├── camera/CameraRig.tsx
    │   ├── lighting/
    │   │   ├── Studio.tsx        # Environment con Lightformers, luz principal y relleno
    │   │   └── timeOfDay.ts      # `ciclo` → look resuelto (luces, reflejos, raíces, anillo, fondo)
    │   ├── debug/
    │   │   ├── DevTools.tsx      # FPS, contadores, Leva (solo desarrollo)
    │   │   └── lookdevTools.ts   # vistas fijas, modo captura, prueba de silueta
    │   ├── world/
    │   │   ├── GlassSphere.tsx
    │   │   ├── Pedestal.tsx
    │   │   ├── island.ts         # ISLAND: forma compartida, SEED_POSITION, TREE_BASE
    │   │   ├── life.ts           # ROOT_NETWORK, TREE y claros del musgo (generados al cargar)
    │   │   ├── geometry.ts       # datos de generador → BufferGeometry / InstancedMesh / tubos
    │   │   ├── FloatingIsland.tsx
    │   │   ├── GroundCover.tsx   # musgo y piedras (instancing)
    │   │   ├── Seed.tsx
    │   │   ├── LifeTree.tsx
    │   │   ├── RootNetwork.tsx
    │   │   ├── Vegetation.tsx
    │   │   ├── Mushrooms.tsx
    │   │   └── HiddenOrganisms.tsx
    │   ├── effects/
    │   │   ├── RainSystem.tsx
    │   │   ├── Puddles.tsx
    │   │   ├── Fireflies.tsx
    │   │   ├── InnerMist.tsx
    │   │   └── PostFX.tsx
    │   └── interaction/
    │       ├── SunHandle.tsx     # orbe solar arrastrable
    │       └── useGestures.ts    # toque / arrastre / pulsación larga
    ├── shaders/
    │   ├── common/               # noise.glsl, fresnel.glsl…
    │   ├── glass/                # glass.vert, glass.frag
    │   ├── rootPulse/
    │   ├── growth/               # revelado de ramas por uGrowth
    │   └── vegetation/           # viento, marchitez, humedad
    ├── audio/
    │   └── AmbientAudio.ts       # Web Audio (opcional)
    └── ui/
        ├── IntroOverlay.tsx
        ├── ExperienceControls.tsx
        ├── ObserverMode.tsx
        └── AboutPanel.tsx        # "cómo se construyó"
```

**Cambios respecto a la propuesta original:**
- `GlassDome` → `GlassSphere` (es una esfera, no una campana).
- Nuevos: `generators/` (procedural y testeable), `config/`, `SimulationDriver`, `PostFX`, `Seed`, `Mushrooms`, `Pedestal`, `HiddenOrganisms`, `interaction/` y `ObserverMode`.
- Shaders organizados por efecto, con vertex y fragment separados.
- Tests junto al código que prueban.

## Flujo de datos

```
[Gesto / UI] ──acción──▶ useMicroverseStore ──dispatch──▶ EcosystemEngine
                                                            │ step(0.1 s) a tick fijo
                                                            ▼
                                                    VisualParams (0..1)
                                                            │ lectura por referencia en useFrame
                                                            ▼
                         Componentes 3D: easing.damp → uniforms / escalas / intensidades

[UI DOM] ◀── suscripción selectiva (etapa, primer brote, sincronía, nivel de calidad) ── store
Lighting ◀── engine.state.ciclo (acción `sol`: lo controla el visitante, no lo decide el motor)
```

**Implementado en la jornada 5:**
- `useMicroverseStore` crea el motor (uno por sesión) y expone las acciones `despertar`, `llover` y `sol`. `?noche`, `?manana` o `?ciclo=0.65` fijan el ciclo al arrancar (`config/urlParams.ts`).
- `SimulationDriver` llama a `engine.step(delta)` en `useFrame` con prioridad −2: todo lo que se dibuja en el frame ve el mundo ya actualizado.
- Los eventos del motor (`etapa`, `primerBrote`, `sincronia:*`) se reflejan en el store **aplazando** el `setState` a una tarea aparte: el motor emite dentro de `useFrame` y ahí nunca se hace setState.
- `ui/ObserverMode` (tecla O) lee el motor por referencia en su propio bucle de `requestAnimationFrame` y escribe en el DOM: sin renders de React por frame.

## Responsabilidades por capa

| Capa | Puede importar | No puede importar |
|---|---|---|
| `simulation/` | nada externo | `react`, `three`, `zustand` |
| `generators/` | `three` (matemáticas), `simplex-noise` | `react` |
| `store/` | `simulation/`, `zustand` | `three` |
| `experience/` | todo lo anterior, R3F, Drei | — |
| `ui/` | `store/`, `config/` | `three`, `experience/` |

## Patrones R3F obligatorios

- **Nunca** `setState` en `useFrame`. Leer `useMicroverseStore.getState().engine.visuals` y mutar uniforms o refs.
- **Sin asignaciones de memoria por frame:** `Vector3`, `Color` y `Matrix4` se preasignan a nivel de módulo o con `useMemo`.
- **Uniforms:** objeto creado una vez con `useMemo`; solo se muta `.value`.
- **Instancing** para musgo, piedras, hierba, gotas y luciérnagas.
- **Raycast solo donde hace falta:** semilla, orbe solar y zonas interactivas. El resto con `raycast={() => null}`.
- **Orden de transparencias:** opacos → partículas → cara trasera del cristal (`BackSide`) → cara delantera (`FrontSide`), con `depthWrite={false}` en el cristal y `renderOrder` explícito.
- Las geometrías procedurales se generan en `useMemo` a partir de la semilla; R3F las libera al desmontar.

## La red de vida como grafo (jornada 3)

Árbol y raíces son **un solo sistema nervioso** en dos grafos encadenados:

```
semilla (nodo 0 de las raíces) ── nervio principal ──▶ base del tronco ──▶ ramas ──▶ follaje
                │                                         (nodo 0 del árbol)
                └── ramificación por colonización (suelo y caras del corte)
```

- **Camino garantizado:** el nervio semilla → tronco se traza a mano antes de la colonización, que por sí sola no asegura la conexión.
- **Ids estables:** coinciden con el índice y el padre siempre es anterior al hijo: no hay ciclos posibles.
- **`distance`** es la longitud acumulada **por las conexiones** desde la semilla, no la distancia en línea recta. El árbol continúa la de las raíces. Va como atributo de vértice en los tubos: los pulsos (jornada 6) y el crecimiento `uGrowth` (jornada 7) la usan sin recalcular nada.
- **`toTree`** (raíces): lo que le falta a cada nodo para llegar al tronco. **`temperament`**: carácter de cada nodo (respuesta breve y viva o lenta y tenue) para que la red no parezca un circuito. Para la jornada 6 queda decidir cómo llega al shader (atributo por vértice o función determinista por nodo).
- **`exposed`** (raíces, jornada 4): solo el nervio y lo que aflora en las caras del corte genera malla. El resto de la red vive en el grafo (los pulsos la recorren) sin coste de triángulos: −79 % de la malla de raíces (36k → 7,6k triángulos en nivel medio).
- **Cobertura de la colonización:** `colonize` distingue atractores alcanzados, bloqueados y pendientes; `measureCoverage` comprueba aparte, con geometría, qué fracción queda cerca de la red terminada. Los tests lo exigen con tres semillas.

## Look-dev automatizado (solo desarrollo)

`window.__microverse` expone `view(nombre)` (vistas de cámara fijas para comparar con la misma cámara), `capture(true)` (oculta los paneles), `silhouette(true)` (el árbol en negro sobre blanco: prueba de la mancha negra del H1) y el store de look-dev (`ciclo`).

## Calidad adaptativa

| | Alta | Media | Baja |
|---|---|---|---|
| DPR máximo | 2 | 1.5 | 1 |
| Cristal | Fresnel + entorno (MTM si se justifica) | Fresnel + entorno | Fresnel simple |
| Bloom | Completo | Media resolución | Media resolución, menos niveles |
| Instancias de musgo | ~6000 | ~2400 | ~1200 |
| Lados de los tubos (árbol y raíces) | 8 | 6 | 5 |
| Mechones de follaje | 4500 | 2800 | 1600 |
| Segmentos del cristal | 128×64 | 64×32 | 56×28 |
| Luciérnagas | 60 | 40 | 24 |
| Gotas de lluvia | 1500 | 800 | 400 |
| Sombras | 1024, suaves | 1024 | Sin sombras dinámicas (sombra falsa) |

- **Nivel inicial:** táctil o pantalla pequeña → Media; escritorio → Alta.
- `PerformanceMonitor` de Drei: `onDecline` baja un nivel, `onIncline` sube uno; si oscila (`onFallback`), se queda fijo en el más bajo.
- **Qué se adapta en caliente (ADR-013):** solo lo barato, el DPR. Lo que reconstruye recursos (MSAA del post-proceso, resolución del bloom) se fija con el nivel de arranque (`startupTier`): cambiarlo en caliente provocaba un tirón y un fallo de encuadre.
- Las cifras son puntos de partida: se calibran midiendo en la jornada 11.

## Interacción

- **Cámara:** `CameraControls` de Drei con amortiguación, sin desplazamiento lateral. Ángulo polar de 20° a 150° (se puede mirar desde abajo para ver las raíces colgantes) y distancia mínima y máxima.
- **Gestos:** toque o clic = interactuar; arrastre = orbitar; pulsación larga (más de 400 ms con menos de 8 px de movimiento) = lluvia. Funciona igual con ratón y en táctil.
- **Teclado:** mantener `R` = lluvia · `←`/`→` = sol · `O` = modo observador · `M` = silenciar.
- **Accesibilidad:** con `prefers-reduced-motion` se reducen las partículas y los movimientos automáticos de cámara. Los controles tienen `aria-label`.

## Persistencia

- Clave de `localStorage`: `microverse:v1` → `{ version, estado, guardadoEn }`.
- Se guarda cada 10 s y cuando la pestaña pasa a segundo plano (`visibilitychange`).
- Al volver, se simula el tiempo de ausencia (con tope) sin lluvia. El mundo nunca baja del mínimo de vitalidad.
- Todo el acceso va dentro de `try/catch`: la experiencia funciona igual sin almacenamiento.

## Testing

- **Vitest:** reglas del motor, determinismo, serialización de ida y vuelta, y generadores (misma semilla → misma geometría; número de elementos dentro del presupuesto).
- **Visual:** checklist manual y capturas por hito en `docs/capturas/`.
