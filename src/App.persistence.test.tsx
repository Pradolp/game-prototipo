import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import App from './App'
import { getDailyWord } from './game/daily'
import { normalize } from './game/normalize'
import { createResetState, drawFirstExtra } from './game/resets'

const NOW = new Date('2026-11-03T15:00:00.000Z')
const NEXT_DAY = new Date('2026-11-04T03:00:00.000Z')
const TODAY = '2026-11-03'
const DAILY = normalize(getDailyWord(TODAY))
const NEXT_DAILY = normalize(getDailyWord('2026-11-04'))
const EXTRA = normalize(drawFirstExtra(createResetState(TODAY), TODAY, () => 0)?.word ?? '')
const WRONG = ['abalo', 'abril', 'abrir'].find((word) => word !== DAILY && word !== EXTRA) ?? ''

/** Relógio que o teste adianta com a página aberta. */
const setup = (start = NOW) => {
  const clock = { now: start }
  const view = render(<App now={() => clock.now} rng={() => 0} />)
  return { user: userEvent.setup(), clock, ...view }
}
const row = (number: number) => screen.getByRole('group', { name: `Tentativa ${number}` })
const slot = (number: number) =>
  within(row(1)).getByRole('button', { name: new RegExp(`^casa ${number} de 5`) })
const tab = (name: string) => screen.getByRole('tab', { name })
const firstTile = () => within(row(1)).getAllByRole('img')[0]

describe('ao recarregar', () => {
  it('mantém chutes, letras e casa selecionada', async () => {
    const { user, unmount } = setup()
    await user.keyboard(`${WRONG}{Enter}`)
    await user.keyboard('b')
    unmount()

    setup()
    expect(firstTile()).toHaveTextContent(WRONG.charAt(0).toUpperCase())
    const line = within(row(2)).getAllByRole('button')
    expect(line[0]).toHaveTextContent('B')
    expect(line[1]).toHaveAttribute('aria-pressed', 'true')
  })

  it('volta para Palavra do dia e mantém a partida de CHUTE', async () => {
    const { user, unmount } = setup()
    await user.click(tab('CHUTE'))
    await user.keyboard('b')
    unmount()

    const next = setup()
    expect(tab('Palavra do dia')).toHaveAttribute('aria-selected', 'true')
    await next.user.click(tab('CHUTE'))
    expect(slot(1)).toHaveTextContent('B')
  })

  it('mantém as estatísticas sem contar a partida de novo', async () => {
    const { user, unmount } = setup()
    await user.keyboard(`${DAILY}{Enter}`)
    await screen.findByRole('dialog')
    unmount()

    const next = setup()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await next.user.click(screen.getByRole('button', { name: 'Estatísticas' }))
    expect(within(screen.getByRole('dialog')).getByText('Jogos').nextSibling).toHaveTextContent('1')
  })

  it('funciona sem storage', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    const { user } = setup()
    await user.keyboard(`${WRONG}{Enter}`)
    expect(firstTile()).toHaveTextContent(WRONG.charAt(0).toUpperCase())
    vi.restoreAllMocks()
  })
})

describe('virada do dia com a página aberta', () => {
  const finishChuteAndAdvance = async () => {
    const context = setup()
    await context.user.click(tab('CHUTE'))
    await context.user.keyboard(`${EXTRA}{Enter}`)
    await screen.findByRole('dialog')
    await context.user.click(screen.getByRole('button', { name: 'Próxima palavra' }))
    await context.user.keyboard('b')
    context.clock.now = NEXT_DAY
    return context
  }

  const expectNewDay = async (user: ReturnType<typeof userEvent.setup>) => {
    expect(tab('Palavra do dia')).toHaveAttribute('aria-selected', 'true')
    await user.keyboard(`${NEXT_DAILY}{Enter}`)
    expect(await screen.findByRole('dialog')).toHaveTextContent('Você acertou!')
    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    await user.click(tab('CHUTE'))
    expect(screen.getByRole('button', { name: /trocar/i })).toHaveTextContent('↻ 3')
    expect(slot(1)).toHaveTextContent('')
  }

  it('inicia o novo dia no retorno à aba', async () => {
    const { user } = await finishChuteAndAdvance()
    fireEvent(document, new Event('visibilitychange'))
    await expectNewDay(user)
  })

  it('inicia o novo dia no foco da janela', async () => {
    const { user } = await finishChuteAndAdvance()
    fireEvent(window, new Event('focus'))
    await expectNewDay(user)
  })

  it('não muda nada ao voltar no mesmo dia', async () => {
    const { user } = setup()
    await user.keyboard('b')
    fireEvent(document, new Event('visibilitychange'))
    expect(slot(1)).toHaveTextContent('B')
  })

  it('não confere o dia com a aba escondida', async () => {
    const { user, clock } = setup()
    await user.keyboard('b')
    clock.now = NEXT_DAY
    const hidden = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden')
    fireEvent(document, new Event('visibilitychange'))
    hidden.mockRestore()
    expect(slot(1)).toHaveTextContent('B')
  })

  it('descarta um chute enviado depois da meia-noite, sem aviso de faltam letras', async () => {
    const { user, clock } = setup()
    await user.keyboard(WRONG)
    clock.now = NEXT_DAY
    await user.keyboard('{Enter}')
    expect(slot(1)).toHaveTextContent('')
    expect(screen.getByRole('status')).toHaveTextContent('')
    await expectNewDay(user)
  })

  it('o ↻ tocado depois da meia-noite só inicia o novo dia', async () => {
    const { user, clock } = setup()
    await user.click(tab('CHUTE'))
    clock.now = NEXT_DAY
    await user.click(screen.getByRole('button', { name: /trocar/i }))
    expect(screen.getByRole('status')).toHaveTextContent('')
    await expectNewDay(user)
  })

  it('a troca de aba depois da meia-noite vale para o novo dia', async () => {
    const { user, clock } = setup()
    await user.keyboard('b')
    clock.now = NEXT_DAY
    await user.click(tab('CHUTE'))
    expect(tab('CHUTE')).toHaveAttribute('aria-selected', 'true')
    await user.click(tab('Palavra do dia'))
    expect(slot(1)).toHaveTextContent('')
  })

  it('as estatísticas abertas depois da meia-noite já mostram o novo dia', async () => {
    const { user, clock } = setup()
    await user.keyboard(`${DAILY}{Enter}`)
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    clock.now = NEXT_DAY
    await user.click(screen.getByRole('button', { name: 'Estatísticas' }))
    expect(screen.getByRole('heading', { name: 'Estatísticas' })).toBeInTheDocument()
  })

  it('a sessão nova fica salva', async () => {
    const { clock, unmount } = setup()
    clock.now = NEXT_DAY
    fireEvent(window, new Event('focus'))
    unmount()
    const saved = JSON.parse(localStorage.getItem('chute:v1:session') ?? '{}') as { date?: string }
    expect(saved.date).toBe('2026-11-04')
  })
})
