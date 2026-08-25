import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'

const card = (n: number) => screen.getByRole('group', { name: `Jugador ${n}` })
const pick = (user: ReturnType<typeof userEvent.setup>, n: number, medal: string) =>
  user.click(within(card(n)).getByRole('button', { name: medal }))

const enterCompareMode = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: /comparar/i }))
}

const openGroup = async (user: ReturnType<typeof userEvent.setup>, group: 'A' | 'B') => {
  await user.click(screen.getByRole('tab', { name: `Grupo ${group}` }))
}

describe('App · comparison mode', () => {
  it('starts on the single-group mode', () => {
    render(<App />)

    expect(screen.queryByRole('tab', { name: 'Grupo A' })).not.toBeInTheDocument()
    expect(screen.getByText(/selecciona la medalla de al menos un jugador/i)).toBeInTheDocument()
  })

  it('reveals two group tabs when comparison mode is turned on', async () => {
    const user = userEvent.setup()
    render(<App />)

    await enterCompareMode(user)

    expect(screen.getByRole('tab', { name: 'Grupo A' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Grupo B' })).toBeInTheDocument()
  })

  it('keeps what was already entered as group A', async () => {
    const user = userEvent.setup()
    render(<App />)

    await pick(user, 1, 'Leyenda')
    await enterCompareMode(user)

    expect(within(card(1)).getByRole('button', { name: 'Leyenda' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('edits the two groups independently', async () => {
    const user = userEvent.setup()
    render(<App />)

    await pick(user, 1, 'Leyenda')
    await enterCompareMode(user)
    await openGroup(user, 'B')

    // Group B starts empty even though group A has a player.
    expect(within(card(1)).getByRole('button', { name: 'Leyenda' })).toHaveAttribute(
      'aria-pressed',
      'false'
    )

    await pick(user, 1, 'Divino')
    await openGroup(user, 'A')

    expect(within(card(1)).getByRole('button', { name: 'Leyenda' })).toHaveAttribute(
      'aria-pressed',
      'true'
    )
  })

  it('asks for a player on both sides before comparing', async () => {
    const user = userEvent.setup()
    render(<App />)

    await enterCompareMode(user)
    await pick(user, 1, 'Leyenda')

    expect(screen.getByText(/al menos un jugador en cada grupo/i)).toBeInTheDocument()
  })

  it('names the stronger group when the ranges do not overlap', async () => {
    const user = userEvent.setup()
    render(<App />)

    await enterCompareMode(user)
    await pick(user, 1, 'Heraldo')
    await openGroup(user, 'B')
    await pick(user, 1, 'Divino')

    const result = screen.getByRole('status')
    expect(within(result).getByText(/grupo b es más fuerte/i)).toBeInTheDocument()
    expect(within(result).getByText(/diferencia/i)).toBeInTheDocument()
  })

  it('refuses to pick a winner when the ranges overlap', async () => {
    const user = userEvent.setup()
    render(<App />)

    await enterCompareMode(user)
    await pick(user, 1, 'Arconte')
    await openGroup(user, 'B')
    await pick(user, 1, 'Arconte')

    const result = screen.getByRole('status')
    expect(within(result).getByText(/demasiado parejo/i)).toBeInTheDocument()
    expect(within(result).queryByText(/es más fuerte/i)).not.toBeInTheDocument()
  })

  it('draws a labelled range bar for each group', async () => {
    const user = userEvent.setup()
    render(<App />)

    await enterCompareMode(user)
    await pick(user, 1, 'Heraldo')
    await openGroup(user, 'B')
    await pick(user, 1, 'Divino')

    const result = screen.getByRole('status')
    expect(within(result).getByRole('img', { name: /grupo a.*mmr/i })).toBeInTheDocument()
    expect(within(result).getByRole('img', { name: /grupo b.*mmr/i })).toBeInTheDocument()
  })

  it('returns to the single-group result when comparison mode is turned off', async () => {
    const user = userEvent.setup()
    render(<App />)

    await enterCompareMode(user)
    await pick(user, 1, 'Leyenda')
    await user.click(screen.getByRole('button', { name: /un grupo/i }))

    const result = screen.getByRole('status')
    expect(within(result).getByTestId('average-medal')).toHaveTextContent('Leyenda')
  })
})
