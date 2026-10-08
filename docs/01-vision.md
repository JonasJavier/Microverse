# 01 · Visión

## Concepto

Una esfera de cristal suspendida en la oscuridad, como una pieza de museo. Dentro flota una pequeña isla con un árbol, hongos y vegetación. Debajo de la tierra, visible en corte, una red de raíces luminosas, parecida a una red neuronal, conecta a todos los organismos.

Al interactuar, el mundo responde: la vegetación crece, la luz cambia, las raíces se iluminan y emergen criaturas bioluminiscentes. No reproduce animaciones: **acumula condiciones** y evoluciona a partir de ellas.

> *An entire world, waiting for your touch.*

## Pilares

1. **Contención.** Elegante, misterioso y vivo. Cada efecto tiene que justificar su presencia. Nada de pantallas llenas de controles ni de partículas.
2. **Causa → efecto, siempre gradual.** Toda acción del visitante tiene una respuesta visible del mundo, pero nunca instantánea. El mundo "respira" antes de reaccionar.
3. **Memoria.** El estado se acumula (luz, humedad, vitalidad). Dos visitantes que hagan cosas distintas verán mundos distintos.
4. **Lo invisible es protagonista.** Lo que ocurre bajo tierra (raíces, pulsos, organismos) es el rasgo distintivo de Microverse.

## Recorrido del visitante

Se descubre, no se explica. Como máximo, una línea de texto sutil por acto. Los controles aparecen solo cuando tienen sentido.

| Acto | Disparador | Respuesta del mundo | Qué aprende el visitante |
|---|---|---|---|
| **00 · Umbral** | Carga de la página | Fundido desde *Vacío*. Título discreto. La esfera casi a oscuras; una semilla late con luz *Sol*. | "Algo está vivo ahí dentro." |
| **01 · Awakening** | Clic/toque en la semilla | Un pulso viaja de la semilla por las raíces; la red se enciende por ramas (~6 s). Aparece el control de lluvia. | Que el mundo responde al tacto. |
| **02 · Nourish** | Mantener pulsado el control de lluvia (o pulsación larga sobre la esfera) | Lluvia suave, la tierra se oscurece, ondas en los charcos y, segundos después, brotes y crecimiento. Tras el primer crecimiento aparece el control del sol. | Que sus acciones se acumulan. |
| **03 · Transform** | Mover el sol (dial o arrastrar el orbe solar) | Mañana cálida → mediodía → atardecer → noche verde azulada. De noche, los hongos se encienden y las luciérnagas emergen poco a poco. | Que el tiempo cambia el carácter del mundo. |
| **04 · Discover** | Girar y acercar la cámara | Desde abajo se ven raíces que cuelgan en el vacío; en el corte del suelo, organismos ocultos (gusanos luminosos, esporas, una criatura dormida). | Que hay más de lo que se ve a primera vista. |
| **05 · Sincronía** (final) | Mantener el ecosistema en equilibrio un tiempo | Las raíces laten sincronizadas, el árbol florece, las luciérnagas parpadean al unísono y todo el mundo brilla como un solo organismo durante unos segundos. Sin notificaciones. | Nada: es la recompensa. |

**Detalle técnico que aprovecha el diseño:** los navegadores exigen un gesto del usuario para iniciar audio. El clic en la semilla *es* ese gesto: la semilla es el botón de inicio, sin botón de "empezar".

## El mundo te recuerda (ADR-007)

El estado se guarda en el navegador. Si el visitante vuelve, encuentra su mundo como lo dejó, algo más seco por el tiempo transcurrido, pero nunca muerto. Cuesta muy poco y lleva el concepto de memoria a su consecuencia natural.

## Fuera de alcance de v1

WebGPU/TSL · cuentas de usuario o multijugador · gamificación (puntos, logros, notificaciones) · simulación científica · varios biomas · editor del mundo · VR/AR · tutorial.

## Para v2 (lista de espera, no se toca en v1)

- Estaciones del año.
- Compartir "tu mundo" mediante una URL con semilla y estado.
- Música generativa que siga el estado del ecosistema.
- Migración a WebGPU/TSL.
- Nuevas especies y organismos.
