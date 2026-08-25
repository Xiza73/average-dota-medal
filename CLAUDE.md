# average-dota-medal

## 1. Contexto del proyecto

Calculadora de la **medalla promedio de un lobby de Dota 2**.

El usuario carga manualmente la medalla de hasta 5 jugadores (medalla + estrellas,
o Immortal con número de leaderboard opcional) y la aplicación devuelve la medalla
promedio del grupo, con su margen de error.

Problema que resuelve: un grupo que va a jugar junto quiere saber su nivel real
combinado. Hoy eso se estima "a ojo" en el chat del party. No existe una
herramienta que lo haga bien, y las que lo intentan ignoran que Immortal es un
rango sin techo, lo que arruina el promedio.

**No** es un consultor de perfiles: no se busca por Steam ID ni por match ID. La
entrada es un formulario. La aplicación funciona sin conexión.

## 2. Usuarios y alcance (MVP)

Usuario objetivo: jugador de Dota 2 que arma party y quiere estimar el nivel del
grupo. Uso casual, sesiones de menos de un minuto, mayoría desde el teléfono.

MVP:

- Formulario de 1 a 5 jugadores: selección de medalla (Herald → Immortal) y estrellas (1-5).
- Immortal sin estrellas. Campo opcional de número de leaderboard para afinarlo.
- Cálculo del promedio sobre escala lineal de rango, con redondeo a medalla + estrella.
- Margen de error visible, obligatorio cuando hay un Immortal sin número.
- MMR estimado como dato secundario, siempre etiquetado como estimación.
- Responsive: móvil y escritorio.

Fuera del MVP: cuentas de usuario, persistencia, historial, compartir resultado
como imagen, integración con Steam.

## 3. Stack y herramientas

| Área                      | Elección                          |
| ------------------------- | --------------------------------- |
| Lenguaje                  | TypeScript (modo estricto)        |
| UI                        | React 19 + Vite                   |
| Package manager / runtime | **Bun** (nunca npm, yarn ni pnpm) |
| Testing                   | Vitest + React Testing Library    |
| Lint / formato            | ESLint + Prettier                 |
| Estructura                | Single-package (no monorepo)      |

## 4. Comandos clave

```bash
bun install       # instalar dependencias
bun run dev       # servidor de desarrollo
bun run build     # compilación de producción (typecheck + vite build)
bun run test      # tests en modo watch
bun run test:run  # tests una sola vez (CI y pre-commit)
bun run lint      # ESLint
bun run format    # Prettier
bun run typecheck # tsc --noEmit
```

## 5. Convenciones de código

- **Idioma del código: inglés.** Identificadores, comentarios, textos de UI,
  mensajes de error y commits en inglés. La documentación de proyecto puede ir en
  español neutro. Nunca modismos regionales.
- **TDD estricto**: el test se escribe primero y debe fallar antes de escribir la
  implementación. Sin excepción para la lógica de dominio.
- El dominio (cálculo de rangos) es **TypeScript puro, sin React**. Vive en
  `src/domain/` y se testea sin renderizar nada.
- Componentes funcionales. Patrón container/presentational: los componentes de
  `src/components/` no llaman a APIs ni contienen lógica de cálculo.
- Sin `any`. Sin `as` para silenciar el compilador. Si el tipo no cierra, el
  diseño está mal.
- Nombres de archivo: `kebab-case.ts`. Componentes: `PascalCase.tsx`.
- Commits: [Conventional Commits](https://www.conventionalcommits.org/), asunto
  ≤ 72 caracteres, imperativo, minúsculas, sin punto final.

## 6. Estructura del repositorio

```
src/
├── domain/          # lógica pura: escala de rangos, promedio, margen de error
│   ├── rank-scale.ts
│   └── rank-table.ts # tabla de MMR — dato editable, ver sección 7
├── components/      # componentes de presentación, sin lógica de negocio
├── hooks/           # estado de React
├── services/        # clientes HTTP (OpenDota)
└── main.tsx
```

## 7. Integraciones externas

### OpenDota (`https://api.opendota.com/api`)

API pública, sin key para uso básico. **No es crítica**: la aplicación calcula
correctamente sin ella.

- `GET /leaderboards?division={americas|europe|se_asia|china}` — top 1000 por
  región. Único uso real en el MVP: afinar la estimación de un Immortal cuando el
  usuario aporta su número de leaderboard.
- `GET /distributions` — distribución de la población por rango. Uso opcional y
  secundario: mostrar "este lobby supera al X% de los jugadores".

Toda llamada debe degradar con elegancia: si OpenDota no responde, el cálculo
sigue funcionando con el bucket genérico de Immortal.

### Tabla de MMR por medalla — advertencia importante

Valve **no publica** la correspondencia entre medalla y MMR. Ninguna API la
expone. Los valores que usamos (≈154 MMR por estrella, 770 por medalla) son
**consenso comunitario, no dato oficial**, y cambian con el tiempo.

Por eso viven aislados en `src/domain/rank-table.ts`, con la fecha de última
revisión. Actualizarlos debe ser editar ese archivo y nada más. Nunca esparcir
números de MMR por el resto del código.

## 8. Reglas de trabajo con Claude

**Hacer:**

- Escribir el test antes que la implementación.
- Tratar el margen de error como parte del resultado, no como un adorno. Un
  promedio sin margen es una mentira, sobre todo con Immortal en el lobby.
- Preguntar cuando un requisito sea ambiguo, en lugar de asumir.
- Mantener el dominio libre de React y de llamadas de red.
- Ejecutar `bun run lint` y `bun run test:run` antes de cada commit.

**No hacer:**

- No usar npm, yarn ni pnpm. Solo Bun.
- No inventar valores de MMR ni presentarlos como oficiales.
- No hacer que el cálculo dependa de una llamada de red.
- No hacer PR directo a `master`. Las ramas van a `dev`; `master` solo recibe PR
  desde `dev`.
- No añadir dependencias sin justificar el peso que agregan.
- No commitear `CLAUDE.local.md` ni `.claude/settings.local.json`.
