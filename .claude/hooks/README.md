# Hooks

Carpeta para scripts que Claude Code ejecuta antes o después de una herramienta.
Hoy está vacía a propósito: no agregamos automatización antes de tener el
proyecto en marcha.

Los hooks se registran en `.claude/settings.json` bajo la clave `hooks`, no por
el solo hecho de existir aquí.

## Candidatos naturales para este proyecto

- **PostToolUse** sobre `Edit`/`Write` de archivos `.ts`/`.tsx` → correr Prettier
  sobre el archivo tocado.
- **PreToolUse** sobre `Bash(git commit:*)` → ejecutar `bun run typecheck` y
  `bun run test:run`, y bloquear el commit si algo sale en rojo.

Antes de añadir uno: un hook lento se paga en cada llamada a la herramienta.
Mídelo antes de darlo por bueno.
