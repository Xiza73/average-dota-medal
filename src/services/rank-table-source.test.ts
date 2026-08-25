import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_RANK_TABLE } from '../domain/rank-table'
import { loadRankTable } from './rank-table-source'

const jsonResponse = (body: unknown, ok = true) =>
  ({ ok, status: ok ? 200 : 500, json: async () => body }) as Response

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('loadRankTable', () => {
  it('uses the remote table when it is valid', async () => {
    const remote = { ...DEFAULT_RANK_TABLE, version: '99', reviewedAt: '2030-01-01' }
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse(remote))
    )

    const result = await loadRankTable()

    expect(result.origin).toBe('remote')
    expect(result.table.version).toBe('99')
  })

  it('falls back to the bundled table when the request fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('network down')
      })
    )

    const result = await loadRankTable()

    expect(result.origin).toBe('bundled')
    expect(result.table).toEqual(DEFAULT_RANK_TABLE)
  })

  it('falls back on a non-ok response', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({}, false))
    )

    const result = await loadRankTable()

    expect(result.origin).toBe('bundled')
  })

  it('falls back rather than trusting a malformed remote table', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => jsonResponse({ medals: 'nope' }))
    )

    const result = await loadRankTable()

    expect(result.origin).toBe('bundled')
    expect(result.table).toEqual(DEFAULT_RANK_TABLE)
  })

  it('never rejects, so a failed load can never blank the app', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => {
        throw new Error('boom')
      })
    )

    await expect(loadRankTable()).resolves.toBeDefined()
  })

  it('requests the table over https from a relative path', async () => {
    const fetchMock = vi.fn<(url: RequestInfo | URL) => Promise<Response>>(async () =>
      jsonResponse(DEFAULT_RANK_TABLE)
    )
    vi.stubGlobal('fetch', fetchMock)

    await loadRankTable()

    const url = fetchMock.mock.calls[0]?.[0]
    expect(String(url)).toContain('rank-table.json')
  })
})
