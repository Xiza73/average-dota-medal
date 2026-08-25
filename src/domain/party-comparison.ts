/**
 * Head-to-head comparison of two parties.
 *
 * A comparison is only as trustworthy as the intervals behind it. When the two
 * MMR ranges overlap there is no defensible winner, and this module says so
 * instead of naming one. That happens routinely — any unranked Immortal blows
 * one side's interval wide open — so it is the normal case, not an edge case.
 */

import { averageParty, type PartyAverage, type PlayerRank } from './rank-scale'
import type { RankTable } from './rank-table'

export type ComparisonVerdict = 'a' | 'b' | 'inconclusive'

export interface ComparisonScale {
  readonly min: number
  readonly max: number
}

export interface PartyComparison {
  readonly a: PartyAverage
  readonly b: PartyAverage
  readonly verdict: ComparisonVerdict
  /** Absolute distance between the two point estimates. */
  readonly deltaMmr: number
  /** Width of the shared MMR range. Zero when the intervals are disjoint. */
  readonly overlap: number
  /** Union of both intervals, for drawing both bars against one axis. */
  readonly scale: ComparisonScale
}

/**
 * Compares two parties. Returns null unless both sides have a player, so the
 * caller cannot render a verdict against an empty group.
 */
export function compareParties(
  partyA: readonly PlayerRank[],
  partyB: readonly PlayerRank[],
  table: RankTable
): PartyComparison | null {
  const a = averageParty(partyA, table)
  const b = averageParty(partyB, table)

  if (!a || !b) {
    return null
  }

  const overlap = Math.max(0, Math.min(a.mmr.max, b.mmr.max) - Math.max(a.mmr.min, b.mmr.min))

  let verdict: ComparisonVerdict = 'inconclusive'

  if (overlap === 0) {
    verdict = a.mmr.point > b.mmr.point ? 'a' : 'b'
  }

  return {
    a,
    b,
    verdict,
    deltaMmr: Math.abs(a.mmr.point - b.mmr.point),
    overlap,
    scale: {
      min: Math.min(a.mmr.min, b.mmr.min),
      max: Math.max(a.mmr.max, b.mmr.max),
    },
  }
}
