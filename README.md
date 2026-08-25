# average-dota-medal

Calculate the **average medal of a Dota 2 party**.

Pick the medal and stars of up to 5 players and get the party average, together
with its margin of error. No Steam login, no match lookup — just a form.

## Why the margin of error matters

Medals are roughly evenly spaced in MMR (~154 MMR per star), so averaging them on
a linear rank scale works well — up to Divine 5. Immortal breaks that: it is an
open-ended bucket with no ceiling. A single Immortal in the party makes the
average uncertain by a wide band, and hiding that would be dishonest. So the
margin of error is part of the result, not a footnote.

Optionally, an Immortal player can enter their leaderboard number to narrow the
estimate.

## Stack

TypeScript · React 19 · Vite · Vitest · **Bun**

## Getting started

```bash
bun install
bun run dev
```

## Scripts

| Command             | What it does                       |
| ------------------- | ---------------------------------- |
| `bun run dev`       | Development server                 |
| `bun run build`     | Typecheck + production build       |
| `bun run preview`   | Serve the production build locally |
| `bun run test`      | Tests in watch mode                |
| `bun run test:run`  | Tests once (CI)                    |
| `bun run lint`      | ESLint                             |
| `bun run format`    | Prettier                           |
| `bun run typecheck` | `tsc --noEmit`                     |

## A note on MMR values

Valve does not publish the medal-to-MMR mapping, and no public API exposes it.
The values used here are **community consensus, not official data**. They live in
a single file (`src/domain/rank-table.ts`) so they are easy to update when they
drift.

## Contributing

Branches target `dev`. `master` only receives PRs from `dev`. Commits follow
[Conventional Commits](https://www.conventionalcommits.org/).

See [CLAUDE.md](./CLAUDE.md) for the full conventions.
