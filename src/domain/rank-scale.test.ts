import { describe, expect, it } from 'vitest'
import { DEFAULT_RANK_TABLE as TABLE, immortalFloor } from './rank-table'
import { averageParty, estimatePlayerMmr, mmrToMedal } from './rank-scale'
import type { PlayerRank } from './rank-scale'

const star = (
  medal: 'herald' | 'guardian' | 'crusader' | 'archon' | 'legend' | 'ancient' | 'divine',
  stars: 1 | 2 | 3 | 4 | 5
): PlayerRank => ({ medal, stars })
const immortal = (leaderboardRank: number | null = null): PlayerRank => ({
  medal: 'immortal',
  leaderboardRank,
})

describe('estimatePlayerMmr', () => {
  it('places a star rank inside its own band', () => {
    const estimate = estimatePlayerMmr(star('herald', 1), TABLE)

    expect(estimate.min).toBe(0)
    expect(estimate.max).toBe(154)
    expect(estimate.point).toBeGreaterThan(estimate.min)
    expect(estimate.point).toBeLessThan(estimate.max)
  })

  it('orders every star rank strictly ascending from Herald 1 to Divine 5', () => {
    const all = TABLE.medals.flatMap((m) =>
      ([1, 2, 3, 4, 5] as const).map((s) => estimatePlayerMmr(star(m.id, s), TABLE).point)
    )

    const ascending = [...all].sort((a, b) => a - b)
    expect(all).toEqual(ascending)
    expect(new Set(all).size).toBe(all.length)
  })

  it('puts an unranked Immortal above Divine 5 but keeps a wide margin', () => {
    const divineFive = estimatePlayerMmr(star('divine', 5), TABLE)
    const estimate = estimatePlayerMmr(immortal(), TABLE)

    expect(estimate.point).toBeGreaterThan(divineFive.point)
    expect(estimate.min).toBeGreaterThanOrEqual(immortalFloor(TABLE))
    // The uncertainty for an open-ended bucket must dwarf a single star band.
    expect(estimate.max - estimate.min).toBeGreaterThan(TABLE.medals[0]!.mmrPerStar * 5)
  })

  it('rates a better leaderboard position higher than a worse one', () => {
    const top1 = estimatePlayerMmr(immortal(1), TABLE)
    const top100 = estimatePlayerMmr(immortal(100), TABLE)
    const top1000 = estimatePlayerMmr(immortal(1000), TABLE)

    expect(top1.point).toBeGreaterThan(top100.point)
    expect(top100.point).toBeGreaterThan(top1000.point)
  })

  it('narrows the margin when a leaderboard position is supplied', () => {
    const withRank = estimatePlayerMmr(immortal(250), TABLE)
    const withoutRank = estimatePlayerMmr(immortal(), TABLE)

    expect(withRank.max - withRank.min).toBeLessThan(withoutRank.max - withoutRank.min)
  })

  it('falls back to the unranked bucket for a position outside the leaderboard', () => {
    const beyond = estimatePlayerMmr(immortal(5000), TABLE)

    expect(beyond).toEqual(estimatePlayerMmr(immortal(), TABLE))
  })

  it('never ranks a leaderboard Immortal below the unranked floor', () => {
    const worst = estimatePlayerMmr(immortal(TABLE.immortal.leaderboard.maxRank), TABLE)

    expect(worst.point).toBeGreaterThanOrEqual(immortalFloor(TABLE))
  })
})

describe('mmrToMedal', () => {
  it('maps the bottom of the scale to Herald 1', () => {
    expect(mmrToMedal(0, TABLE)).toEqual({ medal: 'herald', stars: 1 })
  })

  it('maps the top of the divine band to Immortal', () => {
    expect(mmrToMedal(immortalFloor(TABLE), TABLE)).toEqual({ medal: 'immortal', stars: null })
  })

  it('reports no stars for Immortal', () => {
    expect(mmrToMedal(9000, TABLE).stars).toBeNull()
  })

  it('clamps a negative value instead of returning a nonsense medal', () => {
    expect(mmrToMedal(-500, TABLE)).toEqual({ medal: 'herald', stars: 1 })
  })

  it('round-trips every star rank back to itself', () => {
    for (const medal of TABLE.medals) {
      for (const stars of [1, 2, 3, 4, 5] as const) {
        const { point } = estimatePlayerMmr(star(medal.id, stars), TABLE)

        expect(mmrToMedal(point, TABLE)).toEqual({ medal: medal.id, stars })
      }
    }
  })
})

describe('averageParty', () => {
  it('returns null for an empty party', () => {
    expect(averageParty([], TABLE)).toBeNull()
  })

  it('returns the same medal a lone player already has', () => {
    const result = averageParty([star('legend', 3)], TABLE)

    expect(result).not.toBeNull()
    expect(result!.medal).toBe('legend')
    expect(result!.stars).toBe(3)
    expect(result!.playerCount).toBe(1)
  })

  it('averages five identical players back to that same rank', () => {
    const party = Array.from({ length: 5 }, () => star('archon', 2))
    const result = averageParty(party, TABLE)

    expect(result!.medal).toBe('archon')
    expect(result!.stars).toBe(2)
    expect(result!.playerCount).toBe(5)
  })

  it('lands between the two ranks for a mixed pair', () => {
    const result = averageParty([star('herald', 1), star('legend', 1)], TABLE)!
    const low = estimatePlayerMmr(star('herald', 1), TABLE).point
    const high = estimatePlayerMmr(star('legend', 1), TABLE).point

    expect(result.mmr.point).toBeGreaterThan(low)
    expect(result.mmr.point).toBeLessThan(high)
    expect(result.medal).toBe('crusader')
  })

  it('does not collapse Herald 1 plus an Immortal into a near-Divine result', () => {
    const result = averageParty([star('herald', 1), immortal()], TABLE)!

    // The whole point of the linear MMR scale: one Immortal should pull the
    // average to the middle of the ladder, not to the top of it.
    expect(result.medal).not.toBe('immortal')
    expect(result.medal).not.toBe('divine')
    expect(result.mmr.point).toBeLessThan(immortalFloor(TABLE) / 2 + 500)
  })

  it('keeps an all-Immortal party at Immortal', () => {
    const party = Array.from({ length: 5 }, () => immortal())

    expect(averageParty(party, TABLE)!.medal).toBe('immortal')
  })

  it('always reports a margin, and widens it when an unranked Immortal joins', () => {
    const tight = averageParty([star('legend', 3), star('legend', 3)], TABLE)!
    const loose = averageParty([star('legend', 3), immortal()], TABLE)!

    expect(tight.marginMmr).toBeGreaterThan(0)
    expect(loose.marginMmr).toBeGreaterThan(tight.marginMmr)
  })

  it('exposes a margin consistent with the averaged bounds', () => {
    const result = averageParty([star('ancient', 4), immortal(300)], TABLE)!

    expect(result.marginMmr).toBeCloseTo((result.mmr.max - result.mmr.min) / 2, 6)
    expect(result.mmr.point).toBeGreaterThanOrEqual(result.mmr.min)
    expect(result.mmr.point).toBeLessThanOrEqual(result.mmr.max)
  })

  it('ignores the order players were entered in', () => {
    const a = averageParty([star('herald', 2), star('divine', 4), immortal(10)], TABLE)!
    const b = averageParty([immortal(10), star('herald', 2), star('divine', 4)], TABLE)!

    expect(a).toEqual(b)
  })
})
