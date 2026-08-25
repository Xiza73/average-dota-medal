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

- Formulario de 1 a 5 jugadores: selección de medalla (Heraldo → Inmortal) y estrellas (1-5).
- Inmortal sin estrellas. Campo opcional de posición de leaderboard para afinarlo.
- Cálculo del promedio sobre escala lineal de MMR, con redondeo a medalla + estrella.
- Margen de error **siempre** visible, y notoriamente más ancho con un Inmortal
  sin posición.
- MMR estimado como dato secundario, siempre etiquetado como estimación.
- Responsive: móvil y escritorio.

Cada rango se convierte en un **intervalo** de MMR, nunca en un número suelto.
El promedio de los intervalos produce el margen de error de forma natural. Esa es
la razón de que la escala sea MMR y no el índice de medalla: Inmortal no tiene
techo y es el único punto donde la linealidad se rompe.

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

- **Idiomas, separados por capa:**
  - Código, identificadores, comentarios, nombres de archivo y commits: **inglés**.
  - Textos visibles de UI, `aria-label` y mensajes al usuario: **español neutro**.
    El diseño de origen está en español y esa es la decisión del producto.
  - Documentación del proyecto: español neutro.
  - Nunca modismos regionales, en ninguna capa.
- Los identificadores de medalla en el dominio son **inglés** (`herald`, `divine`).
  Su traducción vive en `src/components/medal-presentation.ts`, que es la única
  frontera donde el dominio se convierte en texto para el usuario.
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
public/
└── rank-table.json          # tabla publicada; se actualiza sin tocar código
src/
├── domain/                  # TypeScript puro: sin React, sin red
│   ├── rank-table.ts        # tipos, tabla empaquetada y validación
│   └── rank-scale.ts        # intervalos de MMR, promedio y margen de error
├── services/
│   └── rank-table-source.ts # carga la tabla publicada, con fallback
├── hooks/
│   ├── use-rank-table.ts    # tabla empaquetada primero, remota después
│   └── use-party.ts         # estado de los 5 jugadores
├── components/
│   ├── medal-presentation.ts # etiquetas en español, colores, formato
│   ├── PlayerCard.tsx
│   └── ResultPanel.tsx
├── styles.css
├── App.tsx
└── main.tsx
```

## 7. Integraciones externas

### Tabla de MMR: dinámica, con copia de seguridad empaquetada

Valve **no publica** la correspondencia entre medalla y MMR y **ninguna API la
expone**. Verificado: `GET /distributions` de OpenDota devuelve solo
`bin`, `bin_name`, `count` y `cumulative_sum`. Cero MMR.

Como no existe una fuente en vivo, el dato se hace actualizable en lugar de
dinámico de verdad:

1. `public/rank-table.json` se publica junto a la aplicación y se carga en cada
   sesión desde `src/services/rank-table-source.ts`.
2. `DEFAULT_RANK_TABLE` en `src/domain/rank-table.ts` es la copia empaquetada.
   Se usa en el primer render y como fallback.
3. Actualizar los valores es editar el JSON y commitear. Sin cambios de código.

Reglas duras:

- La tabla remota es **entrada no confiable**. `parseRankTable` la valida entera
  y la descarta completa ante cualquier anomalía. Una tabla a medias produciría
  medallas equivocadas con aire de certeza, que es peor que no actualizar.
- El cálculo **nunca espera a la red**. La copia empaquetada rinde en el primer
  paint.
- Los valores son **consenso comunitario, no dato oficial**. Cualquier MMR que se
  muestre lleva la etiqueta de estimación.
- Nunca esparcir números de MMR fuera de la tabla.

### OpenDota (`https://api.opendota.com/api`)

No es crítica: la aplicación calcula correctamente sin conexión.

- `GET /distributions` — funciona. Población por rango (36 bins, `11`–`15`
  Heraldo … `80` Inmortal). Uso opcional: mostrar "este grupo supera al X% de los
  jugadores". Aviso: la muestra está sesgada hacia perfiles públicos y reporta un
  ~4% de Inmortales frente al ~0,05% real. Si se muestra, hay que aclararlo.
- `GET /leaderboards` — **eliminado, devuelve 404**. Por eso la posición de
  leaderboard de un Inmortal se estima localmente con la curva de
  `immortal.leaderboard` en la tabla, sin red y sin API key.

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
