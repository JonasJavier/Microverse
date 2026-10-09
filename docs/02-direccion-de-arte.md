# 02 · Dirección de arte

**Fórmula:** naturaleza fantástica + ciencia ficción minimalista + fotografía macro cinematográfica.
**Imagen guía:** una pieza de museo en la oscuridad, fotografiada con un objetivo macro.

## Paleta y roles

| Token | Hex | Rol | Regla |
|---|---|---|---|
| Vacío | `#080F17` | Fondo, vacío, niebla nocturna | Siempre detrás. Nunca negro puro. |
| Bosque | `#183E33` | Vegetación profunda, sombras, tinte del suelo | Color base de las masas oscuras. |
| Musgo | `#75AA82` | Musgo, hojas iluminadas, tonos medios | Color base de la vida vegetal. |
| Vida | `#73E2D7` | Bioluminiscencia: raíces, hongos, luciérnagas | **Solo luz (emissive).** |
| Sol | `#EFC77D` | Luz cálida, sol, pulso de la semilla, floración | **Solo luz (emissive o luz).** |

**Regla de oro:** *Vida* y *Sol* son luz, no pintura. Nunca se usan como color base de un material. Así conservan su magia y el bloom solo afecta a lo que debe brillar.

**Narrativa del color:** la vida empieza cálida (la semilla, *Sol*) y de noche se vuelve fría (*Vida*). En la Sincronía, las dos conviven por primera vez.

**Tonos derivados (a validar en look-dev):** tierra `#14110D`, piedra `#2A2E2B`, reflejo del cristal `#CFE9E4`, corteza `#2E2620`, raíz viva `#7A6E60` (pálida: se lee sobre los estratos oscuros). Todos se definen en `src/config/palette.ts`; ningún color se escribe directamente en un componente.

## Composición

- **Óptica:** FOV ~30° (teleobjetivo). Menos distorsión y sensación de fotografía de producto o macro.
- **Encuadre:** esfera centrada, ligeramente por encima del centro; pedestal debajo; mucho espacio negativo.
- **Árbol:** asimétrico, en el tercio izquierdo de la isla, inclinado hacia la luz.
- **Pedestal:** un aro o disco fino de cristal negro, flotando con un pequeño hueco bajo la esfera, con un anillo de luz tenue (*Sol* de día, *Vida* de noche).
- **Responsive:** en escritorio (16:9) la esfera ocupa ~70 % de la altura; en móvil vertical, ~85 % del ancho. La distancia de cámara se ajusta al aspecto.
- **Fondo:** *Vacío* con un degradado radial muy sutil y viñeta.

## Iluminación: ciclo día/noche

Un único parámetro `ciclo` (0 → 1) controla toda la iluminación (`config/timeOfDay.ts`, fotogramas clave interpolados). Mañana y noche están hechas desde la jornada 4; mediodía y atardecer llegan en la 8 (hasta entonces, la mañana se sostiene hasta 0,65 y la noche entra entre 0,65 y 0,9). Desde la jornada 5 el ciclo vive en el motor; `?noche` en la URL muestra la noche. De noche: luna teñida de Vida que recorta la cima de las nubes, relleno que sostiene los estratos, raíces a pleno brillo (el bloom las recoge), anillo del pedestal en Vida y reflejos del cristal al 30 %. Valores iniciales:

| `ciclo` | Momento | Luz principal | Ambiente / fondo | Emisivos |
|---|---|---|---|---|
| 0.00 | Mañana cálida | *Sol*, ángulo bajo, intensidad media | Bosque tenue, fondo apenas cálido | Bajos |
| 0.35 | Mediodía | Blanco cálido, alta, intensidad máxima | Neutro | Mínimos |
| 0.65 | Atardecer | *Sol* anaranjado, rasante, sombras largas | Contraluz | Empiezan a subir |
| 1.00 | Noche verde azulada | Luz de luna tenue teñida de *Vida* | *Vacío*, niebla interior *Vida* muy sutil | Máximos |

**Entorno:** `<Environment>` de Drei con *Lightformers* (softboxes virtuales), sin HDRI. Da reflejos controlados en el cristal, como los de un estudio fotográfico, y no pesa nada.

## El cristal (ADR-004)

Una esfera real de pared fina **casi no refracta**: lo que la vende son los reflejos, el borde Fresnel y uno o dos brillos especulares de softbox. Decisión (ADR-004, validada en la jornada 1): shader propio de cristal fino en todos los niveles. El brillo principal es un softbox **cenital y algo trasero**: se refleja en ángulo rasante en el borde superior, donde el Fresnel es alto, y dibuja la media luna de la fotografía de producto. `MeshTransmissionMaterial` quedó descartado en el A/B (más caro y peor aspecto).

**El cristal enmarca, no protagoniza** (pulido de la jornada 3): la media luna superior bajó un 20 % (es lo que vende el cristal) y la tira de contraluz derecha un 37 % y un 30 % más fina. El anillo del pedestal queda por debajo del pulso de la semilla. Los reflejos se ajustan con `reflectionGain`, que no cambia cuánto iluminan la escena. En la jornada 4, con el árbol más grande, el softbox cenital se llevó hacia atrás: la media luna sube al borde superior y abraza la copa en vez de caer sobre ella. La cara interior del cristal bajó a la mitad para que su reflejo no dibuje un arco bajo la isla.

Condensación: opcional, estilizada, solo en la parte superior y solo con humedad alta.

## Árbol protagonista (ADR-003)

**Silueta estilizada, acabado macro realista.** Formas de fantasía reconocibles, renderizadas con luz, materiales y profundidad de campo de fotografía.

- **Silueta (jornada 4): bonsái.** Tronco grueso en "S" (moyogi), copa en **nubes** horizontales por capas (seis: ápice, dos altas, dos bajas que se abren a los lados y una trasera) y **nebari**: raíces superficiales que abrazan el suelo antes de hundirse. Pasa la prueba de la mancha negra a 160 px. Referencia: bonsái sobre roca con raíces expuestas.
- **Construcción:** procedural (colonización del espacio → tubos) con semilla fija y parámetros ajustados a mano. El mismo generador produce las raíces hacia abajo. El tronco se traza a mano (curva por puntos de control, en "S" suave): su inclinación es una decisión de composición. La colonización solo pone las ramas hacia las masas de copa, que tienen huecos para que la copa respire.
- **Copa:** mechones instanciados repartidos por cada nube, más densos en la piel; claros arriba (les da la luz) y oscuros abajo, así la nube tiene volumen sin texturas. Con menos mechones (calidad baja), cada uno es mayor y la silueta no cambia. Hojas o tarjetas con viento por shader en la jornada 7.
- **Crecimiento:** un uniform `uGrowth` revela las ramas a lo largo de su longitud; la copa aparece cuando la rama llega a su punto.
- **Floración (Sincronía):** pequeñas flores emisivas *Sol*.

## Subsuelo (ADR-008)

- **Isla:** disco irregular de tierra con musgo arriba y cono invertido de roca abajo.
- **Corte de diorama (validado en la jornada 2):** una cuña frontal de 86°, un poco a la derecha, cortada en limpio. Muestra los estratos `palette.estratos` (césped → humus → tierra → arcilla → tierra profunda → roca), con la red de raíces brillando dentro. La semilla queda en el vértice del corte. Es la imagen distintiva del proyecto.
- **Estratos legibles por valor** (jornada 3): oscuro, medio, claro, oscuro y gris frío. En penumbra el ojo separa luminosidades, no matices; la banda clara de arcilla ordena el corte. Las raíces complementan los estratos, no son lo único que los distingue.
- **Material de las raíces** (jornada 4, referencia de raíces luminosas en un corte de tierra): las raíces maestras tienen cuerpo oscuro y **borde luminoso** (se leen como volumen, no como cable); los filamentos, un brillo uniforme y más tenue, como si siguieran hacia el interior. El grosor llega como atributo de vértice.
- **Raíces como sistema nervioso** (jornada 3): la red nace en la semilla y se abre por las caras del corte, gruesa arriba y fina en profundidad, como dendritas. Un **nervio principal** une la semilla con la base del tronco: asoma entre el musgo en arcos y se vuelve a hundir. Cuando la semilla despierte (jornada 6), las señales viajarán por ese camino hacia el árbol; cada nodo responde a su manera (destello breve o respuesta lenta y tenue), para que se sienta orgánico y no un circuito.
- **Luz del corte:** la cara que mira a la luz principal se ve cálida; la otra la abre un relleno frío desde la derecha (principal cálida + relleno frío, esquema de retrato).
- **Musgo:** miles de almohadillas instanciadas en manchas de Bosque a Musgo, más ralas cerca del borde, con claros alrededor de la semilla y del tronco.
- **Raíces colgantes:** algunas salen por la base de la isla y cuelgan en el vacío con las puntas luminosas. Se descubren al mirar desde abajo.
- **Pulsos:** viajan desde la semilla hacia fuera mediante un atributo de progreso a lo largo de cada raíz.

## Acto 01 · Awakening (jornada 6)

- **Dormido:** la red apenas se intuye; la semilla late sola, lenta y fuerte, y su luz cálida (Sol) calienta el musgo de alrededor. Arriba a la izquierda, la cartela; abajo, una sola indicación: *Toca la semilla*.
- **El toque:** un estallido de luz Sol en la semilla. Desde ahí avanza un **frente de encendido** por las conexiones, con una chispa cálida en la punta: recorre las raíces del corte, cruza el nervio, **trepa por el tronco** y, al llegar a cada nube, la copa destella. Como cada nube está a otra distancia de la semilla, se enciende **nube a nube**. Unos 4 s de la semilla a la copa.
- **Después:** pulsos de luz Vida salen de la semilla al ritmo que marca el motor (más rápido cuanta más vitalidad), y cada destello de la semilla coincide con la salida de un pulso. Cada nodo responde con su **carácter**: destello breve y vivo, o respuesta lenta y tenue. En el tronco, los pulsos suben como luz bajo la corteza, más visible en los bordes.
- **Color:** la señal del despertar es cálida (Sol, la semilla); la red es fría (Vida). Las dos se cruzan en el encendido.
- **El brillo de la red sigue a la salud del mundo** (`brilloRaices`): recién despierta es tenue y crece al cuidarla. De noche se ve mucho más.

## Vegetación y organismos

- **Hongos lámpara** (altos y finos, referencia 1) y **racimos pequeños** sobre raíces y troncos. Brillan con *Vida* de noche.
- **Musgo** instanciado, **brotes y helechos**, **flores pequeñas** que se abren al florecer.
- **Luciérnagas:** pocas (24–60 según calidad), lentas, con trayectorias de ruido y parpadeo asíncrono. **En la Sincronía parpadean al unísono**, como algunas especies reales.
- **Organismos ocultos (Discover):** gusanos luminosos en las raíces, esporas flotantes y una criatura dormida bajo la isla.

## Post-proceso: el aspecto macro

| Efecto | Uso | Calidad |
|---|---|---|
| Bloom selectivo | Umbral alto; solo emisivos > 1 con `toneMapped={false}` | Todas (resolución reducida en baja) |
| Profundidad de campo | Descartada en el A/B de la jornada 4 (sin diferencia visible en el encuadre por defecto); se reconsidera para primeros planos | — |
| Viñeta + grano sutil | Aspecto fotográfico | Todas |
| Tone mapping | **Khronos PBR Neutral** (ADR-012): respeta tono y saturación de la paleta | Todas |

**Prohibido:** aberración cromática exagerada, destellos de lente, glitch y neón saturado.

## Tipografía e interfaz

- Estilo de cartela de museo. Título serif display con tracking amplio y etiquetas pequeñas en monoespaciada. Propuesta a validar: *Instrument Serif* + *Geist Mono*, alojadas en el propio proyecto.
- Interfaz: dos controles (lluvia y sol) en una cápsula translúcida en la parte inferior. Aparecen de forma progresiva. Sin números visibles.
- **Modo observador** (tecla `O`): muestra luz, humedad y vitalidad en monoespaciada pequeña. Sirve para depurar y para la presentación de "cómo se construyó".

## Anti-referencias

Partículas que saturan la pantalla · interfaces de juego o HUD · glassmorphism recargado · colores fuera de paleta · cámara que se mueve sola sin motivo.
