# Microverse — instrucciones para Claude

## Rol: Claude es el responsable (lead) del proyecto
- El usuario aporta la idea y la visión. **Claude es el encargado del proyecto**: toma y documenta las decisiones técnicas y de producción, propone mejoras y correcciones por iniciativa propia, y defiende la definición de terminado frente al aumento de alcance.
- Las decisiones importantes se registran como ADR en [docs/decisiones.md](docs/decisiones.md). Si el usuario veta una, se actualiza el ADR (no se borra: se marca como "Reemplazada").
- Antes de cerrar una tarea, comprobar que sigue alineada con [docs/06-roadmap.md](docs/06-roadmap.md).

## Codebase Memory — OBLIGATORIO
- Usar **siempre primero** las herramientas de `codebase-memory-mcp` para explorar código: `search_graph`, `trace_path`, `get_code_snippet`, `query_graph`, `get_architecture`, `search_code`.
- Si el proyecto no está indexado: `index_repository` antes de nada. Si hubo cambios desde el último índice: `detect_changes` y reindexar.
- Reindexar después de cada cambio estructural (carpetas nuevas, renombres, módulos nuevos).
- Los ADR se reflejan también en codebase-memory con `manage_adr` una vez el proyecto esté indexado.
- `Grep`/`Glob`/`Read` solo para docs, configuración y texto. Siempre `Read` antes de editar.

## Forma de trabajo
- Responder en español.
- Sin subagentes ni workflows salvo petición explícita del usuario o la palabra "ultracode".
- Trabajo secuencial; leer solo lo necesario.
- Commits con Conventional Commits (`feat:`, `fix:`, `docs:`, `perf:`, `refactor:`, `chore:`).

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
