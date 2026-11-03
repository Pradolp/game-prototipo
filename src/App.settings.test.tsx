import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { getDailyWord } from './game/daily'
import { normalize } from './game/normalize'
import { loadPreferences, savePreferences } from './storage/preferences'

const NOW = new Date('2026-11-03T15:00:00.000Z')
const TODAY = '2026-11-03'
const WORD = ['acaso', 'achar'].find((word) => word !== normalize(getDailyWord(TODAY))) ?? ''

const setup = () => {
  const user = userEvent.setup()
  render(<App now={() => NOW} rng={() => 0} />)
  return user
}
const root = document.documentElement
const openSettings = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'Configurações' }))
const slot = (number: number) =>
  screen.getByRole('button', { name: new RegExp(`^casa ${number} de 5`) })

describe('Configurações', () => {
  it('a engrenagem abre a janela com as duas opções', async () => {
    const user = setup()
    await openSettings(user)
    const dialog = within(screen.getByRole('dialog', { name: 'Configurações' }))
    expect(dialog.getByRole('checkbox', { name: 'Modo daltônico' })).not.toBeChecked()
    expect(dialog.getByRole('group', { name: 'Tamanho da fonte' })).toBeInTheDocument()
    expect(dialog.getByRole('radio', { name: 'Normal' })).toBeChecked()
  })

  it('aplica o modo daltônico na hora e salva', async () => {
    const user = setup()
    expect(root.dataset.colorBlind).toBe('false')
    await openSettings(user)
    await user.click(screen.getByRole('checkbox', { name: 'Modo daltônico' }))
    expect(root.dataset.colorBlind).toBe('true')
    expect(loadPreferences().colorBlind).toBe(true)
  })

  it('aplica o tamanho da fonte na hora e salva', async () => {
    const user = setup()
    await openSettings(user)
    await user.click(screen.getByRole('radio', { name: 'Muito grande' }))
    expect(root.dataset.fontSize).toBe('huge')
    expect(screen.getByRole('radio', { name: 'Muito grande' })).toBeChecked()
    expect(loadPreferences().fontSize).toBe('huge')
  })

  it('uma opção não apaga a outra', async () => {
    const user = setup()
    await openSettings(user)
    await user.click(screen.getByRole('radio', { name: 'Grande' }))
    await user.click(screen.getByRole('checkbox', { name: 'Modo daltônico' }))
    expect(loadPreferences()).toEqual({ colorBlind: true, fontSize: 'large' })
  })

  it('abre com as preferências salvas já aplicadas', async () => {
    savePreferences({ colorBlind: true, fontSize: 'large' })
    const user = setup()
    expect(root.dataset.colorBlind).toBe('true')
    expect(root.dataset.fontSize).toBe('large')
    await openSettings(user)
    expect(screen.getByRole('radio', { name: 'Grande' })).toBeChecked()
  })

  it('o jogo não recebe letras com a janela aberta', async () => {
    const user = setup()
    await openSettings(user)
    await user.keyboard('a')
    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(slot(1)).toHaveTextContent('')
  })
})

describe('navegação e leitores de tela', () => {
  it('anuncia a casa selecionada', async () => {
    const user = setup()
    const live = document.querySelector('[aria-live="polite"]')
    expect(live).toHaveTextContent('casa 1 de 5, vazia, selecionada')
    await user.keyboard('a')
    expect(live).toHaveTextContent('A na casa 1. casa 2 de 5, vazia, selecionada')
    await user.keyboard('{ArrowLeft}')
    expect(live).toHaveTextContent('A na casa 1. casa 1 de 5, letra A, selecionada')
  })

  it('a seta leva o foco junto com a seleção e para nas pontas', async () => {
    const user = setup()
    slot(4).focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{ArrowRight}')
    expect(slot(5)).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(slot(5)).toHaveFocus()
    await user.keyboard('{ArrowLeft}')
    expect(slot(4)).toHaveFocus()
  })

  it('a seta sem foco em uma casa não prende o foco nela', async () => {
    const user = setup()
    await user.keyboard('{ArrowRight}')
    expect(slot(2)).not.toHaveFocus()
  })

  it('com o foco nas casas, a seta não repete o anúncio', async () => {
    const user = setup()
    slot(1).focus()
    await user.keyboard('{ArrowRight}')
    expect(slot(2)).toHaveFocus()
    expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent(
      'casa 1 de 5, vazia, selecionada',
    )
  })

  it('digitar em uma casa focada solta o foco', async () => {
    const user = setup()
    slot(1).focus()
    await user.keyboard('a')
    expect(document.body).toHaveFocus()
  })

  it('o Enter na casa selecionada envia o chute; em outra casa, só a seleciona', async () => {
    const user = setup()
    await user.keyboard(WORD)
    slot(2).focus()
    await user.keyboard('{Enter}')
    expect(slot(2)).toHaveAttribute('aria-pressed', 'true')
    await user.keyboard('{Enter}')
    expect(screen.getAllByRole('img', { name: /^letra / })).toHaveLength(5)
  })

  it('o ↻ fala o motivo e quantas trocas restam', async () => {
    const user = setup()
    await user.click(screen.getByRole('tab', { name: 'CHUTE' }))
    expect(
      screen.getByRole('button', { name: 'Termine esta palavra para trocar, 3 trocas' }),
    ).toBeInTheDocument()
  })
})
