import type { PartyAverage } from '../domain/rank-scale'
import { formatMmr, MEDAL_PRESENTATION } from './medal-presentation'

export interface ResultPanelProps {
  readonly average: PartyAverage | null
}

export function ResultPanel({ average }: ResultPanelProps) {
  if (!average) {
    return (
      <div className="result result--empty" role="status">
        <p>Selecciona la medalla de al menos un jugador para ver el promedio.</p>
      </div>
    )
  }

  const { label, short, color } = MEDAL_PRESENTATION[average.medal]
  const countLabel =
    average.playerCount === 1 ? '1 jugador contado' : `${average.playerCount} jugadores contados`

  return (
    <div className="result" role="status">
      <div
        className="result__badge"
        style={{ '--medal-color': color } as React.CSSProperties}
        aria-hidden="true"
      >
        {short}
      </div>

      <div className="result__body">
        <p className="result__caption">Medalla media del grupo</p>

        <div className="result__headline">
          <span className="result__medal" data-testid="average-medal">
            {label}
          </span>
          {average.stars !== null && (
            <span className="result__stars" aria-label={`${average.stars} de 5 estrellas`}>
              {'★'.repeat(average.stars)}
              {'☆'.repeat(5 - average.stars)}
            </span>
          )}
        </div>

        <p className="result__meta">
          MMR estimado: <strong>~{formatMmr(average.mmr.point)}</strong>{' '}
          <span className="result__margin">± {formatMmr(average.marginMmr)}</span> · {countLabel}
        </p>
      </div>
    </div>
  )
}
