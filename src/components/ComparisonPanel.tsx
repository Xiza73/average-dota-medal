import type { PartyAverage } from '../domain/rank-scale'
import type { PartyComparison } from '../domain/party-comparison'
import { formatMmr, MEDAL_PRESENTATION } from './medal-presentation'

export interface ComparisonPanelProps {
  readonly comparison: PartyComparison | null
}

interface RangeBarProps {
  readonly label: string
  readonly average: PartyAverage
  readonly scale: { readonly min: number; readonly max: number }
  readonly winner: boolean
}

function RangeBar({ label, average, scale, winner }: RangeBarProps) {
  const span = scale.max - scale.min
  const asPercent = (value: number) => (span > 0 ? ((value - scale.min) / span) * 100 : 0)

  const { label: medalLabel, color } = MEDAL_PRESENTATION[average.medal]
  const left = asPercent(average.mmr.min)
  const width = Math.max(asPercent(average.mmr.max) - left, 1)

  return (
    <div className="range" data-winner={winner}>
      <div className="range__head">
        <span className="range__label">{label}</span>
        <span className="range__medal">
          {medalLabel}
          {average.stars !== null && (
            <span className="range__stars" aria-label={`${average.stars} de 5 estrellas`}>
              {'★'.repeat(average.stars)}
            </span>
          )}
        </span>
        <span className="range__value">
          ~{formatMmr(average.mmr.point)}{' '}
          <span className="range__margin">± {formatMmr(average.marginMmr)}</span>
        </span>
      </div>

      <div
        className="range__track"
        role="img"
        aria-label={`${label}: entre ${formatMmr(average.mmr.min)} y ${formatMmr(average.mmr.max)} MMR`}
      >
        <span
          className="range__span"
          style={
            {
              left: `${left}%`,
              width: `${width}%`,
              '--medal-color': color,
            } as React.CSSProperties
          }
        >
          <span
            className="range__point"
            style={{
              left: `${width > 0 ? ((asPercent(average.mmr.point) - left) / width) * 100 : 0}%`,
            }}
          />
        </span>
      </div>
    </div>
  )
}

export function ComparisonPanel({ comparison }: ComparisonPanelProps) {
  if (!comparison) {
    return (
      <div className="result result--empty" role="status">
        <p>Selecciona al menos un jugador en cada grupo para comparar.</p>
      </div>
    )
  }

  const { a, b, verdict, deltaMmr, overlap, scale } = comparison
  const inconclusive = verdict === 'inconclusive'

  return (
    <div className="result result--comparison" role="status">
      <div className="verdict">
        <p className="verdict__headline" data-inconclusive={inconclusive}>
          {inconclusive ? 'Demasiado parejo' : `Grupo ${verdict.toUpperCase()} es más fuerte`}
        </p>
        <p className="verdict__detail">
          {inconclusive
            ? `Los rangos se solapan en ~${formatMmr(overlap)} MMR. Con esa incertidumbre, afirmar un ganador sería inventar.`
            : `Diferencia estimada de ~${formatMmr(deltaMmr)} MMR entre los promedios.`}
        </p>
      </div>

      <div className="ranges">
        <RangeBar label="Grupo A" average={a} scale={scale} winner={verdict === 'a'} />
        <RangeBar label="Grupo B" average={b} scale={scale} winner={verdict === 'b'} />
      </div>

      <p className="verdict__axis">
        <span>~{formatMmr(scale.min)}</span>
        <span>MMR estimado</span>
        <span>~{formatMmr(scale.max)}</span>
      </p>
    </div>
  )
}
