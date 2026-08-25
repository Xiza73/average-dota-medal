import { describe, expect, it } from 'vitest'
import { DEFAULT_RANK_TABLE as TABLE } from './rank-table'
import { compareParties } from './party-comparison'
import type { PlayerRank, Stars } from './rank-scale'

const star = (
  medal: 'herald' | 'archon' | 'legend' | 'ancient' | 'divine',
  stars: Stars
): PlayerRank => ({ medal, stars })
const immortal = (leaderboardRank: number | null = null): PlayerRank => ({
  medal: 'immortal',
  leaderboardRank,
})

describe('compareParties', () => {
  it('returns null unless both sides have at least one player', () => {
    expect(compareParties([], [star('legend', 3)], TABLE)).toBeNull()
    expect(compareParties([star('legend', 3)], [], TABLE)).toBeNull()
    expect(compareParties([], [], TABLE)).toBeNull()
  })

  it('names the stronger side when the intervals do not overlap', () => {
    const result = compareParties([star('herald', 1)], [star('divine', 5)], TABLE)!

    expect(result.verdict).toBe('b')
    expect(result.overlap).toBe(0)
    expect(result.deltaMmr).toBeGreaterThan(0)
  })

  it('names side a when a is the stronger one', () => {
    const result = compareParties([star('divine', 5)], [star('herald', 1)], TABLE)!

    expect(result.verdict).toBe('a')
  })

  it('refuses to pick a winner when the intervals overlap', () => {
    // Same rank on both sides: the intervals are identical, so any verdict
    // beyond "too close" would be invented.
    const result = compareParties([star('legend', 3)], [star('legend', 3)], TABLE)!

    expect(result.verdict).toBe('inconclusive')
    expect(result.deltaMmr).toBe(0)
    expect(result.overlap).toBeGreaterThan(0)
  })

  it('treats a nearby pair as too close rather than splitting hairs', () => {
    const result = compareParties([star('legend', 3)], [star('legend', 4)], TABLE)!

    // Adjacent star bands share a boundary but do not overlap.
    expect(result.overlap).toBe(0)
    expect(result.verdict).toBe('b')
  })

  it('refuses the verdict the point estimates alone would suggest', () => {
    // a sits higher on paper, but b carries an unranked Immortal, so b's
    // interval is wide enough to reach past a. Reading only the midpoints here
    // would hand a a win the data does not support.
    const a = [star('legend', 3)]
    const b = [star('herald', 1), immortal()]
    const result = compareParties(a, b, TABLE)!

    expect(result.a.mmr.point).toBeGreaterThan(result.b.mmr.point)
    expect(result.overlap).toBeGreaterThan(0)
    expect(result.verdict).toBe('inconclusive')
  })

  it('still names a winner when a wide Immortal side clears the other outright', () => {
    const result = compareParties([star('legend', 3)], [star('ancient', 1), immortal()], TABLE)!

    // Averaging lifts b's whole interval above a's, so the width costs it nothing.
    expect(result.overlap).toBe(0)
    expect(result.verdict).toBe('b')
  })

  it('reports the delta as an absolute distance regardless of direction', () => {
    const forward = compareParties([star('herald', 1)], [star('divine', 5)], TABLE)!
    const backward = compareParties([star('divine', 5)], [star('herald', 1)], TABLE)!

    expect(forward.deltaMmr).toBe(backward.deltaMmr)
    expect(forward.deltaMmr).toBeGreaterThan(0)
  })

  it('mirrors the verdict when the sides are swapped', () => {
    const forward = compareParties([star('herald', 1)], [star('divine', 5)], TABLE)!
    const backward = compareParties([star('divine', 5)], [star('herald', 1)], TABLE)!

    expect(forward.verdict).toBe('b')
    expect(backward.verdict).toBe('a')
    expect(forward.overlap).toBe(backward.overlap)
  })

  it('measures the overlap in MMR', () => {
    const result = compareParties([star('legend', 3)], [star('legend', 3)], TABLE)!
    const band = TABLE.medals.find((m) => m.id === 'legend')!

    // Identical intervals overlap completely: one full star band.
    expect(result.overlap).toBeCloseTo(band.mmrPerStar, 6)
  })

  it('exposes a scale that spans both intervals so bars can be drawn to it', () => {
    const result = compareParties([star('herald', 1)], [immortal()], TABLE)!

    expect(result.scale.min).toBe(Math.min(result.a.mmr.min, result.b.mmr.min))
    expect(result.scale.max).toBe(Math.max(result.a.mmr.max, result.b.mmr.max))
    expect(result.scale.max).toBeGreaterThan(result.scale.min)
  })

  it('carries each side full average through untouched', () => {
    const a = [star('archon', 2)]
    const b = [star('ancient', 4), immortal(50)]
    const result = compareParties(a, b, TABLE)!

    expect(result.a.medal).toBe('archon')
    expect(result.a.playerCount).toBe(1)
    expect(result.b.playerCount).toBe(2)
    expect(result.b.marginMmr).toBeGreaterThan(0)
  })

  it('compares sides of different sizes without complaint', () => {
    const result = compareParties(
      [star('legend', 1), star('legend', 2), star('legend', 3)],
      [star('legend', 2)],
      TABLE
    )

    expect(result).not.toBeNull()
    expect(result!.a.playerCount).toBe(3)
    expect(result!.b.playerCount).toBe(1)
  })
})
