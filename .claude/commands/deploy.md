---
description: Verificar y publicar una release, o desplegar el build estático
argument-hint: '[versión semver, ej. 1.2.0]'
allowed-tools: Read, Bash(bun install), Bash(bun run build), Bash(bun run test:run), Bash(bun run lint), Bash(bun run typecheck), Bash(git status), Bash(git log:*), Bash(git branch:*), Bash(gh pr list:*), Bash(gh pr view:*)
---

# Deploy

Versión objetivo: `$1` (si viene vacía, preguntar antes de seguir).

## 1. Puerta de calidad

No se despliega nada sin esto en verde:

```bash
bun install
bun run typecheck
bun run lint
bun run test:run
bun run build
```

Si algo falla, **detener el deploy** y reportar el fallo con su salida real.

## 2. Verificar el estado del repositorio

- El árbol de trabajo debe estar limpio (`git status`).
- Estar parado en `dev`, con todos los PR de la release ya mergeados.
- Revisar `git log master..dev --oneline` para confirmar qué entra en la release.

## 3. Release

`master` solo recibe PR desde `dev`. Crear el PR `dev` → `master`, esperar el
merge, y luego etiquetar:

```bash
git tag -a v$1 -m "release: v$1"
git push origin v$1
```

## 4. Publicar el build

El artefacto es estático: la carpeta `dist/`. Se sirve desde cualquier host de
estáticos.

> **Pendiente de configurar.** Este proyecto todavía no tiene destino de
> despliegue definido. Cuando se elija (Vercel, Netlify, Cloudflare Pages, GitHub
> Pages), documentar aquí el comando exacto y las variables de entorno necesarias.

## Reglas

- Nunca desplegar con tests en rojo.
- Nunca etiquetar una versión que no esté en `master`.
- Confirmar con la persona usuaria antes de cualquier acción que publique algo
  hacia afuera.
