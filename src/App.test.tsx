import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import App from './App'
import { getDailyWord } from './game/daily'
import { normalize } from './game/normalize'
import { drawFirstExtra, createResetState, applyReset } from './game/resets'

const NOW = new Date('2026-11-03T15:00:00.000Z')
const TODAY = '2026-11-03'
const DAILY = normalize(getDailyWord(TODAY))
const FIRST_EXTRA = drawFirstExtra(createResetState(TODAY), TODAY, () => 0)
if (FIRST_EXTRA === null) throw new Error('lista sem palavras')
const WRONG = ['abalo', 'abril', 'abrir', 'abuso', 'acaso', 'achar', 'adiar'].filter(
  (word) => word !== DAILY && word !== normalize(FIRST_EXTRA.word),
)

const setup = () => {
  const user = userEvent.setup()
  render(<App now={() => NOW} rng={() => 0} />)
  return user
}
const guess = (user: ReturnType<typeof userEvent.setup>, word: string) =>
  user.keyboard(`${word}{Enter}`)
const row = (number: number) => screen.getByRole('group', { name: `Tentativa ${number}` })
const tab = (name: string) => screen.getByRole('tab', { name })
const resetButton = () => screen.getByRole('button', { name: /trocar|Novas palavras/i })

async function finishExtra(user: ReturnType<typeof userEvent.setup>, word: string) {
  await guess(user, normalize(word))
  await user.click(await within(await screen.findByRole('dialog')).findByText('Fechar'))
}

describe('App', () => {
  it('abre em Palavra do dia, sem o botão de reset e sem título central visível', () => {
    setup()
    expect(tab('Palavra do dia')).toHaveAttribute('aria-selected', 'true')
    expect(tab('CHUTE')).toHaveAttribute('aria-selected', 'false')
    expect(screen.queryByText(/↻/)).not.toBeInTheDocument()
  })

  it('digita pelo teclado físico e apaga', async () => {
    const user = setup()
    await user.keyboard('caç{Backspace}')
    const tiles = within(row(1)).getAllByRole('img')
    expect(tiles[0]).toHaveTextContent('C')
    expect(tiles[1]).toHaveTextContent('A')
    expect(tiles[2]).toHaveTextContent('')
  })

  it('digita pelo teclado virtual e envia pelo Enter físico', async () => {
    const user = setup()
    for (const letter of WRONG[0] ?? '') {
      await user.click(screen.getByRole('button', { name: letter.toUpperCase() }))
    }
    await user.keyboard('{Enter}')
    expect(within(row(1)).getAllByRole('img')[0]).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/^letra A, /),
    )
  })

  it('digita depois de tocar em uma aba e o Enter envia o chute', async () => {
    const user = setup()
    await user.click(tab('CHUTE'))
    await guess(user, WRONG[0] ?? '')
    expect(tab('CHUTE')).not.toHaveFocus()
    expect(within(row(1)).getAllByRole('img')[0]).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/^letra A, /),
    )
  })

  it('ignora atalhos com Ctrl', async () => {
    const user = setup()
    await user.keyboard('{Control>}r{/Control}')
    expect(within(row(1)).getAllByRole('img')[0]).toHaveTextContent('')
  })

  it('avisa quando faltam letras e quando a palavra não existe, sem gastar tentativa', async () => {
    const user = setup()
    await guess(user, 'ab')
    expect(screen.getByRole('status')).toHaveTextContent('Faltam letras')
    await user.keyboard('{Backspace}{Backspace}')
    await guess(user, 'xxxxx')
    expect(screen.getByRole('status')).toHaveTextContent('Palavra não encontrada')
    expect(within(row(1)).getAllByRole('img')[0]).toHaveAttribute('aria-label', 'letra X')
  })

  it('colore as teclas com o resultado', async () => {
    const user = setup()
    await guess(user, DAILY)
    const letter = DAILY.charAt(0).toUpperCase()
    await waitFor(() =>
      expect(screen.getByRole('button', { name: `${letter}, lugar certo` })).toBeInTheDocument(),
    )
  })

  it('vence, mostra a palavra acentuada e a sequência de hoje', async () => {
    const user = setup()
    await guess(user, DAILY)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Você acertou!')).toBeInTheDocument()
    expect(within(dialog).getByText(getDailyWord(TODAY).toUpperCase())).toBeInTheDocument()
    expect(within(dialog).getByText('Sequência').previousSibling).toHaveTextContent('1')
    expect(dialog).toHaveTextContent('Próxima palavra do dia em 12:00:00')
  })

  it('perde depois de 6 tentativas e revela a palavra', async () => {
    const user = setup()
    for (const word of WRONG.slice(0, 6)) await guess(user, word)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('Não foi dessa vez')).toBeInTheDocument()
    expect(within(dialog).getByText(getDailyWord(TODAY).toUpperCase())).toBeInTheDocument()
  })

  it('não digita no jogo com um modal aberto', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Ajuda' }))
    await user.keyboard('a')
    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(within(row(1)).getAllByRole('img')[0]).toHaveTextContent('')
  })

  it('mostra CHUTE na ajuda e as estatísticas sem partida terminada', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Ajuda' }))
    expect(
      within(screen.getByRole('dialog')).getByRole('heading', { name: 'CHUTE', level: 2 }),
    ).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    await user.click(screen.getByRole('button', { name: 'Estatísticas' }))
    expect(screen.getByRole('heading', { name: 'Estatísticas' })).toBeInTheDocument()
    expect(screen.getByRole('dialog')).not.toHaveTextContent('Próxima palavra')
  })

  it('preserva a partida ao trocar de aba', async () => {
    const user = setup()
    await guess(user, WRONG[0] ?? '')
    await user.click(tab('CHUTE'))
    expect(within(row(1)).getAllByRole('img')[0]).toHaveAttribute('aria-label', 'vazia')
    await user.click(tab('Palavra do dia'))
    expect(within(row(1)).getAllByRole('img')[0]).toHaveTextContent('A')
  })

  it('troca de aba pelas setas', async () => {
    const user = setup()
    tab('Palavra do dia').focus()
    await user.keyboard('{ArrowRight}')
    expect(tab('CHUTE')).toHaveAttribute('aria-selected', 'true')
    expect(tab('CHUTE')).toHaveFocus()
  })

  it('o ↻ desativado explica o motivo e não troca a palavra', async () => {
    const user = setup()
    await user.click(tab('CHUTE'))
    expect(resetButton()).toHaveTextContent('↻ 3')
    expect(resetButton()).toHaveAttribute('aria-disabled', 'true')
    await user.click(resetButton())
    expect(screen.getByRole('status')).toHaveTextContent('Termine esta palavra para trocar')
    expect(resetButton()).toHaveTextContent('↻ 3')
  })

  it('troca direto depois de terminar e esgota os 3 resets', async () => {
    const user = setup()
    await user.click(tab('CHUTE'))
    let state = FIRST_EXTRA
    await finishExtra(user, state.word)

    for (const remaining of [2, 1, 0]) {
      expect(resetButton()).toHaveAttribute('aria-disabled', 'false')
      await user.click(resetButton())
      expect(resetButton()).toHaveTextContent(`↻ ${remaining}`)
      const next = applyReset(state.state, TODAY, 'won', () => 0)
      if (next === null) throw new Error('reset recusado')
      state = next
      if (remaining > 0) await finishExtra(user, state.word)
    }

    expect(resetButton()).toHaveAccessibleName('Novas palavras amanhã')
    await user.click(resetButton())
    expect(screen.getByRole('status')).toHaveTextContent('Novas palavras amanhã')
  })
})
