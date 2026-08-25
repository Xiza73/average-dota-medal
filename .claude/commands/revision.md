---
description: Revisión de código del diff actual contra las convenciones del proyecto
argument-hint: '[rama base | ruta de archivo] (por defecto: dev)'
allowed-tools: Read, Grep, Glob, Bash(git diff:*), Bash(git log:*), Bash(git status), Bash(bun run lint), Bash(bun run test:run), Bash(bun run typecheck)
---

# Revisión de código

Base de comparación: `$1` (si viene vacío, usar `dev`).

## Pasos

1. Obtener el diff con `git diff <base>...HEAD`. Si no hay cambios, decirlo y parar.
2. Ejecutar `bun run typecheck`, `bun run lint` y `bun run test:run`. Reportar
   cualquier fallo antes de opinar sobre el estilo — una revisión sobre código
   roto no sirve.
3. Revisar el diff contra las reglas de `CLAUDE.md`:
   - ¿Se escribió el test antes? ¿La lógica nueva de dominio tiene test?
   - ¿El dominio (`src/domain/`) sigue libre de React y de llamadas de red?
   - ¿Hay valores de MMR fuera de `src/domain/rank-table.ts`?
   - ¿Hay `any` o `as` usados para silenciar el compilador?
   - ¿Los componentes de presentación quedaron sin lógica de negocio?
   - ¿El código, comentarios y textos de UI están en inglés?
4. Verificar el manejo del margen de error: cualquier cálculo que devuelva un
   promedio sin su margen es un fallo bloqueante.

## Salida

Agrupar los hallazgos en tres bloques, del más grave al menos:

- **Bloqueante** — rompe el build, los tests, o viola una regla dura de `CLAUDE.md`.
- **Debería arreglarse** — deuda real, pero no bloquea el merge.
- **Sugerencia** — opcional.

Para cada hallazgo: `archivo:línea`, qué está mal, y POR QUÉ importa. Sin
hallazgos inventados: si el diff está limpio, decirlo en una línea.
