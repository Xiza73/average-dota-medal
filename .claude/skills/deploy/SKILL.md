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

> **Sin configurar.** El destino de despliegue todavía no está decidido. Al
> elegirlo, documentar aquí el comando exacto, la carpeta de salida (`dist/`), el
> comando de build (`bun run build`) y las variables de entorno.

## Reglas

- Nunca desplegar con tests en rojo.
- Nunca etiquetar desde una rama que no sea `master`.
- Confirmar con la persona usuaria antes de cualquier publicación hacia afuera.
