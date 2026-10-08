# Registro de decisiones (ADR)

Estados: **Propuesta** (pendiente de validar) · **Aceptada** · **Reemplazada** (se indica por cuál).
Cuando el proyecto esté indexado, cada ADR se refleja también en codebase-memory (`manage_adr`).

---

## ADR-001 · WebGL + GLSL, sin WebGPU en v1 — Aceptada (2026-10-07)
**Contexto:** Three.js avanza hacia WebGPU/TSL y R3F 10 (en alpha) lo integra.
**Decisión:** `WebGLRenderer` + GLSL sobre R3F 9.
**Consecuencias:** máxima compatibilidad y herramientas maduras. Migrar a TSL es un tema de v2.
**Alternativa descartada:** WebGPU desde el inicio, porque supone un riesgo de infraestructura experimental que no aporta a la definición de terminado.

## ADR-002 · Versiones exactas; TypeScript 6.0 — Aceptada (2026-10-07)
**Contexto:** TS 7.0.2 es `latest`, pero `typescript-eslint` 8.71.1 exige `typescript <6.1.0`. R3F 9.8.1 exige `react <19.4`.
**Decisión:** fijar todo exacto (ver [03-stack.md](03-stack.md)): TS 6.0.3 y React 19.3.0.
**Consecuencias:** cualquier actualización pasa por un ADR nuevo.

## ADR-003 · Árbol: silueta estilizada, acabado macro, procedural — Aceptada (2026-10-07)
**Contexto:** la elección entre un árbol de fantasía estilizado y uno realista de fotografía macro define la identidad visual.
**Decisión:** **silueta de fantasía estilizada con acabado macro realista** (luz, materiales, profundidad de campo), generada por código con colonización del espacio.
**Motivos:**
1. Una silueta reconocible se lee en miniatura, de noche y en un vídeo de 15 s. Un árbol realista a esta escala se convierte en ruido.
2. El realismo macro exige miles de hojas y texturas de corteza pesadas, que chocan con el objetivo de 30 FPS en móvil.
3. Hecho por código, el crecimiento sale casi gratis: un uniform `uGrowth` revela las ramas a lo largo de su longitud. Con un modelo de Blender habría que animar a mano.
4. El mismo generador produce las raíces hacia abajo: árbol y red neuronal comparten lenguaje formal.
5. Coincide con la referencia 1 (copas de musgo, formas de cuento) sin perder la seriedad de la referencia 2.
**Plan B:** si en la jornada 4 el árbol procedural no pasa el listón visual, se modela en Blender y el crecimiento se resuelve por segmentos.
**Aprobada** por el usuario el 2026-10-07.

## ADR-004 · Cristal de pared fina con shader propio — Aceptada, se valida en la jornada 1
**Contexto:** `MeshTransmissionMaterial` añade un pase de render completo de la escena. Una esfera de pared fina casi no refracta.
**Decisión:** shader propio (reflejo de entorno + Fresnel + brillos de softbox + tinte leve) como base en todos los niveles. MTM solo en calidad Alta, si la comparación A/B demuestra que se nota.
**Consecuencias:** cristal barato y correcto. Hay que cuidar el orden de transparencias.

## ADR-005 · Motor de simulación desacoplado a 10 Hz — Aceptada (2026-10-07)
**Decisión:** `EcosystemEngine` en TS puro (sin React ni Three), con paso fijo de 0.1 s, determinista y con tests. El render suaviza con `easing.damp`.
**Consecuencias:** las reglas se pueden calibrar y probar sin abrir el navegador, y el rendimiento del render no altera la simulación.

## ADR-006 · Shaders con `?raw`, sin plugin — Aceptada (2026-10-07)
**Contexto:** `vite-plugin-glsl` necesita `esbuild` como peer y Vite 8 (Rolldown) ya no lo incluye.
**Decisión:** importaciones `?raw` nativas + helper de composición para fragmentos comunes.

## ADR-007 · "El mundo te recuerda" (persistencia local) — Aceptada (2026-10-07)
**Decisión:** guardar el estado en `localStorage` y simular la ausencia al volver (seco, nunca muerto).
**Motivo:** lleva la idea de memoria a su consecuencia natural por menos de una jornada de trabajo.
**Aprobada** por el usuario el 2026-10-07.

## ADR-008 · Subsuelo como corte de diorama — Aceptada (2026-10-07), se valida en la jornada 2
**Decisión:** el cuadrante frontal del suelo está cortado en limpio y muestra estratos y raíces luminosas. Además, raíces colgantes bajo la isla.
**Alternativa:** suelo semitransparente con las raíces vistas a través. Más ambiguo y con más problemas de transparencia.

## ADR-009 · Hosting en Netlify con deploy desde la jornada 0 — Reemplazada por ADR-011 (2026-10-08)
**Decisión:** sitio estático en Netlify, con deploy previews por rama. La integración ya está conectada en el entorno de trabajo.
**Motivo:** publicar desde el primer día elimina el riesgo de dejar "publicada" para el final.

## ADR-010 · Sin `r3f-perf`: `<Stats>` de Drei + panel propio — Aceptada (2026-10-08)
**Contexto:** al instalar en la jornada 0, `r3f-perf` 7.2.3 (última versión, de noviembre de 2024) depende de `@react-three/drei ^9` y `zustand ~4.5`, incompatibles con nuestro stack (Drei 10, R3F 9, Zustand 5). npm forzaba peers y duplicaba Drei.
**Decisión:** quitar `r3f-perf`. En desarrollo se usa `<Stats>` de Drei (FPS) y `experience/debug/DevTools.tsx`, que lee `renderer.info` (draw calls, triángulos, geometrías y texturas) y muestra el nivel de calidad. Cero dependencias extra.
**Consecuencias:** sin gráfica de GPU integrada. Para perfilar la GPU: Spector.js y la pestaña Performance de Chrome.

## ADR-011 · Hosting en Railway, desplegado desde GitHub — Aceptada (2026-10-08)
**Contexto:** el usuario prefiere Railway, donde ya tiene su cuenta y otros proyectos. Reemplaza a ADR-009.
**Decisión:** proyecto propio `microverse` en Railway con un servicio `web` conectado a `JonasJavier/Microverse` (rama `main`): cada push despliega. Build con Railpack (`npm run build`). Arranque con `serve` 14.2.6 (`npm start`), que lee `PORT` y escucha en todas las interfaces. Build, arranque, healthcheck en `/` (60 s) y reinicio `ON_FAILURE` (5) se configuran **en el servicio de Railway**, no en el repo: Railway rechaza `railway.json` por obsoleto (Config as Code) en favor de Infrastructure as Code (`.railway/railway.ts`). Migrar a IaC queda pendiente para cuando haga falta. Caché de un año para `/assets/*` (nombres con hash) y `no-cache` para el HTML, vía `public/serve.json`.
**Seguridad:** `serve` 14.2.6 fija `compression` 1.8.1 (GHSA-vc2v-76pw-4v95, DoS, severidad alta). Se fuerza `compression` 1.8.2 con `overrides` en `package.json`; `npm audit` queda en 0. Se revisa cuando salga una versión nueva de `serve`.
**Reglas:** seguir [docs/railway.md](railway.md). Solo se opera sobre el proyecto `microverse`, siempre con `--project` explícito; los demás proyectos de la cuenta no se tocan.
**Alternativa descartada:** Dockerfile con Caddy. Es más eficiente, pero añade una imagen que mantener; se reconsidera si el rendimiento de servido lo pide.
