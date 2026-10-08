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

**Tonos derivados (a validar en look-dev):** tierra `#14110D`, piedra `#2A2E2B`, reflejo del cristal `#CFE9E4`. Todos se definen en `src/config/palette.ts`; ningún color se escribe directamente en un componente.

## Composición

- **Óptica:** FOV ~30° (teleobjetivo). Menos distorsión y sensación de fotografía de producto o macro.
- **Encuadre:** esfera centrada, ligeramente por encima del centro; pedestal debajo; mucho espacio negativo.
- **Árbol:** asimétrico, en el tercio izquierdo de la isla, inclinado hacia la luz.
- **Pedestal:** un aro o disco fino de cristal negro, flotando con un pequeño hueco bajo la esfera, con un anillo de luz tenue (*Sol* de día, *Vida* de noche).
- **Responsive:** en escritorio (16:9) la esfera ocupa ~70 % de la altura; en móvil vertical, ~85 % del ancho. La distancia de cámara se ajusta al aspecto.
- **Fondo:** *Vacío* con un degradado radial muy sutil y viñeta.

## Iluminación: ciclo día/noche

Un único parámetro `ciclo` (0 → 1) controla toda la iluminación. Valores iniciales, se ajustan en look-dev:

| `ciclo` | Momento | Luz principal | Ambiente / fondo | Emisivos |
|---|---|---|---|---|
| 0.00 | Mañana cálida | *Sol*, ángulo bajo, intensidad media | Bosque tenue, fondo apenas cálido | Bajos |
| 0.35 | Mediodía | Blanco cálido, alta, intensidad máxima | Neutro | Mínimos |
| 0.65 | Atardecer | *Sol* anaranjado, rasante, sombras largas | Contraluz | Empiezan a subir |
| 1.00 | Noche verde azulada | Luz de luna tenue teñida de *Vida* | *Vacío*, niebla interior *Vida* muy sutil | Máximos |

**Entorno:** `<Environment>` de Drei con *Lightformers* (softboxes virtuales), sin HDRI. Da reflejos controlados en el cristal, como los de un estudio fotográfico, y no pesa nada.

## El cristal (ADR-004)

Una esfera real de pared fina **casi no refracta**: lo que la vende son los reflejos, el borde Fresnel y uno o dos brillos especulares de softbox. Decisión (ADR-004, validada en la jornada 1): shader propio de cristal fino en todos los niveles. El brillo principal es un softbox **cenital y algo trasero**: se refleja en ángulo rasante en el borde superior, donde el Fresnel es alto, y dibuja la media luna de la fotografía de producto. `MeshTransmissionMaterial` quedó descartado en el A/B (más caro y peor aspecto).

Condensación: opcional, estilizada, solo en la parte superior y solo con humedad alta.

## Árbol protagonista (ADR-003)

**Silueta estilizada, acabado macro realista.** Formas de fantasía reconocibles, renderizadas con luz, materiales y profundidad de campo de fotografía.

- **Silueta:** tronco inclinado, raíz superficial expuesta y 2 o 3 masas de copa de aspecto musgoso (como en la referencia 1), asimétricas. Tiene que leerse en miniatura y como silueta de noche.
- **Construcción:** procedural (colonización del espacio → tubos) con semilla fija y parámetros ajustados a mano. El mismo generador produce las raíces hacia abajo.
- **Copa:** grupos de instancias (tarjetas u hojas) con viento por shader.
- **Crecimiento:** un uniform `uGrowth` revela las ramas a lo largo de su longitud; la copa aparece cuando la rama llega a su punto.
- **Floración (Sincronía):** pequeñas flores emisivas *Sol*.

## Subsuelo (ADR-008)

- **Isla:** disco irregular de tierra con musgo arriba y cono invertido de roca abajo.
- **Corte de diorama (validado en la jornada 2):** una cuña frontal de 86°, un poco a la derecha, cortada en limpio. Muestra los estratos `palette.estratos` (césped → humus → tierra → arcilla → tierra profunda → roca), con la red de raíces brillando dentro. La semilla queda en el vértice del corte. Es la imagen distintiva del proyecto.
- **Luz del corte:** la cara que mira a la luz principal se ve cálida; la otra la abre un relleno frío desde la derecha (principal cálida + relleno frío, esquema de retrato).
- **Musgo:** miles de almohadillas instanciadas en manchas de Bosque a Musgo, más ralas cerca del borde, con claros alrededor de la semilla y del tronco.
- **Raíces colgantes:** algunas salen por la base de la isla y cuelgan en el vacío con las puntas luminosas. Se descubren al mirar desde abajo.
- **Pulsos:** viajan desde la semilla hacia fuera mediante un atributo de progreso a lo largo de cada raíz.

## Vegetación y organismos

- **Hongos lámpara** (altos y finos, referencia 1) y **racimos pequeños** sobre raíces y troncos. Brillan con *Vida* de noche.
- **Musgo** instanciado, **brotes y helechos**, **flores pequeñas** que se abren al florecer.
- **Luciérnagas:** pocas (24–60 según calidad), lentas, con trayectorias de ruido y parpadeo asíncrono. **En la Sincronía parpadean al unísono**, como algunas especies reales.
- **Organismos ocultos (Discover):** gusanos luminosos en las raíces, esporas flotantes y una criatura dormida bajo la isla.

## Post-proceso: el aspecto macro

| Efecto | Uso | Calidad |
|---|---|---|
| Bloom selectivo | Umbral alto; solo emisivos > 1 con `toneMapped={false}` | Todas (resolución reducida en baja) |
| Profundidad de campo | Enfoque en el objetivo de la cámara (árbol/semilla) | Solo alta |
| Viñeta + grano sutil | Aspecto fotográfico | Todas |
| Tone mapping | **Khronos PBR Neutral** (ADR-012): respeta tono y saturación de la paleta | Todas |

**Prohibido:** aberración cromática exagerada, destellos de lente, glitch y neón saturado.

## Tipografía e interfaz

- Estilo de cartela de museo. Título serif display con tracking amplio y etiquetas pequeñas en monoespaciada. Propuesta a validar: *Instrument Serif* + *Geist Mono*, alojadas en el propio proyecto.
- Interfaz: dos controles (lluvia y sol) en una cápsula translúcida en la parte inferior. Aparecen de forma progresiva. Sin números visibles.
- **Modo observador** (tecla `O`): muestra luz, humedad y vitalidad en monoespaciada pequeña. Sirve para depurar y para la presentación de "cómo se construyó".

## Anti-referencias

Partículas que saturan la pantalla · interfaces de juego o HUD · glassmorphism recargado · colores fuera de paleta · cámara que se mueve sola sin motivo.
