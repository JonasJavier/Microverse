# Despliegue en GitHub Pages

Microverse es un sitio estático (Vite) publicado en GitHub Pages (ADR-016). Antes vivía en Railway (ADR-011, reemplazada).

## Cómo funciona

| | |
|---|---|
| URL | https://jonasjavier.github.io/Microverse/ |
| Origen | GitHub Actions ([`.github/workflows/pages.yml`](../.github/workflows/pages.yml)) |
| Build | `npm ci && npm run build` en Node 24 (`.nvmrc`) |
| Publicación | `dist/`, con `base: '/Microverse/'` en Vite (solo en producción) |
| Caché | Los archivos de `/assets/` llevan hash en el nombre; GitHub Pages los sirve con su propia caché |

Cada push a `main` construye y publica. El flujo también se puede lanzar a mano desde la pestaña *Actions* (`workflow_dispatch`).

## Verificar

```bash
gh run list --workflow pages.yml --limit 3
```

```bash
curl -s -o /dev/null -w "%{http_code}\n" https://jonasjavier.github.io/Microverse/
```

Comprobar también `https://jonasjavier.github.io/Microverse/og.jpg` (200, `image/jpeg`) y que el HTML lleva los metadatos `og:image` con esta URL.

## Reglas

- No subir a `main` nada que no pase `npm run build`: un flujo fallido no publica nada (lo anterior sigue en línea) y se arregla hacia delante, con otro commit.
- Sin secretos ni variables: el sitio es estático puro y el repo es público.
- Si el repo cambia de nombre, cambiar `base` en `vite.config.ts` y las URL absolutas de `index.html` y el README.
