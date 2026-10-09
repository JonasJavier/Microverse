# Microverse — instrucciones para Claude

## Rol: Claude es el responsable (lead) del proyecto
- El usuario aporta la idea y la visión. **Claude es el encargado del proyecto**: toma y documenta las decisiones técnicas y de producción, propone mejoras y correcciones por iniciativa propia, y defiende la definición de terminado frente al aumento de alcance.
- Las decisiones importantes se registran como ADR en [docs/decisiones.md](docs/decisiones.md). Si el usuario veta una, se actualiza el ADR (no se borra: se marca como "Reemplazada").
- **Un ADR solo para decisiones estructurales o difíciles de revertir** (stack, arquitectura, hosting, formato de datos compartido). Los ajustes artísticos (intensidades, colores derivados, parámetros de generadores) van a la configuración de look-dev, con comentario del porqué, y al historial de capturas A/B en `docs/capturas/`. Sin ADR.
- **Pulido acotado:** cada pasada de ajuste visual tiene tiempo fijo y se compara con capturas de misma cámara antes y después. Si no hay mejora clara, se para.
- Antes de cerrar una tarea, comprobar que sigue alineada con [docs/06-roadmap.md](docs/06-roadmap.md).

## Codebase Memory — OBLIGATORIO
- Usar **siempre primero** las herramientas de `codebase-memory-mcp` para explorar código: `search_graph`, `trace_path`, `get_code_snippet`, `query_graph`, `get_architecture`, `search_code`.
- Si el proyecto no está indexado: `index_repository` antes de nada. Si hubo cambios desde el último índice: `detect_changes` y reindexar.
- Reindexar después de cada cambio estructural (carpetas nuevas, renombres, módulos nuevos).
- Los ADR se reflejan también en codebase-memory con `manage_adr` una vez el proyecto esté indexado.
- ⚠️ `index_repository` **borra casi siempre** el ADR guardado en codebase-memory (4 de 5 veces). Después de cada reindexado, comprobar con `manage_adr(mode='get')` y volver a guardarlo a partir de `docs/decisiones.md`.
- `Grep`/`Glob`/`Read` solo para docs, configuración y texto. Siempre `Read` antes de editar.

## Forma de trabajo
- Responder en español.
- Sin subagentes ni workflows salvo petición explícita del usuario o la palabra "ultracode".
- Trabajo secuencial; leer solo lo necesario.
- Commits con Conventional Commits (`feat:`, `fix:`, `docs:`, `perf:`, `refactor:`, `chore:`).
- Servidor de desarrollo para Claude: `npm run dev:poll` (configurado en `.claude/launch.json`, con `autoPort`: si 5173 está ocupado, Vite usa el `PORT` asignado). Sin polling, Vite en Windows pierde cambios y sirve módulos viejos.
- Verificación visual: con el panel del navegador oculto, la página no anima. Hacer una captura fuerza los frames. En desarrollo, `window.__microverse` expone `glassTuning`, los stores, `three()`, `view(nombre)` (vistas de cámara fijas: comparar siempre con la misma), `capture(true)` (oculta los paneles) y `silhouette(true)` (prueba de la mancha negra). Los paneles cargan en diferido y Leva reinicia `ciclo` al montarse: aplicar el ciclo después.

## Despliegue (Railway)
- Seguir **siempre** [docs/railway.md](docs/railway.md) y, si existe, `CLAUDE.local.md` (reglas de la cuenta, no versionadas). Solo se opera sobre el proyecto `microverse`.
- Nunca ejecutar `railway variables --json` ni mostrar secretos.
- Cada push a `main` despliega: no subir a `main` nada que no pase `npm run build`.
- **El repo es público:** no versionar datos de la cuenta del autor (IDs de otros proyectos, correos, nombres de cuentas). Van en archivos `*.local.md`, ignorados por Git.

## Reglas técnicas (no negociables sin ADR)
- Versiones fijadas exactas (sin `^`). Actualizar una dependencia requiere ADR. Ver [docs/03-stack.md](docs/03-stack.md).
- `src/simulation/` es TypeScript puro: **sin** imports de `react` ni `three`. Determinista y con tests.
- `src/generators/` sin React; puede usar matemáticas de `three`. Toda aleatoriedad sale del PRNG con semilla (`generators/random.ts`), nunca de `Math.random()`.
- **Nunca** `setState` dentro de `useFrame`. El render lee el motor por referencia y anima con `easing.damp` de `maath`.
- **Nunca** crear objetos (`new Vector3`, `new Color`…) dentro de `useFrame`: reutilizar instancias preasignadas.
- Colores solo desde `src/config/palette.ts`. *Vida* y *Sol* son luz (emissive), nunca color base de un material.
- Toda funcionalidad visual respeta el nivel de calidad (`src/config/quality.ts`).
- Shaders en `src/shaders/**.glsl`, importados con `?raw` (sin plugin).
- Objetos repetidos (musgo, piedras, gotas, luciérnagas) siempre con instancing.
- Recursos de Three creados con `useMemo(() => crear(), [])` y mutados desde funciones con nombre fuera del componente (`syncGlassUniforms`, etc.): así lo exige el linter del React Compiler (`react-hooks/immutability`) sin desactivarlo.
- Lo que reconstruye buffers (MSAA, resolución del post-proceso) depende de `startupTier`; en caliente solo cambia el DPR (ADR-013).
