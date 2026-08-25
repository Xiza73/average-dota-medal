import { STAR_MEDAL_IDS, type MedalId } from '../domain/rank-table'

export interface MedalPresentation {
  readonly label: string
  /** Two-letter badge code. Initials collide (Arconte / Ancestral), codes do not. */
  readonly short: string
  readonly color: string
}

export const MEDAL_ORDER: readonly MedalId[] = [...STAR_MEDAL_IDS, 'immortal']

export const MEDAL_PRESENTATION: Record<MedalId, MedalPresentation> = {
  herald: { label: 'Heraldo', short: 'HE', color: '#8c6239' },
  guardian: { label: 'Guardián', short: 'GU', color: '#7f9183' },
  crusader: { label: 'Cruzado', short: 'CR', color: '#7f9ab0' },
  archon: { label: 'Arconte', short: 'AR', color: '#5f86c4' },
  legend: { label: 'Leyenda', short: 'LE', color: '#7f6fc0' },
  ancient: { label: 'Ancestral', short: 'AN', color: '#3fa3a0' },
  divine: { label: 'Divino', short: 'DI', color: '#a970e0' },
  immortal: { label: 'Inmortal', short: 'IM', color: '#d04a3a' },
}

const mmrFormatter = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 })

/** Rounds to the nearest ten: the underlying data is not precise enough for units. */
export function formatMmr(mmr: number): string {
  return mmrFormatter.format(Math.round(mmr / 10) * 10)
}
