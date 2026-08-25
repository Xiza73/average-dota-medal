import { useId } from 'react'
import type { MedalId } from '../domain/rank-table'
import type { Stars } from '../domain/rank-scale'
import type { PlayerSlot } from '../hooks/use-party'
import { MEDAL_ORDER, MEDAL_PRESENTATION } from './medal-presentation'

const STAR_VALUES: readonly Stars[] = [1, 2, 3, 4, 5]

export interface PlayerCardProps {
  readonly number: number
  readonly slot: PlayerSlot
  readonly onSelectMedal: (medal: MedalId) => void
  readonly onSelectStars: (stars: Stars) => void
  readonly onLeaderboardRankChange: (value: string) => void
  readonly onClear: () => void
}

export function PlayerCard({
  number,
  slot,
  onSelectMedal,
  onSelectStars,
  onLeaderboardRankChange,
  onClear,
}: PlayerCardProps) {
  const titleId = useId()
  const rankInputId = useId()
  const isImmortal = slot.medal === 'immortal'

  return (
    <div className="player-card" role="group" aria-labelledby={titleId}>
      <div className="player-card__head">
        <div className="player-card__identity">
          <span className="player-card__number" aria-hidden="true">
            {number}
          </span>
          <span className="player-card__title" id={titleId}>
            Jugador {number}
          </span>
        </div>
        {slot.medal !== null && (
          <button type="button" className="player-card__clear" onClick={onClear}>
            Quitar
          </button>
        )}
      </div>

      <div className="medal-grid">
        {MEDAL_ORDER.map((medal) => {
          const { label, color } = MEDAL_PRESENTATION[medal]
          const selected = slot.medal === medal

          return (
            <button
              type="button"
              key={medal}
              className="medal-chip"
              data-selected={selected}
              aria-pressed={selected}
              style={{ '--medal-color': color } as React.CSSProperties}
              onClick={() => onSelectMedal(medal)}
            >
              <span className="medal-chip__dot" aria-hidden="true" />
              {label}
            </button>
          )
        })}
      </div>

      {slot.medal !== null && !isImmortal && (
        <div className="player-card__row">
          <span className="player-card__label">Estrellas</span>
          <div className="star-row" role="group" aria-label="Estrellas">
            {STAR_VALUES.map((value) => (
              <button
                type="button"
                key={value}
                className="star-button"
                data-filled={value <= slot.stars}
                aria-label={`${value} estrellas`}
                aria-pressed={value === slot.stars}
                onClick={() => onSelectStars(value)}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      )}

      {isImmortal && (
        <div className="player-card__row">
          <label className="player-card__label" htmlFor={rankInputId}>
            Ranking
          </label>
          <input
            id={rankInputId}
            className="rank-input"
            type="number"
            min={1}
            inputMode="numeric"
            placeholder="opcional"
            value={slot.leaderboardRank}
            onChange={(event) => onLeaderboardRankChange(event.target.value)}
          />
          <span className="player-card__hint">posición en la tabla Inmortal</span>
        </div>
      )}
    </div>
  )
}
