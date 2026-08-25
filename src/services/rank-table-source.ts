import { DEFAULT_RANK_TABLE, parseRankTable, type RankTable } from '../domain/rank-table'

export type RankTableOrigin = 'remote' | 'bundled'

export interface RankTableLoad {
  readonly table: RankTable
  readonly origin: RankTableOrigin
  /** Why the bundled copy was used, when it was. */
  readonly reason?: string
}

export interface LoadRankTableOptions {
  readonly url?: string
  readonly timeoutMs?: number
}

const DEFAULT_TIMEOUT_MS = 5_000

function defaultUrl(): string {
  return `${import.meta.env.BASE_URL}rank-table.json`
}

const bundled = (reason: string): RankTableLoad => ({
  table: DEFAULT_RANK_TABLE,
  origin: 'bundled',
  reason,
})

/**
 * Loads the medal-to-MMR table published alongside the app, so the numbers can
 * be refreshed with a commit instead of a code change.
 *
 * Never rejects and never throws. A remote table is untrusted input: it is
 * validated in full and discarded wholesale if anything is off, because a
 * half-valid table would render confident, wrong medals.
 */
export async function loadRankTable(options: LoadRankTableOptions = {}): Promise<RankTableLoad> {
  const url = options.url ?? defaultUrl()
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { signal: controller.signal })

    if (!response.ok) {
      return bundled(`Remote table responded ${response.status}`)
    }

    return { table: parseRankTable(await response.json()), origin: 'remote' }
  } catch (error) {
    return bundled(error instanceof Error ? error.message : 'Unknown failure')
  } finally {
    clearTimeout(timer)
  }
}
