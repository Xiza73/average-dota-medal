/**
 * Party average on a linear MMR scale.
 *
 * Medals are (near enough) evenly spaced in MMR, so averaging on that scale
 * answers the question players actually ask: "what level is this group?".
 * Averaging population percentiles instead would drag every result toward the
 * crowded middle of the ladder and is deliberately not used here.
 *
 * Every rank becomes an interval, never a single number. Immortal is an
 * open-ended bucket, so the uncertainty it introduces is part of the result
 * rather than a footnote.
 */

import {
  immortalFloor,
  STARS_PER_MEDAL,
  type MedalId,
  type RankTable,
  type StarMedalId,
} from './rank-table'

export type Stars = 1 | 2 | 3 | 4 | 5

export type PlayerRank =
  | { readonly medal: StarMedalId; readonly stars: Stars }
  | { readonly medal: 'immortal'; readonly leaderboardRank: number | null }

export interface MmrEstimate {
  /** Best single guess. Not necessarily the midpoint of the interval. */
  readonly point: number
  readonly min: number
  readonly max: number
}

export interface MedalPosition {
  readonly medal: MedalId
  /** Immortal has no stars. */
  readonly stars: Stars | null
}

export interface PartyAverage extends MedalPosition {
  readonly mmr: MmrEstimate
  /** Half the width of the averaged interval. Always reported. */
  readonly marginMmr: number
  readonly playerCount: number
}

function findBand(table: RankTable, medal: StarMedalId) {
  const band = table.medals.find((candidate) => candidate.id === medal)

  if (!band) {
    throw new Error(`Rank table has no band for medal "${medal}"`)
  }

  return band
}

function estimateUnrankedImmortal(table: RankTable): MmrEstimate {
  const { typical, max } = table.immortal.unranked

  return { point: typical, min: immortalFloor(table), max }
}

function estimateLeaderboardImmortal(table: RankTable, position: number): MmrEstimate {
  const { topMmr, decay, maxRank, margin } = table.immortal.leaderboard

  // Outside the published leaderboard the position tells us nothing extra.
  if (!Number.isInteger(position) || position < 1 || position > maxRank) {
    return estimateUnrankedImmortal(table)
  }

  const floor = immortalFloor(table)
  const point = Math.max(floor, topMmr - decay * Math.log(position))

  return { point, min: Math.max(floor, point - margin), max: point + margin }
}

/** Converts one player's declared rank into an MMR interval. */
export function estimatePlayerMmr(rank: PlayerRank, table: RankTable): MmrEstimate {
  if (rank.medal === 'immortal') {
    return rank.leaderboardRank === null
      ? estimateUnrankedImmortal(table)
      : estimateLeaderboardImmortal(table, rank.leaderboardRank)
  }

  const band = findBand(table, rank.medal)
  const min = band.base + (rank.stars - 1) * band.mmrPerStar

  return { point: min + band.mmrPerStar / 2, min, max: min + band.mmrPerStar }
}

/** Converts an MMR value back into the medal a player would be wearing. */
export function mmrToMedal(mmr: number, table: RankTable): MedalPosition {
  if (mmr >= immortalFloor(table)) {
    return { medal: 'immortal', stars: null }
  }

  const clamped = Math.max(0, mmr)

  for (let i = table.medals.length - 1; i >= 0; i -= 1) {
    const band = table.medals[i]

    if (!band || clamped < band.base) {
      continue
    }

    const offset = Math.floor((clamped - band.base) / band.mmrPerStar)
    const stars = Math.min(STARS_PER_MEDAL, Math.max(1, offset + 1))

    return { medal: band.id, stars: stars as Stars }
  }

  return { medal: 'herald', stars: 1 }
}

/**
 * Averages the party. Returns null for an empty party rather than a zeroed
 * result, so callers cannot render a medal nobody selected.
 */
export function averageParty(ranks: readonly PlayerRank[], table: RankTable): PartyAverage | null {
  if (ranks.length === 0) {
    return null
  }

  const estimates = ranks.map((rank) => estimatePlayerMmr(rank, table))
  const mean = (pick: (estimate: MmrEstimate) => number) =>
    estimates.reduce((total, estimate) => total + pick(estimate), 0) / estimates.length

  const mmr: MmrEstimate = {
    point: mean((estimate) => estimate.point),
    min: mean((estimate) => estimate.min),
    max: mean((estimate) => estimate.max),
  }

  return {
    ...mmrToMedal(mmr.point, table),
    mmr,
    marginMmr: (mmr.max - mmr.min) / 2,
    playerCount: ranks.length,
  }
}
