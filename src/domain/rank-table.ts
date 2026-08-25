/**
 * Medal-to-MMR reference data.
 *
 * Valve does not publish the mapping between a medal and its MMR, and no public
 * API exposes it (OpenDota's /distributions returns population counts only).
 * Every number in this file is community consensus and drifts over time, which
 * is exactly why it is isolated here and mirrored in `public/rank-table.json`:
 * the deployed table can be refreshed without touching any logic.
 */

export const STAR_MEDAL_IDS = [
  'herald',
  'guardian',
  'crusader',
  'archon',
  'legend',
  'ancient',
  'divine',
] as const

export type StarMedalId = (typeof STAR_MEDAL_IDS)[number]
export type MedalId = StarMedalId | 'immortal'

export const STARS_PER_MEDAL = 5

/** One medal's MMR band. Stars inside a band are evenly spaced. */
export interface MedalBand {
  readonly id: StarMedalId
  /** MMR at the bottom of star 1. */
  readonly base: number
  readonly mmrPerStar: number
}

/**
 * Immortal has no ceiling, so it cannot be described as a band. It is modelled
 * as a wide bucket, optionally narrowed by a leaderboard position.
 */
export interface ImmortalModel {
  /** Used when the player is Immortal but gave no leaderboard position. */
  readonly unranked: {
    /** Where most Immortals actually sit — not the midpoint of the range. */
    readonly typical: number
    /** Upper bound of the honest uncertainty for an unranked Immortal. */
    readonly max: number
  }
  /** Logarithmic decay from the very top of the ladder down to `maxRank`. */
  readonly leaderboard: {
    readonly topMmr: number
    readonly decay: number
    readonly maxRank: number
    /** Half-width of the uncertainty once a position is known. */
    readonly margin: number
  }
}

export interface RankTable {
  readonly version: string
  readonly source: string
  /** ISO date (YYYY-MM-DD) the values were last checked. */
  readonly reviewedAt: string
  readonly medals: readonly MedalBand[]
  readonly immortal: ImmortalModel
}

export const DEFAULT_RANK_TABLE: RankTable = {
  version: '1',
  source:
    'Community consensus. Valve does not publish medal-to-MMR values and no public API exposes them.',
  reviewedAt: '2026-08-25',
  medals: [
    { id: 'herald', base: 0, mmrPerStar: 154 },
    { id: 'guardian', base: 770, mmrPerStar: 154 },
    { id: 'crusader', base: 1540, mmrPerStar: 154 },
    { id: 'archon', base: 2310, mmrPerStar: 154 },
    { id: 'legend', base: 3080, mmrPerStar: 154 },
    { id: 'ancient', base: 3850, mmrPerStar: 154 },
    // Divine stars are commonly reported as costing more than the lower medals.
    { id: 'divine', base: 4620, mmrPerStar: 200 },
  ],
  immortal: {
    unranked: { typical: 5900, max: 7500 },
    leaderboard: { topMmr: 12000, decay: 724, maxRank: 1000, margin: 400 },
  },
}

/** Lowest MMR that still counts as Immortal, derived from the top of Divine. */
export function immortalFloor(table: RankTable): number {
  const top = table.medals[table.medals.length - 1]

  if (!top) {
    throw new Error('Rank table has no medal bands')
  }

  return top.base + top.mmrPerStar * STARS_PER_MEDAL
}

class RankTableError extends Error {
  constructor(message: string) {
    super(`Invalid rank table: ${message}`)
    this.name = 'RankTableError'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readNumber(source: Record<string, unknown>, key: string, path: string): number {
  const value = source[key]

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new RankTableError(`${path}.${key} must be a finite number`)
  }

  return value
}

function readPositive(source: Record<string, unknown>, key: string, path: string): number {
  const value = readNumber(source, key, path)

  if (value <= 0) {
    throw new RankTableError(`${path}.${key} must be greater than zero`)
  }

  return value
}

function readString(source: Record<string, unknown>, key: string, path: string): string {
  const value = source[key]

  if (typeof value !== 'string' || value.length === 0) {
    throw new RankTableError(`${path}.${key} must be a non-empty string`)
  }

  return value
}

function readSection(source: Record<string, unknown>, key: string, path: string) {
  const value = source[key]

  if (!isRecord(value)) {
    throw new RankTableError(`${path}.${key} must be an object`)
  }

  return value
}

function parseMedals(input: unknown): MedalBand[] {
  if (!Array.isArray(input) || input.length !== STAR_MEDAL_IDS.length) {
    throw new RankTableError(`medals must list exactly ${STAR_MEDAL_IDS.length} bands`)
  }

  return input.map((raw, index) => {
    const expectedId = STAR_MEDAL_IDS[index]
    const path = `medals[${index}]`

    if (!isRecord(raw)) {
      throw new RankTableError(`${path} must be an object`)
    }

    const id = readString(raw, 'id', path)

    if (id !== expectedId) {
      throw new RankTableError(`${path}.id must be "${expectedId}", got "${id}"`)
    }

    const base = readNumber(raw, 'base', path)

    if (base < 0) {
      throw new RankTableError(`${path}.base must not be negative`)
    }

    return { id: expectedId, base, mmrPerStar: readPositive(raw, 'mmrPerStar', path) }
  })
}

function assertContiguous(medals: readonly MedalBand[]): void {
  for (let i = 1; i < medals.length; i += 1) {
    const previous = medals[i - 1]
    const current = medals[i]

    if (!previous || !current) {
      throw new RankTableError('medals contains an empty slot')
    }

    const expected = previous.base + previous.mmrPerStar * STARS_PER_MEDAL

    if (current.base !== expected) {
      throw new RankTableError(
        `${current.id}.base must be ${expected} to sit flush against ${previous.id}, got ${current.base}`
      )
    }
  }
}

/**
 * Validates untrusted input — a remotely fetched table is data, not a typed
 * object. Throws rather than repairing: a half-valid table would produce
 * plausible but wrong medals, which is worse than falling back to the bundled
 * copy.
 */
export function parseRankTable(input: unknown): RankTable {
  if (!isRecord(input)) {
    throw new RankTableError('expected an object')
  }

  const medals = parseMedals(input['medals'])
  assertContiguous(medals)

  const immortal = readSection(input, 'immortal', 'table')
  const unranked = readSection(immortal, 'unranked', 'immortal')
  const leaderboard = readSection(immortal, 'leaderboard', 'immortal')

  const table: RankTable = {
    version: readString(input, 'version', 'table'),
    source: readString(input, 'source', 'table'),
    reviewedAt: readString(input, 'reviewedAt', 'table'),
    medals,
    immortal: {
      unranked: {
        typical: readPositive(unranked, 'typical', 'immortal.unranked'),
        max: readPositive(unranked, 'max', 'immortal.unranked'),
      },
      leaderboard: {
        topMmr: readPositive(leaderboard, 'topMmr', 'immortal.leaderboard'),
        decay: readPositive(leaderboard, 'decay', 'immortal.leaderboard'),
        maxRank: readPositive(leaderboard, 'maxRank', 'immortal.leaderboard'),
        margin: readPositive(leaderboard, 'margin', 'immortal.leaderboard'),
      },
    },
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(table.reviewedAt)) {
    throw new RankTableError('reviewedAt must be an ISO date (YYYY-MM-DD)')
  }

  const floor = immortalFloor(table)

  if (table.immortal.unranked.typical < floor) {
    throw new RankTableError('immortal.unranked.typical must sit above the top of Divine')
  }

  if (table.immortal.unranked.max <= table.immortal.unranked.typical) {
    throw new RankTableError('immortal.unranked.max must exceed immortal.unranked.typical')
  }

  return table
}
