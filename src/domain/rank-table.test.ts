import { describe, expect, it } from 'vitest'
import { DEFAULT_RANK_TABLE, immortalFloor, parseRankTable } from './rank-table'

describe('DEFAULT_RANK_TABLE', () => {
  it('covers the seven star-based medals in ascending order', () => {
    expect(DEFAULT_RANK_TABLE.medals.map((m) => m.id)).toEqual([
      'herald',
      'guardian',
      'crusader',
      'archon',
      'legend',
      'ancient',
      'divine',
    ])
  })

  it('leaves no gap or overlap between consecutive medal bands', () => {
    const { medals } = DEFAULT_RANK_TABLE

    for (let i = 1; i < medals.length; i += 1) {
      const previous = medals[i - 1]!
      const current = medals[i]!

      expect(current.base).toBe(previous.base + previous.mmrPerStar * 5)
    }
  })

  it('records where the values came from so they are never mistaken for official data', () => {
    expect(DEFAULT_RANK_TABLE.source).toMatch(/community/i)
    expect(DEFAULT_RANK_TABLE.reviewedAt).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('immortalFloor', () => {
  it('derives the floor from the top of the divine band', () => {
    const divine = DEFAULT_RANK_TABLE.medals.at(-1)!

    expect(immortalFloor(DEFAULT_RANK_TABLE)).toBe(divine.base + divine.mmrPerStar * 5)
  })
})

describe('parseRankTable', () => {
  it('accepts the bundled table round-tripped through JSON', () => {
    const parsed = parseRankTable(JSON.parse(JSON.stringify(DEFAULT_RANK_TABLE)))

    expect(parsed).toEqual(DEFAULT_RANK_TABLE)
  })

  it.each([
    ['null', null],
    ['a string', 'herald'],
    ['an empty object', {}],
    ['a table with no medals', { ...DEFAULT_RANK_TABLE, medals: [] }],
    [
      'a medal with a negative base',
      { ...DEFAULT_RANK_TABLE, medals: [{ id: 'herald', base: -1, mmrPerStar: 154 }] },
    ],
    ['a table with no immortal section', { ...DEFAULT_RANK_TABLE, immortal: undefined }],
  ])('rejects %s', (_label, input) => {
    expect(() => parseRankTable(input)).toThrow()
  })

  it('rejects an unknown medal id rather than silently dropping it', () => {
    const table = {
      ...DEFAULT_RANK_TABLE,
      medals: [...DEFAULT_RANK_TABLE.medals, { id: 'titan', base: 6000, mmrPerStar: 200 }],
    }

    expect(() => parseRankTable(table)).toThrow()
  })
})
