import { useMemo, useState } from 'react'
import { averageParty } from './domain/rank-scale'
import { compareParties } from './domain/party-comparison'
import { useParty } from './hooks/use-party'
import { useRankTable } from './hooks/use-rank-table'
import { PartyEditor } from './components/PartyEditor'
import { ResultPanel } from './components/ResultPanel'
import { ComparisonPanel } from './components/ComparisonPanel'

type Mode = 'single' | 'compare'
type GroupId = 'a' | 'b'

export function App() {
  const { table } = useRankTable()
  const groupA = useParty()
  const groupB = useParty()

  const [mode, setMode] = useState<Mode>('single')
  const [activeGroup, setActiveGroup] = useState<GroupId>('a')

  const average = useMemo(() => averageParty(groupA.ranks, table), [groupA.ranks, table])
  const comparison = useMemo(
    () => compareParties(groupA.ranks, groupB.ranks, table),
    [groupA.ranks, groupB.ranks, table]
  )

  const comparing = mode === 'compare'

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

        <div className="mode-switch" role="group" aria-label="Modo de cálculo">
          <button
            type="button"
            className="mode-switch__option"
            data-active={!comparing}
            aria-pressed={!comparing}
            onClick={() => setMode('single')}
          >
            Un grupo
          </button>
          <button
            type="button"
            className="mode-switch__option"
            data-active={comparing}
            aria-pressed={comparing}
            onClick={() => setMode('compare')}
          >
            Comparar
          </button>
        </div>

        {comparing && (
          <div className="group-tabs" role="tablist" aria-label="Grupo a editar">
            {(['a', 'b'] as const).map((group) => (
              <button
                type="button"
                key={group}
                role="tab"
                id={`tab-${group}`}
                aria-controls={`panel-${group}`}
                aria-selected={activeGroup === group}
                tabIndex={activeGroup === group ? 0 : -1}
                className="group-tabs__tab"
                onClick={() => setActiveGroup(group)}
              >
                Grupo {group.toUpperCase()}
              </button>
            ))}
          </div>
        )}

        {comparing ? (
          <div role="tabpanel" id={`panel-${activeGroup}`} aria-labelledby={`tab-${activeGroup}`}>
            <PartyEditor party={activeGroup === 'a' ? groupA : groupB} />
          </div>
        ) : (
          <PartyEditor party={groupA} />
        )}

        {comparing ? (
          <ComparisonPanel comparison={comparison} />
        ) : (
          <ResultPanel average={average} />
        )}

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
