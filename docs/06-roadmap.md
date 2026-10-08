# 06 · Roadmap y definición de terminado

## Hitos

| Hito | Cuándo | Criterio |
|---|---|---|
| **H0 · Fundaciones** | Hoy | Documentación, stack y decisiones cerradas ✅ |
| **H1 · Captura** | Jornada 4 | Una escena estática que merece una captura, de mañana y de noche |
| **H2 · Vivo** | Jornada 9 | Los cuatro actos funcionan sobre el motor; el mundo parece vivo |
| **H3 · Publicado** | Jornada 12 | v1 en una URL pública, con presentación y "cómo se construyó" |

"Jornada" es una sesión de trabajo, no un día de calendario. Hay **2 jornadas de colchón** reservadas para imprevistos: no se usan para añadir funcionalidades.

## Plan por jornadas

| # | Foco | Entregable |
|---|---|---|
| 0 | Arranque ✅ | Vite + dependencias fijadas, lint/test en verde, Git + GitHub, **indexado en codebase-memory**, `palette.ts`, `quality.ts`, Canvas con herramientas de depuración. Deploy en Railway (ADR-011) |
| 1 | Look-dev del cristal ✅ | `GlassSphere` (shader Fresnel) comparado con MTM, `Environment` con Lightformers, `Pedestal`, fondo, `PostFX` base (bloom + viñeta). Se cierra ADR-004 |
| 2 | Isla y subsuelo | `islandGenerator`, corte de diorama con estratos (se cierra ADR-008), musgo instanciado (`scatter`), luz de mañana fija |
| 3 | Generadores | `spaceColonization`, `treeGenerator`, `rootGenerator` con tests; `LifeTree` y `RootNetwork` estáticos |
| 4 | Composición | Árbol definitivo (se cierra ADR-003), encuadre, `CameraControls`, DOF, versión de noche estática. **H1 · Captura** |
| 5 | Motor | `EcosystemEngine` + tests, store, `SimulationDriver`, `ObserverMode`, panel Leva para calibrar |
| 6 | 01 · Awakening | `Seed`, shader `rootPulse`, encendido por ramas, `IntroOverlay` |
| 7 | 02 · Nourish | `RainSystem`, `Puddles`, shader `growth` (`uGrowth`), shader de vegetación (humedad/marchitez), gestos |
| 8 | 03 · Transform | `SunHandle` + `ExperienceControls`, ciclo de iluminación, `Mushrooms` con brillo, `Fireflies` |
| 9 | 04 · Discover | Límites de cámara, raíces colgantes, `HiddenOrganisms`. **H2 · Vivo** |
| 10 | 05 · Sincronía | Final, calibración del motor con 3 personas, audio ambiente, persistencia |
| 11 | Rendimiento | Niveles de calidad medidos en dispositivos reales, táctil, accesibilidad, pérdida de contexto WebGL |
| 12 | Publicación | `AboutPanel`, imagen OG, vídeo de 15 s de la Sincronía, deploy final. **H3 · Publicado** |

## Definición de terminado (v1)

| # | Requisito | Cómo se verifica |
|---|---|---|
| 1 | Composición atractiva y cámara funcional | Captura aprobada de mañana y de noche; la cámara tiene límites y nada atraviesa el cristal |
| 2 | La lluvia afecta al crecimiento y a la apariencia | Tests 2–4 del motor en verde; el cambio se nota en menos de 10 s de lluvia |
| 3 | Ciclo día/noche con organismos reactivos | Ciclo continuo; hongos y luciérnagas reaccionan; 2 de cada 3 personas de prueba llegan a la Sincronía sin ayuda |
| 4 | Ratón y pantalla táctil | Todas las interacciones probadas en Chrome y Safari de escritorio, Safari iOS y Chrome Android; alternativa con teclado |
| 5 | Publicada, con presentación y explicación | URL pública, `AboutPanel`, vídeo de 15 s, imagen OG |
| + | Calidad técnica | Sin errores en consola; pérdida de contexto WebGL con mensaje y recuperación; funciona sin `localStorage` |

## Presupuesto de rendimiento

Objetivos que hay que **validar**, no resultados garantizados.

| Métrica | Escritorio (Alta) | Móvil (Media/Baja) |
|---|---|---|
| FPS | ~60 | ≥ 30 |
| Draw calls | < 150 | < 80 |
| Triángulos | < 500 k | < 200 k |
| DPR máximo | 2 | 1.5 |
| JS inicial (gzip) | ≤ 600 KB | ≤ 600 KB |
| Transferencia total sin audio | ≤ 3 MB | ≤ 3 MB |
| Primer frame | < 3 s (cable) | < 5 s (4G) |

**Equipos de referencia:** escritorio de gama media (gráfica integrada reciente o GTX 1650 a 1080p) y móvil de gama media (iPhone 12 / Pixel 6a). Se confirman en la jornada 11.

## Riesgos

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| El cristal produce artefactos de transparencia | Alta | Medio | Caras trasera y delantera por separado, `renderOrder`, `depthWrite={false}`; se ataca en la jornada 1 |
| El árbol procedural se ve genérico | Media | Alto | Semilla y parámetros ajustados a mano; plan B: modelado en Blender (ADR-003) |
| Bloom + DOF hunden el rendimiento en móvil | Alta | Medio | Niveles de calidad; DOF solo en Alta |
| Las reglas del motor no se "sienten" | Media | Alto | `ObserverMode` + Leva para calibrar en vivo; prueba con 3 personas en la jornada 10 |
| Aumento de alcance | Alta | Alto | Esta definición de terminado + "Fuera de alcance" en la visión; las ideas nuevas van a la lista de v2 |
| Rotura por actualización de dependencias | Baja | Medio | Versiones exactas, lockfile, actualizaciones solo con ADR |
