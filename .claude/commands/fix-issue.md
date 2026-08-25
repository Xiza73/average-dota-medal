---
description: Resolver un issue de GitHub siguiendo TDD y el flujo de ramas del proyecto
argument-hint: '<número de issue>'
allowed-tools: Read, Edit, Write, Grep, Glob, Bash(gh issue view:*), Bash(git checkout:*), Bash(git switch:*), Bash(git status), Bash(git diff:*), Bash(bun run test), Bash(bun run test:run), Bash(bun run lint), Bash(bun run typecheck)
---

# Resolver issue #$1

## 1. Entender

Leer el issue con `gh issue view $1`. Reformular en una frase qué hay que hacer y
cuál es el criterio de aceptación.

Si el issue es ambiguo o le falta información para decidir la implementación,
**parar y preguntar**. No adivinar.

## 2. Rama

Crear la rama desde `dev` con el prefijo correcto:

```bash
git switch dev && git switch -c fix/<slug-corto>
```

Prefijos: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`.

## 3. Reproducir con un test (TDD estricto)

Escribir primero un test que falle y que demuestre el problema. Ejecutarlo y
**confirmar que falla por la razón correcta**. Un test que pasa a la primera no
está probando el bug.

## 4. Arreglar

Implementar el cambio mínimo que hace pasar el test. Si el arreglo toca
`src/domain/`, mantenerlo puro: sin React, sin red.

## 5. Verificar

```bash
bun run typecheck && bun run lint && bun run test:run
```

Todo en verde antes de continuar. Si algo falla, reportarlo — no lo escondas.

## 6. Entregar

Proponer el mensaje de commit y **esperar la aprobación** antes de commitear.

Formato: `fix(<scope>): <asunto en imperativo>`, máximo 72 caracteres, en inglés.
Incluir `Closes #$1` en el cuerpo.
