import { useCallback, useMemo, useState } from 'react'
import type { MedalId } from '../domain/rank-table'
import type { PlayerRank, Stars } from '../domain/rank-scale'

export const PARTY_SIZE = 5

export interface PlayerSlot {
  readonly medal: MedalId | null
  readonly stars: Stars
  /** Kept as text: an empty field is "not provided", not zero. */
  readonly leaderboardRank: string
}

const emptySlot: PlayerSlot = { medal: null, stars: 1, leaderboardRank: '' }

function toRank(slot: PlayerSlot): PlayerRank | null {
  if (slot.medal === null) {
    return null
  }

  if (slot.medal === 'immortal') {
    const parsed = Number.parseInt(slot.leaderboardRank, 10)

    return {
      medal: 'immortal',
      leaderboardRank: Number.isInteger(parsed) && parsed > 0 ? parsed : null,
    }
  }

  return { medal: slot.medal, stars: slot.stars }
}

export type Party = ReturnType<typeof useParty>

export function useParty() {
  const [slots, setSlots] = useState<readonly PlayerSlot[]>(() =>
    Array.from({ length: PARTY_SIZE }, () => emptySlot)
  )

  const update = useCallback((index: number, patch: Partial<PlayerSlot>) => {
    setSlots((current) => current.map((slot, i) => (i === index ? { ...slot, ...patch } : slot)))
  }, [])

  const selectMedal = useCallback((index: number, medal: MedalId) => {
    setSlots((current) =>
      current.map((slot, i) =>
        i === index ? { ...slot, medal: slot.medal === medal ? null : medal } : slot
      )
    )
  }, [])

  const selectStars = useCallback(
    (index: number, stars: Stars) => update(index, { stars }),
    [update]
  )

  const setLeaderboardRank = useCallback(
    (index: number, leaderboardRank: string) => update(index, { leaderboardRank }),
    [update]
  )

  const clear = useCallback((index: number) => {
    setSlots((current) => current.map((slot, i) => (i === index ? emptySlot : slot)))
  }, [])

  const ranks = useMemo(
    () => slots.map(toRank).filter((rank): rank is PlayerRank => rank !== null),
    [slots]
  )

  return { slots, ranks, selectMedal, selectStars, setLeaderboardRank, clear }
}
