# 06 · Roadmap y definición de terminado

## Hitos

| Hito | Cuándo | Criterio |
|---|---|---|
| **H0 · Fundaciones** | Hoy | Documentación, stack y decisiones cerradas ✅ |
| **H1 · Captura** | Jornada 4 | Una escena estática que merece una captura, de mañana y de noche ✅ (propuesto; ver evaluación) |
| **H2 · Vivo** | Jornada 9 | Los cuatro actos funcionan sobre el motor; el mundo parece vivo |
| **H3 · Publicado** | Jornada 12 | v1 en una URL pública, con presentación y "cómo se construyó" ✅ (2026-10-11; quedan las pruebas con personas y en móviles reales, que necesitan al usuario) |

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
| 7b | Revisión de Nourish ✅ | Pasada acotada tras dos revisiones externas (capturas `jornada-07b-*`): `smoothstep` de la corteza con bordes válidos; fuentes de lluvia contadas (control, gesto, tecla) para que no se pisen; aviso de exceso de agua (`encharcado` en el motor → "La tierra necesita descansar", tierra saturada y velo en los charcos); árbol seco con `GROWTH.bare` 0,6 (A/B 0,5 · 0,55 · 0,6 · 0,65) para que el despertar tenga copa que encender; lluvia más tenue de cerca; musgo de octaedros en media y baja (A/B a escala de móvil: −26 k triángulos sin diferencia visible) |
| 8 | 03 · Transform ✅ | Ciclo completo con mediodía y atardecer (`timeOfDay`: la luz principal gira con `keyDirection`; contraluz naranja al atardecer), control del sol en la cápsula (arrastre horizontal, flechas), `SunHandle` (orbe arrastrable sobre un arco: Sol de día, luna Vida de noche), `Mushrooms` (lámparas junto al tronco y racimos que asoman con el exceso de agua; brillan de noche; sombras incluidas), `Fireflies` (vuelo y parpadeo en shader, al unísono en la Sincronía), cristal revisado desde tres cámaras (softbox principal más estrecho, F0 0,025 y el estudio de reflejos gira con la cámara en azimut), viento en la copa. Capturas `jornada-08-*` |
| 9 | 04 · Discover ✅ | Raíces colgantes (salen por la base de roca y cuelgan en el vacío, con radio mínimo para verse desde abajo), `HiddenOrganisms` (esporas que flotan en el hueco del corte y una criatura dormida que respira bajo la isla, en el lado opuesto al corte; los gusanos de las raíces se recortan según el orden de recorte), cámara mínima a 1,6 para primeros planos. DOF reconsiderada y **descartada para v1** (el A/B de la jornada 4 ya mostró el coste y el desencuadre ×DPR de `postprocessing`; en primeros planos el bloom y la rugosidad ya dan el aspecto macro). Capturas `jornada-09-*`. **H2 · Vivo** |
| 10 | 05 · Sincronía (en curso) | Hecho: la Sincronía visible (`uSync` compartido: raíces al unísono y más brillantes, floración Sol en la copa, luciérnagas a una, anillo Sol+Vida, halo), persistencia (`store/persistence.ts`, `?nuevo`), atajo `__microverse.sincronia()` para look-dev. Pendiente: calibración con 3 personas, audio ambiente (opcional) |
| 11 | Rendimiento (en curso) | Hecho: herramientas de medición (`?calidad=`, `?stats` también en producción), geometría y bundle medidos en los tres niveles (todo dentro del presupuesto), pérdida de contexto WebGL con aviso y recuperación sin remontar, alternativa sin WebGL 2, chaparrón (toque corto o lector de pantalla) en el control de lluvia, pistas anunciadas, pellizco y `contextmenu` en táctil, test con almacenamiento bloqueado. Pendiente: FPS en los equipos de referencia y prueba de interacciones en Safari iOS y Chrome Android (protocolo abajo; necesita al usuario) |
| 11b | Realismo ✅ | Pasada acotada tras la auditoría de realismo del 2026-10-11 (capturas `jornada-11b-antes-*` y `jornada-11b-*`, misma cámara, nivel Alta): oclusión ambiental N8AO (ADR-014); microdetalle procedural sin texturas (grano, relieve y motas minerales en el suelo; grietas en la corteza; oclusión propia en musgo y mechones; nuevo punto de inserción `normal` en los parches); luz hemisférica, contraluz y niebla interior por ciclo; cristal con halo, limbo y reflejo del anillo del pedestal; pedestal con halo de lámpara y luz hacia la roca; polvo en suspensión. Sin dependencias nuevas |
| 12 | Publicación ✅ | `AboutPanel` ("Cómo se construyó": cartela-diálogo accesible, etiqueta arriba a la derecha y tecla I), imagen OG y metadatos (`public/og.jpg`, generada desde la escena de noche en Sincronía), vídeo de 15 s de la Sincronía (`docs/capturas/jornada-12-sincronia.webm`, grabado con `MediaRecorder` desde el lienzo con la cámara orbitando), fuentes alojadas (ADR-015), deploy final en Railway. **H3 · Publicado** |

## Fase 2 (v2): después de publicar

La v1 está cerrada (H3). La fase 2 toma la lista de espera de [01-vision.md](01-vision.md) en este orden, una jornada cada una, siempre sin romper la definición de terminado de la v1 ni añadir dependencias sin ADR:

| # | Foco | Entregable |
|---|---|---|
| 13 | Audio ambiente ✅ | Generativo con Web Audio, 0 KB descargados (`src/audio/`): dron grave que gana cuerpo con la vitalidad y se oscurece de noche, aire, lluvia que sigue a la lluvia visible, brillo nocturno con las luciérnagas y acorde que crece en la Sincronía. Arranca al tocar la semilla (el gesto que exige el navegador), se actualiza a 10 Hz desde el motor (`AudioDriver`), se calla con la pestaña oculta. Tecla **M** y botón en la cápsula; la preferencia se recuerda (`microverse:sonido`). Mezcla pura con tests (`mix.test.ts`). Pendiente: escuchar en equipos reales y ajustar niveles en `mix.ts` (es look-dev, no ADR) |
| 14 | Compartir tu mundo ✅ | `?mundo=<estado en base64 para URL>` (`store/shareWorld.ts`, con tests de ida y vuelta y de basura). Botón "Copiar enlace de tu mundo" en la cartela (portapapeles; si no está disponible, muestra el enlace). Quien lo abre recibe el mundo tal cual (se hidrata con su propia marca de tiempo: sin ausencia), pasa a ser el suyo y el parámetro se quita de la URL para que recargar no lo reimporte. ~680 caracteres por enlace |
| 15 | Estaciones ✅ | El año del mundo dura `DURACION_ANO` (40 min de mundo) y empieza al despertar la semilla: primavera → verano → otoño → invierno, cíclico, a partir del tiempo acumulado (un mundo guardado vuelve en la estación que le toca; dormido, sigue en primavera). El invierno frena el crecimiento un 30 % (`FRENO_INVIERNO`, coseno suave), nunca el decaer. Visual: `uSeason` tiñe la copa, el musgo y los brotes (otoño ámbar `otono`, invierno pálido `invierno`, ambos en la paleta) y en invierno cada mechón encoge un quinto (también su sombra). Tierra, cristal y luz no cambian. Modo observador: fila `estación`; look-dev: `__microverse.estacion(0…1)`. Capturas `jornada-15-{primavera,verano,otono,invierno}.jpg`. Tests en `simulation/estaciones.test.ts` |
| 16 | Nuevas especies ✅ | Dos, cada una con su condición (`generators/species.ts`, con tests): **helechos** en corona a la sombra del tronco, que brotan por umbral (los cercanos antes) cuando el mundo está vivo y húmedo (`helechos` = vitalidad × humedad), se mojan, se marchitan y cambian de estación; **mariposas** de día cuando el árbol florece (`mariposas` = día × floración × vitalidad), cada una con su nube de la copa como casa, vuelo y aleteo con pausas en el shader, blanco frío para distinguirse de las flores Sol. Instancing (una draw call cada una), cantidades por nivel. Capturas `jornada-16-helechos.jpg`, `jornada-16-mariposas.jpg` |
| 17 | Pulido de dirección de arte ✅ | Pasada acotada tras la revisión visual del 2026-10-27 (capturas de `jornada-17-antes-*` a `jornada-17-*`, misma cámara, estado fijado: despierto, humedad 0,6, vitalidad 0,85, ciclo 0,3, verano). **Musgo ✅ (`suelo`):** sin geometría nueva: cada almohadilla desplaza sus vértices con un hash propio (silueta irregular, el poliedro sigue cerrado) y usa normal esférica suave en vez de la plana por cara, más una pelusa de relieve procedural (`moss.vert/frag.glsl`); el reparto pasa de manto uniforme a **matas con claros de tierra** (`scatterMoss`: densidad y tamaño por ruido, más aplastadas y estiradas; `density`/`sizeAt` en `scatterOnIsland`, con tests). Alta baja de 6000 a 4800 instancias (389 k → 365 k triángulos en esta escena; Media 189 k). En Media y Baja se mantiene el octaedro por presupuesto: de cerca se lee como escamas, aceptable a escala de móvil. **Follaje ✅ (A/B en `arbol`, `jornada-17-copa-antes-arbol` → `jornada-17-copa-arbol`; la vista nueva `copa`, de cerca, solo tiene "después" y queda de referencia para las pasadas siguientes):** misma arquitectura instanciada. Cada mechón desplaza sus vértices con un hash propio (silueta irregular) y su **normal mira desde el centro de su nube** (`cloudCenter`, atributo por instancia desde `scatterTreeFoliage`, mezclada un 30 % con la propia): la nube se sombrea como un volumen blando con la luz real y los mechones solo ponen el borde; se quita el sombreado plano y se añade grano de hojas (`surfNoise`). Mechones estirados en x/z (`stretch`), los que florecen son un 30 % menores (una flor, no una mancha Sol). Alta pasa a icosaedros (`foliageShape`): 3400 × 20 caras en vez de 4500 × 8 (437 k triángulos en `general`, contando el pase de sombra; 365 k antes). Media y Baja siguen con octaedros (197 k en Media, al límite del presupuesto): con la normal de nube ganan volumen aunque el borde siga siendo de escamas. **Estratos ✅ (`corte` y `abajo`, `jornada-17-estratos-antes-*` → `jornada-17-estratos-*`):** las capas pasan de colores de vértice interpolados (borrosos: la malla tiene 28 filas) a pintarse en el fragmento desde la **profundidad por vértice** (`strataDepths` en `generators/island.ts`, con test; atributo `strataDepth`; límites y colores de `STRATA` como uniforms, `uStrata` solo en el suelo). Bandas nítidas que ondulan con ruido, contacto oscuro y hundido entre capas, laminación suave en la arcilla (más lisa: brilla al mojarse), piedras sueltas en las dos tierras, vetas y relieve más hondo en la roca, y menos luz cuanto más hondo. Cero geometría. La cima de la isla vira a humus (los claros del musgo se leen como tierra). Las raíces no se tocan. **Arco del sol y reflejo ✅ (`copa`, `jornada-17-arco-antes-copa` → `jornada-17-arco-copa`; `general` sin cambio):** `closeUpFade` (`config/world.ts`, con test): entre 4 y 2,2 unidades de distancia de cámara el arco casi desaparece, el orbe encoge y pierde halo, y los reflejos del estudio del cristal y su halo bajan al 40 %; el limbo se queda (es lo que dice "vidrio"). Mientras se arrastra el orbe, vuelve del todo; el control de la cápsula no cambia. **Hongos ✅ (`suelo` y `arbol` con `hongos` = 1, `jornada-17-hongos-antes-*` → `jornada-17-hongos-*`):** pie y sombrero con escala independiente por hongo (0,7–1,35 de alto, 0,75–1,3 de ancho) y un tono por hongo (`aTone`, con test): sombreros del hueso pálido al pardo del pie y brillo nocturno de 0,35 a 1,3 (pocos faros, muchos hongos). La semilla sigue siendo lo más luminoso del suelo. **Jornada cerrada**: cinco pasadas, cero geometría salvo el follaje, todo dentro del presupuesto (Alta 437 k, Media 197 k). Lo que queda de la revisión (FPS y móviles reales, personas) sigue necesitando al usuario |
| — | WebGPU/TSL | Solo cuando R3F 10 y Drei 11 salgan de alpha (ADR-001). **Con esto, la fase 2 queda cerrada** salvo WebGPU |

Las pruebas con personas y en móviles reales (definición de terminado, filas 3 y 4) siguen pendientes del usuario y no bloquean la fase 2.

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

### Evaluación del H2 · Vivo (jornada 9)

Los cuatro actos funcionan sobre el motor: despertar (semilla → red → copa), regar (humedad → crecimiento, charcos y aviso de exceso), mover el sol (ciclo completo con luz que gira, hongos y luciérnagas de noche) y explorar (raíces colgantes, esporas y criatura desde abajo; el cristal enmarca desde cualquier ángulo). Capturas `jornada-08-*` y `jornada-09-*`. Lo que aún no está vivo del todo: la Sincronía (jornada 10) y la calibración con personas; el mundo responde, pero todavía no "celebra".

### Evaluación de la jornada 11b · Realismo

Auditoría del 2026-10-11 con la escena completa: el usuario sentía que "le faltaba mucho" para verse real. Diagnóstico con las vistas fijas: nada tocaba nada (sin oclusión), superficies de un solo color por vértice (plástico de cerca), reflejos del cristal con borde duro (pegatinas), pedestal como línea sobre negro y aire vacío. Capturas antes/después, misma cámara y nivel Alta: `jornada-11b-antes-{general,noche,corte,arbol}.jpg` → `jornada-11b-{general,noche,corte,arbol}.jpg`.

| Qué | Antes | Después |
|---|---|---|
| Contacto | Musgo, copa y raíces flotaban | Oclusión ambiental (ADR-014) más oclusión propia por instancia: el musgo es un tapiz con huecos oscuros, cada nube tiene base |
| Materia | Estratos y corteza lisos | Grano, relieve y motas en el suelo; grietas a lo largo del tronco. Todo procedural (0 KB) y apagado en Baja |
| Cristal | Media luna y tira con borde duro; de cerca, trazos pintados | Softboxes más suaves, halo alrededor de cada reflejo, limbo claro en la silueta y arco del anillo del pedestal por abajo (solo cara delantera) |
| Luz | Ambiental plana | Hemisférica (cielo frío, suelo Bosque), contraluz que recorta la copa, niebla interior leve teñida de Vida de noche, luz del anillo sobre la roca |
| Aire | Vacío | Polvo en suspensión, tenue, más visible con el sol alto |

Lo que se probó y se retiró en la misma pasada: reflejar el anillo del pedestal como un softbox blando desde abajo (velaba media esfera de color cálido: ahora es un anillo analítico), la luz puntual pegada al disco (brillo especular en forma de raya), y el halo con anchura proporcional a la suavidad de cada softbox (el rebote del suelo, muy suave, lo desbordaba).

**Pendiente de la auditoría** (no bloquea): fuentes alojadas (Instrument Serif + Geist Mono, jornada 12); FPS en equipos reales con la oclusión activada (protocolo de la jornada 11); el follaje sigue siendo de octaedros (hojas o tarjetas quedan para v2).

**Queda para más adelante** (no bloquea el H1): el follaje de octaedros se lee como mechones a distancia, pero de cerca aún es facetado (hojas o tarjetas con viento en la jornada 7); las estrías de la corteza apenas se ven con la luz actual.

## Orden de recorte

Si hay retraso, se recorta en este orden (lo primero, lo primero que cae):

1. Organismos ocultos (como mucho se mantiene la criatura bajo la isla).
2. Audio ambiente (hecho en la jornada 13, ya no se recorta).
3. Condensación del cristal.

**No se recorta:** lluvia, crecimiento, ciclo día/noche, la red de raíces y la Sincronía. Son el ecosistema principal.

## Definición de terminado (v1)

| # | Requisito | Cómo se verifica |
|---|---|---|
| 1 | Composición atractiva y cámara funcional | Captura aprobada de mañana y de noche; la cámara tiene límites y nada atraviesa el cristal |
| 2 | La lluvia afecta al crecimiento y a la apariencia | Tests 2–4 del motor en verde; el cambio se nota en menos de 10 s de lluvia |
| 3 | Ciclo día/noche con organismos reactivos | Ciclo continuo; hongos y luciérnagas reaccionan; 2 de cada 3 personas de prueba llegan a la Sincronía sin ayuda |
| 4 | Ratón y pantalla táctil | Todas las interacciones probadas en Chrome y Safari de escritorio, Safari iOS y Chrome Android; alternativa con teclado |
| 5 | Publicada, con presentación y explicación | URL pública, `AboutPanel`, vídeo de 15 s, imagen OG ✅ (jornada 12) |
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

### Medición de la jornada 11

Peor caso de la escena (despierta, de noche, lloviendo y en Sincronía), con el nivel fijado por URL. La geometría no cambia con el estado: lluvia, hongos y luciérnagas son instancias fijas que el shader muestra u oculta.

| Nivel | Viewport | Draw calls | Triángulos | Presupuesto |
|---|---|---|---|---|
| Alta | 1280×720 | 49 (69 con oclusión, jornada 11b) | 359 k (389 k con helechos y mariposas, jornada 16; 365 k tras el musgo y 437 k tras el follaje de la jornada 17) | < 150 · < 500 k ✅ |
| Media | 375×812 (móvil) | 49 (70 con oclusión a media resolución) | 185 k (196 k en la jornada 11b: anillo del pedestal y polvo; 197 k en la jornada 17) | < 80 · < 200 k ✅ (2 % de margen; la oclusión es lo primero que se recorta si los FPS no llegan) |
| Baja | 375×812 (móvil) | 41 (43 en la jornada 11b) | 91 k | < 80 · < 200 k ✅ |

| Transferencia | Medido | Presupuesto |
|---|---|---|
| JS inicial (gzip) | 404 KB (487 KB con N8AO, jornada 11b) | ≤ 600 KB ✅ |
| Total sin audio | ~406 KB (sin HDRI, fuentes ni texturas) | ≤ 3 MB ✅ |

El frame justo después de un cambio de DPR o de recuperar el contexto sube a ~70 draw calls (three.js regenera el entorno una vez) y vuelve a 49.

**Lo que no se puede medir aquí:** los FPS. El panel de vista previa solo pinta frames al capturar, así que sus FPS no valen. Hacen falta los equipos de referencia.

**Protocolo para dispositivos reales** (tras el deploy, en la URL pública):

1. Abrir `/?stats&nuevo`. Anotar el nivel con el que arranca (`inicio`) y si baja solo.
2. Despertar la semilla, regar hasta que brote, llevar el sol a la noche y esperar 30 s. Anotar FPS y ms.
3. Repetir con `/?stats&calidad=alta`, `…=media` y `…=baja` (el nivel queda fijo).
4. Interacciones: tocar la semilla, mantener el botón de lluvia, toque corto (chaparrón), pulsación larga sobre el lienzo, arrastrar el sol (cápsula y orbe), girar con un dedo y pellizcar para acercar.

| Equipo | Navegador | Nivel inicial | FPS alta | FPS media | FPS baja | Interacciones |
|---|---|---|---|---|---|---|
| _pendiente_ | | | | | | |

Criterio: el nivel automático debe dar ≥ 30 FPS en móvil y ~60 en escritorio. Si no, se ajustan las cifras de `config/quality.ts` (no hace falta ADR: son parámetros).

## Riesgos

| Riesgo | Prob. | Impacto | Mitigación |
|---|---|---|---|
| El cristal produce artefactos de transparencia | Alta | Medio | Caras trasera y delantera por separado, `renderOrder`, `depthWrite={false}`; se ataca en la jornada 1 |
| El árbol procedural se ve genérico | Media | Alto | Semilla y parámetros ajustados a mano; plan B: modelado en Blender (ADR-003) |
| Bloom + DOF hunden el rendimiento en móvil | Alta | Medio | Niveles de calidad; DOF solo en Alta |
| Las reglas del motor no se "sienten" | Media | Alto | `ObserverMode` + Leva para calibrar en vivo; prueba con 3 personas en la jornada 10 |
| Aumento de alcance | Alta | Alto | Esta definición de terminado + "Fuera de alcance" en la visión; las ideas nuevas van a la lista de v2 |
| Rotura por actualización de dependencias | Baja | Medio | Versiones exactas, lockfile, actualizaciones solo con ADR |
