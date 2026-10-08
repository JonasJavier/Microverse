# Despliegue en Railway

Microverse es un sitio estático (Vite) servido con `serve` en un servicio de Railway (ADR-011).

## Servicio

| | |
|---|---|
| Proyecto | `microverse` |
| Servicio | `web`, conectado a `JonasJavier/Microverse`, rama `main` |
| URL | https://web-production-04f0b.up.railway.app |
| Build | `npm run build` (Railpack) |
| Arranque | `npm start` → `serve dist --single` (lee `PORT`) |
| Healthcheck | `/`, timeout 60 s · reinicio `ON_FAILURE` (máx. 5) |
| Caché | `/assets/*` inmutable un año; HTML `no-cache` (`public/serve.json`) |

Build, arranque, healthcheck y reinicio se configuran **en el servicio de Railway**, no en el repo: Railway rechaza `railway.json` por obsoleto (Config as Code).

## Desplegar

- **Automático:** cada push a `main` despliega. No subir a `main` nada que no pase `npm run build`.
- **Manual** (desde la carpeta enlazada al proyecto; comprobar antes con `railway status`):

```bash
railway up --service web --detach
```

- **Verificar:** `railway deployment list --service web --limit 3 --json` hasta `SUCCESS`; si falla, `railway logs --service web --build --lines 200`.

## Reglas

- Sin secretos en el repo: Microverse no usa variables de entorno propias.
- Las reglas de la cuenta de Railway del autor (otros proyectos, tokens, permisos) viven en archivos locales no versionados (`CLAUDE.local.md`, `docs/railway.local.md`). Si existen, son de lectura obligatoria antes de operar.
