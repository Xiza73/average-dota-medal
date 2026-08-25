import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { App } from './App'

const playerCard = (n: number) => screen.getByRole('group', { name: `Jugador ${n}` })

describe('App', () => {
  it('offers a slot for five players', () => {
    render(<App />)

    expect(screen.getAllByRole('group', { name: /^Jugador \d$/ })).toHaveLength(5)
  })

  it('asks for at least one medal before showing a result', () => {
    render(<App />)

    expect(screen.getByText(/selecciona la medalla de al menos un jugador/i)).toBeInTheDocument()
  })

  it('shows the average once a medal is picked', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(within(playerCard(1)).getByRole('button', { name: 'Leyenda' }))

    const result = screen.getByRole('status')
    expect(within(result).getByText('Leyenda')).toBeInTheDocument()
    expect(within(result).getByText(/1 jugador contado/i)).toBeInTheDocument()
  })

  it('always reports a margin of error alongside the average', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(within(playerCard(1)).getByRole('button', { name: 'Arconte' }))

    expect(within(screen.getByRole('status')).getByText(/±/)).toBeInTheDocument()
  })

  it('swaps stars for a leaderboard field when Inmortal is picked', async () => {
    const user = userEvent.setup()
    render(<App />)
    const card = playerCard(1)

    await user.click(within(card).getByRole('button', { name: 'Inmortal' }))

    expect(within(card).getByLabelText(/ranking/i)).toBeInTheDocument()
    expect(within(card).queryByRole('group', { name: /estrellas/i })).not.toBeInTheDocument()
  })

  it('lets a player change their stars', async () => {
    const user = userEvent.setup()
    render(<App />)
    const card = playerCard(1)

    await user.click(within(card).getByRole('button', { name: 'Cruzado' }))
    await user.click(within(card).getByRole('button', { name: '4 estrellas' }))

    const result = screen.getByRole('status')
    expect(within(result).getByText('Cruzado')).toBeInTheDocument()
    expect(within(result).getByLabelText('4 de 5 estrellas')).toBeInTheDocument()
  })

  it('pulls the average down when a Heraldo joins an Inmortal', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(within(playerCard(1)).getByRole('button', { name: 'Inmortal' }))
    const soloImmortal = within(screen.getByRole('status')).getByTestId('average-medal').textContent

    await user.click(within(playerCard(2)).getByRole('button', { name: 'Heraldo' }))
    const withHerald = within(screen.getByRole('status')).getByTestId('average-medal').textContent

    expect(soloImmortal).toBe('Inmortal')
    expect(withHerald).not.toBe('Inmortal')
  })

  it('clears a player back out of the average', async () => {
    const user = userEvent.setup()
    render(<App />)
    const card = playerCard(1)

    await user.click(within(card).getByRole('button', { name: 'Divino' }))
    await user.click(within(card).getByRole('button', { name: /quitar/i }))

    expect(screen.getByText(/selecciona la medalla de al menos un jugador/i)).toBeInTheDocument()
  })

  it('states that the MMR figure is an estimate, not official data', async () => {
    const user = userEvent.setup()
    render(<App />)

    await user.click(within(playerCard(1)).getByRole('button', { name: 'Ancestral' }))

    expect(screen.getByText(/mmr estimado/i)).toBeInTheDocument()
  })
})
