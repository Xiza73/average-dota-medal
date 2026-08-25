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

El destino es **Vercel**, conectado al repositorio de GitHub. El despliegue lo
dispara el push a `master`; no se despliega a mano desde la línea de comandos.

La configuración está versionada en `vercel.json`: framework `vite`,
`bun install`, `bun run build`, salida `dist/`. No hay variables de entorno.

Reglas de la conexión:

- **Production Branch debe ser `master`**, no la rama por defecto del
  repositorio. Vercel propone `dev` porque es la rama por defecto; aceptarlo
  publicaría cada merge a `dev` sin pasar por release.
- Los PR hacia `dev` generan preview deployments. Ese es el lugar para revisar
  un cambio, no producción.
- Nunca usar `vercel --prod` desde local: crea un despliegue desconectado de Git
  y saltea todo el flujo de ramas.

Producción: <https://average-dota-medal.vercel.app/>

## Reglas

- Nunca desplegar con tests en rojo.
- Nunca etiquetar una versión que no esté en `master`.
- Confirmar con la persona usuaria antes de cualquier acción que publique algo
  hacia afuera.
