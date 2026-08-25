import { useEffect, useState } from 'react'
import { DEFAULT_RANK_TABLE, type RankTable } from '../domain/rank-table'
import { loadRankTable, type RankTableOrigin } from '../services/rank-table-source'

export interface UseRankTable {
  readonly table: RankTable
  readonly origin: RankTableOrigin
}

/**
 * Starts from the bundled table so the app is usable on the first paint, then
 * swaps in the published one if it arrives. The calculation never waits on the
 * network.
 */
export function useRankTable(): UseRankTable {
  const [state, setState] = useState<UseRankTable>({
    table: DEFAULT_RANK_TABLE,
    origin: 'bundled',
  })

  useEffect(() => {
    let active = true

    void loadRankTable().then((result) => {
      if (active && result.origin === 'remote') {
        setState({ table: result.table, origin: result.origin })
      }
    })

    return () => {
      active = false
    }
  }, [])

  return state
}
