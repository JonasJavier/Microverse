# 03 · Stack tecnológico y versiones

Versiones verificadas con `npm view` el **2026-10-07**. Todas se fijan **exactas** (sin `^`), con el lockfile versionado. Actualizar cualquier versión requiere un ADR.

## Entorno

| Herramienta | Versión | Nota |
|---|---|---|
| Node.js | 24.16.0 (LTS) | `.nvmrc` = `24`; `engines.node` = `>=24` |
| npm | 11.13.0 | `.npmrc` con `save-exact=true` |

## Producción

| Paquete | Versión | Para qué |
|---|---|---|
| `react` / `react-dom` | 19.3.0 | UI y reconciliador |
| `three` | 0.186.1 (r186) | Motor 3D, `WebGLRenderer` |
| `@react-three/fiber` | 9.8.1 | Three.js declarativo en React |
| `@react-three/drei` | 10.7.9 | `CameraControls`, `Environment`/`Lightformer`, `PerformanceMonitor`, `AdaptiveDpr`, `Instances`, `MeshTransmissionMaterial` (opcional) |
| `@react-three/postprocessing` | 3.1.3 | Bloom, DOF, viñeta, ruido |
| `postprocessing` | 6.39.5 | Dependencia del anterior |
| `zustand` | 5.0.15 | Estado de UI y puente con el motor |
| `maath` | 0.10.8 | `easing.damp` (transiciones suaves), utilidades aleatorias |
| `simplex-noise` | 4.0.3 | Ruido en CPU para los generadores (terreno, distribución) |

## Desarrollo

| Paquete | Versión | Para qué |
|---|---|---|
| `typescript` | **6.0.3** | Ver decisión 1 |
| `vite` | 8.3.3 | Bundler (Rolldown) y servidor de desarrollo |
| `@vitejs/plugin-react` | 6.1.2 | React + Fast Refresh |
| `@types/three` | 0.186.0 | Tipos de Three alineados con r186 |
| `@types/react` / `@types/react-dom` | 19.3.0 | Tipos |
| `@types/node` | 24.19.1 | Tipos alineados con Node 24 |
| `vitest` | 5.0.3 | Tests del motor y los generadores |
| `eslint` | 10.12.0 | Linter |
| `@eslint/js` | 10.0.1 | Reglas base |
| `typescript-eslint` | 8.71.1 | Reglas TypeScript |
| `eslint-plugin-react-hooks` | 7.1.1 | Reglas de hooks |
| `eslint-plugin-react-refresh` | 0.5.7 | Fast Refresh seguro |
| `globals` | 17.13.0 | Globales del navegador |
| `prettier` | 3.9.9 | Formato |
| `leva` | 0.10.1 | Panel de ajuste en vivo (solo en desarrollo) |
| `r3f-perf` | 7.2.3 | Monitor de FPS, draw calls y memoria GPU (solo en desarrollo) |

`leva` y `r3f-perf` se cargan con `import()` dinámico dentro de `if (import.meta.env.DEV)`, así que no entran en el build de producción.

## Decisiones de versión importantes

1. **TypeScript 6.0.3, no 7.0.2.** TS 7 (el compilador nativo en Go) ya es `latest`, pero `typescript-eslint` 8.71.1 declara como peer `typescript >=4.8.4 <6.1.0`. Con TS 7 el lint fallaría. Se revisa cuando `typescript-eslint` lo soporte.
2. **React Three Fiber 9.8.1, no 10.** R3F 10 está en `alpha.5`/`canary` (trae WebGPU, fuera de alcance). Drei 10.x va con R3F 9; Drei 11 también está en alpha.
3. **React fijado en 19.3.0.** R3F 9.8.1 declara como peer `react >=19 <19.4`. ⚠️ No subir a React 19.4 hasta que R3F lo soporte.
4. **Shaders sin `vite-plugin-glsl`.** El plugin (1.6.2) necesita `esbuild` como peer y Vite 8 ya no lo incluye. Usamos las importaciones `?raw` nativas de Vite y un pequeño helper para componer fragmentos comunes (ruido, etc.). Cero dependencias extra.
5. **Three r186 con `WebGLRenderer` + GLSL.** Three.js avanza hacia WebGPU/TSL, pero WebGL sigue plenamente soportado. La migración es un tema de v2 (ADR-001).

## Lo que NO usamos (y por qué)

| Descartado | Motivo |
|---|---|
| GSAP / react-spring | Las animaciones dependen del estado, no de líneas de tiempo. `easing.damp` basta. |
| Motor de física (Rapier, etc.) | Nada en el mundo necesita colisiones reales. |
| `vite-plugin-glsl` | Ver decisión 4. |
| Tailwind u otros frameworks CSS | La interfaz son dos controles y un overlay. CSS Modules con tokens. |
| Howler / Tone.js | Web Audio API nativa para un ambiente sencillo. |
| Archivos HDRI | Entorno con *Lightformers*: reflejos controlados y 0 KB. |
| Blender (por defecto) | El árbol y las raíces son procedurales (ADR-003). Blender solo como plan B; en ese caso se exporta a glTF y se optimiza con `gltf-transform` (meshopt). |

## Herramientas del proyecto

- **Git + GitHub**, Conventional Commits.
- **codebase-memory-mcp:** se indexa en la jornada 0, se reindexa tras cambios estructurales y guarda los ADR (`manage_adr`).
- **Hosting:** Netlify, sitio estático con deploy previews por rama (ADR-009). Se publica desde la jornada 0, no al final.
- **Depuración GPU:** `r3f-perf` + extensión Spector.js + Chrome DevTools (pestaña Performance).

## `package.json` objetivo (jornada 0)

```json
{
  "name": "microverse",
  "private": true,
  "type": "module",
  "engines": { "node": ">=24" },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "lint": "eslint .",
    "format": "prettier --write ."
  },
  "dependencies": {
    "@react-three/drei": "10.7.9",
    "@react-three/fiber": "9.8.1",
    "@react-three/postprocessing": "3.1.3",
    "maath": "0.10.8",
    "postprocessing": "6.39.5",
    "react": "19.3.0",
    "react-dom": "19.3.0",
    "simplex-noise": "4.0.3",
    "three": "0.186.1",
    "zustand": "5.0.15"
  },
  "devDependencies": {
    "@eslint/js": "10.0.1",
    "@types/node": "24.19.1",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@types/three": "0.186.0",
    "@vitejs/plugin-react": "6.1.2",
    "eslint": "10.12.0",
    "eslint-plugin-react-hooks": "7.1.1",
    "eslint-plugin-react-refresh": "0.5.7",
    "globals": "17.13.0",
    "leva": "0.10.1",
    "prettier": "3.9.9",
    "r3f-perf": "7.2.3",
    "typescript": "6.0.3",
    "typescript-eslint": "8.71.1",
    "vite": "8.3.3",
    "vitest": "5.0.3"
  }
}
```

**Validación de la jornada 0:** `npm install` sin conflictos de peers, `npm run build` y `npm run lint` en verde, y una escena mínima en marcha. Si algún peer falla, se resuelve y se documenta aquí antes de seguir.
