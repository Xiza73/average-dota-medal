import type { Party } from '../hooks/use-party'
import { PlayerCard } from './PlayerCard'

export interface PartyEditorProps {
  readonly party: Party
}

export function PartyEditor({ party }: PartyEditorProps) {
  const { slots, selectMedal, selectStars, setLeaderboardRank, clear } = party

  return (
    <div className="party">
      {slots.map((slot, index) => (
        <PlayerCard
          key={index}
          number={index + 1}
          slot={slot}
          onSelectMedal={(medal) => selectMedal(index, medal)}
          onSelectStars={(stars) => selectStars(index, stars)}
          onLeaderboardRankChange={(value) => setLeaderboardRank(index, value)}
          onClear={() => clear(index)}
        />
      ))}
    </div>
  )
}
