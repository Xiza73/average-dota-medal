---
name: deploy
description: Procedimiento de build y publicación de este proyecto con Bun y Vite. Se activa al preparar una release, etiquetar una versión, construir para producción o publicar el sitio.
---

# Deploy

Artefacto: un sitio estático en `dist/`. No hay servidor propio.

## Puerta de calidad (obligatoria)

Ninguna de estas etapas se puede saltar:

```bash
bun install
bun run typecheck
bun run lint
bun run test:run
bun run build
```

Si algo sale en rojo, el deploy se detiene y se reporta la salida real del fallo.
No se despliega "para probar".

## Verificación del build

Antes de publicar, servir el build localmente y comprobar que arranca:

```bash
bun run preview
```

Comprobar en móvil y escritorio: el MVP es responsive por requisito, no por gusto.

## Flujo de release

`master` solo recibe PR desde `dev`.

1. Confirmar que todos los PR de la release están mergeados en `dev`.
2. Revisar el contenido de la release: `git log master..dev --oneline`.
3. PR `dev` → `master`, merge con commit de merge (`--merge`, nunca squash).
4. Etiquetar en `master`:

```bash
git tag -a v<X.Y.Z> -m "release: v<X.Y.Z>"
git push origin v<X.Y.Z>
```

## Publicación

**Vercel**, conectado al repositorio de GitHub. El push a `master` dispara el
despliegue de producción; los PR hacia `dev` generan previews.

La configuración vive en `vercel.json`, versionada: framework `vite`,
`bun install`, `bun run build`, salida `dist/`. Sin variables de entorno.

Dos cosas que hay que respetar:

- **Production Branch = `master`.** Vercel sugiere la rama por defecto del
  repositorio, que aquí es `dev`. Aceptar esa sugerencia publicaría cada merge a
  `dev` directo a producción.
- `public/rank-table.json` se sirve con `max-age=0, must-revalidate`. Es
  deliberado: la tabla debe poder actualizarse con un commit y verse enseguida.
  Si alguien la cachea de forma agresiva, el dato deja de ser actualizable.

Nunca desplegar con `vercel --prod` desde local: genera un despliegue
desconectado de Git y saltea el flujo de ramas.

> **Pendiente:** anotar aquí la URL de producción una vez conectado el proyecto.

## Reglas

- Nunca desplegar con tests en rojo.
- Nunca etiquetar desde una rama que no sea `master`.
- Confirmar con la persona usuaria antes de cualquier publicación hacia afuera.
