import { useMemo } from 'react'
import { averageParty } from './domain/rank-scale'
import { useParty } from './hooks/use-party'
import { useRankTable } from './hooks/use-rank-table'
import { PlayerCard } from './components/PlayerCard'
import { ResultPanel } from './components/ResultPanel'

export function App() {
  const { table } = useRankTable()
  const { slots, ranks, selectMedal, selectStars, setLeaderboardRank, clear } = useParty()

  const average = useMemo(() => averageParty(ranks, table), [ranks, table])

  return (
    <div className="page">
      <div className="page__inner">
        <header className="masthead">
          <h1 className="masthead__title">MEDALLA MEDIA</h1>
          <p className="masthead__subtitle">
            Calcula el rango promedio de tu grupo · máx. 5 jugadores
          </p>
          <span className="masthead__rule" aria-hidden="true" />
        </header>

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

        <ResultPanel average={average} />

        <footer className="footnote">
          <p>
            El MMR es una estimación basada en datos de la comunidad. Valve no publica la
            equivalencia entre medalla y MMR.
          </p>
          <p>Herramienta de fans, sin afiliación con Valve.</p>
        </footer>
      </div>
    </div>
  )
}
