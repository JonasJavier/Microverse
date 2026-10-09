# 06 · Roadmap y definición de terminado

## Hitos

| Hito | Cuándo | Criterio |
|---|---|---|
| **H0 · Fundaciones** | Hoy | Documentación, stack y decisiones cerradas ✅ |
| **H1 · Captura** | Jornada 4 | Una escena estática que merece una captura, de mañana y de noche ✅ (propuesto; ver evaluación) |
| **H2 · Vivo** | Jornada 9 | Los cuatro actos funcionan sobre el motor; el mundo parece vivo |
| **H3 · Publicado** | Jornada 12 | v1 en una URL pública, con presentación y "cómo se construyó" |

"Jornada" es una sesión de trabajo, no un día de calendario. Hay **2 jornadas de colchón** reservadas para imprevistos: no se usan para añadir funcionalidades.

## Plan por jornadas

| # | Foco | Entregable |
|---|---|---|
| 0 | Arranque ✅ | Vite + dependencias fijadas, lint/test en verde, Git + GitHub, **indexado en codebase-memory**, `palette.ts`, `quality.ts`, Canvas con herramientas de depuración. Deploy en Railway (ADR-011) |
| 1 | Look-dev del cristal ✅ | `GlassSphere` (shader Fresnel) comparado con MTM, `Environment` con Lightformers, `Pedestal`, fondo, `PostFX` base (bloom + viñeta). Se cierra ADR-004 |
| 2 | Isla y subsuelo ✅ | `islandGenerator`, corte de diorama con estratos (se cierra ADR-008), musgo instanciado (`scatter`), luz de mañana fija |
| 3 | Generadores ✅ | Pulido A/B (reflejos, pedestal, estratos por valor). `spaceColonization`, `tree`, `roots`, `tubes` con tests; `LifeTree` y `RootNetwork` estáticos; nervio semilla → tronco garantizado; grafo con `distance` por las conexiones |
| 4 | Composición ✅ | Árbol bonsái (nubes, tronco en "S", nebari; se cierra ADR-003), métrica de cobertura corregida, material de raíces por grosor, `ciclo` mañana/noche, media luna del cristal recolocada, presupuesto móvil recuperado. DOF descartada en A/B. **H1 · Captura** |
| 5 | Motor ✅ | `EcosystemEngine` (8 escenarios + calibración con un visitante simulado), store con el motor, `SimulationDriver`, `ObserverMode` (tecla O), panel Leva para calibrar (acciones, velocidad ×1/×5/×20, constantes). El ciclo pasa a vivir en el motor; `?noche` en la URL |
| 6 | 01 · Awakening ✅ | Tocar la semilla (área de toque de ~45 px en móvil, botón para teclado), encendido por la red con chispa Sol, pulsos con `temperament` como atributo por vértice, luz bajo la corteza, la copa se enciende nube a nube, cartela de entrada |
| 7 | 02 · Nourish ✅ | `RainSystem` (instanced, en shader), charcos con ondas solo al encharcar, crecimiento del árbol por `pathDistance` (`uGrowth`, sombras incluidas), suelo y musgo según humedad y marchitez, brotes desde la semilla, cápsula con la lluvia (mantener), pulsación larga y tecla R |
| 8 | 03 · Transform | `SunHandle` + `ExperienceControls`, ciclo de iluminación, `Mushrooms` con brillo, `Fireflies` |
| 9 | 04 · Discover | Límites de cámara, raíces colgantes, `HiddenOrganisms`; reconsiderar DOF solo para primeros planos. **H2 · Vivo** |
| 10 | 05 · Sincronía | Final, calibración del motor con 3 personas, audio ambiente, persistencia |
| 11 | Rendimiento | Niveles de calidad medidos en dispositivos reales, táctil, accesibilidad, pérdida de contexto WebGL |
| 12 | Publicación | `AboutPanel`, imagen OG, vídeo de 15 s de la Sincronía, deploy final. **H3 · Publicado** |

## Rúbrica del H1 (jornada 4)

El árbol no está terminado porque el algoritmo funcione: la colonización da estructuras orgánicas, pero no garantiza una buena composición. El H1 se aprueba con capturas de mañana y de noche, **misma cámara**, contra esta tabla:

| Criterio | Qué se comprueba |
|---|---|
| Silueta | El árbol se reconoce **como mancha negra** a tamaño miniatura (si funciona en negro, funciona siempre) |
| Composición | Se distinguen a la primera el árbol, la semilla y el corte |
| Iluminación | La tierra conserva volumen incluso en las zonas oscuras |
| Cristal | Los reflejos enmarcan, no distraen de los elementos principales |
| Día/noche | Las dos versiones tienen personalidad propia |

Si el árbol procedural no pasa, se activa el plan B de ADR-003 (Blender). No es un fracaso: el objetivo es una escena extraordinaria, no que todo salga de una fórmula.

**Punto de partida tras la jornada 3** (capturas `jornada-03-*`): la silueta ya tiene tronco en "S", bifurcación y tres masas con huecos, pero en el encuadre por defecto el árbol se ve pequeño y la copa, fina; el follaje de esferas se lee como brócoli de cerca. A trabajar en la jornada 4: escala del árbol, volumen de la copa, follaje de tarjetas u hojas y cuello del tronco con raíces expuestas.

### Evaluación del H1 (jornada 4)

Capturas con la misma cámara (`__microverse.view('general')`): `jornada-04-manana.jpg` y `jornada-04-noche.jpg`; silueta antes y después en `jornada-04-silueta-*.png`.

| Criterio | Resultado |
|---|---|
| Silueta | ✅ A 160 px se reconoce un bonsái sin dudar (antes: un árbol genérico y pequeño). Nubes por capas, tronco en "S" y nebari al pie |
| Composición | ✅ Árbol (mitad superior), semilla (centro) y corte (abajo) se leen a la primera, de día y de noche |
| Iluminación | ✅ de día. ⚠️ De noche los estratos solo se intuyen en la cara que mira al relleno; la otra la sostienen las raíces. Aceptado: es una noche |
| Cristal | ✅ La media luna sube al borde superior y enmarca la copa; tira derecha y arco inferior discretos |
| Día/noche | ✅ Mañana cálida y vegetal; noche fría donde la red de raíces es la protagonista |

**Profundidad de campo: descartada** tras el A/B. Con un rango que no desenfoque las raíces, en el encuadre por defecto no hay diferencia visible; cuesta varias pasadas y, además, el efecto de `postprocessing` desencuadra la imagen (×DPR) tras ciertos cambios de cámara. Se reconsidera solo para primeros planos (jornada 9).

**Queda para más adelante** (no bloquea el H1): el follaje de octaedros se lee como mechones a distancia, pero de cerca aún es facetado (hojas o tarjetas con viento en la jornada 7); las estrías de la corteza apenas se ven con la luz actual.

## Orden de recorte

Si hay retraso, se recorta en este orden (lo primero, lo primero que cae):

1. Organismos ocultos (como mucho se mantiene la criatura bajo la isla).
2. Audio ambiente.
3. Condensación del cristal.

**No se recorta:** lluvia, crecimiento, ciclo día/noche, la red de raíces y la Sincronía. Son el ecosistema principal.

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
