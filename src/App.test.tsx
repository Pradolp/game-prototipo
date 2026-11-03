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
const slot = (number: number) =>
  within(row(1)).getByRole('button', { name: new RegExp(`^casa ${number} de 5`) })
const slots = (number: number) => within(row(number)).getAllByRole('button')
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
    const tiles = slots(1)
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
    expect(slots(1)[0]).toHaveTextContent('')
  })

  it('avisa quando faltam letras e quando a palavra não existe, sem gastar tentativa', async () => {
    const user = setup()
    await guess(user, 'ab')
    expect(screen.getByRole('status')).toHaveTextContent('Faltam letras')
    await user.keyboard('{Backspace}{Backspace}')
    await guess(user, 'xxxxx')
    expect(screen.getByRole('status')).toHaveTextContent('Palavra não encontrada')
    expect(slots(1)[0]).toHaveTextContent('X')
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
    expect(within(dialog).getByText('Sequência').nextSibling).toHaveTextContent('1')
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
    expect(slots(1)[0]).toHaveTextContent('')
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
    expect(slots(1)[0]).toHaveTextContent('')
    await user.click(tab('Palavra do dia'))
    expect(within(row(1)).getAllByRole('img')[0]).toHaveTextContent('A')
  })

  it('seleciona uma casa com o toque e escreve nela', async () => {
    const user = setup()
    expect(slot(1)).toHaveAttribute('aria-pressed', 'true')
    await user.click(slot(5))
    expect(slot(5)).toHaveAccessibleName('casa 5 de 5, vazia, selecionada')
    expect(slot(5)).not.toHaveFocus()
    await user.keyboard('a')
    expect(slot(5)).toHaveAccessibleName('casa 5 de 5, letra A')
    expect(slot(1)).toHaveAttribute('aria-pressed', 'true')
  })

  it('envia pelo Enter físico depois de tocar em uma casa', async () => {
    const user = setup()
    await user.keyboard(WRONG[0] ?? '')
    await user.click(slot(2))
    await user.keyboard('{Enter}')
    expect(within(row(1)).getAllByRole('img')[0]).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/^letra A, /),
    )
  })

  it('só a linha atual responde ao toque', async () => {
    const user = setup()
    expect(within(row(2)).queryAllByRole('button')).toHaveLength(0)
    await guess(user, WRONG[0] ?? '')
    expect(within(row(1)).queryAllByRole('button')).toHaveLength(0)
    expect(slots(2)).toHaveLength(5)
  })

  it('nada é selecionável com a partida terminada', async () => {
    const user = setup()
    await guess(user, DAILY)
    await screen.findByRole('dialog')
    await user.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(screen.queryByRole('button', { name: /^casa / })).not.toBeInTheDocument()
  })

  it('move a seleção pelas setas do teclado físico', async () => {
    const user = setup()
    await user.keyboard('{ArrowRight}{ArrowRight}{ArrowLeft}')
    expect(slot(2)).toHaveAttribute('aria-pressed', 'true')
  })

  it('preserva letras e casa selecionada de cada aba', async () => {
    const user = setup()
    await user.click(slot(4))
    await user.keyboard('b')
    await user.click(slot(3))
    await user.click(tab('CHUTE'))
    expect(slot(1)).toHaveAttribute('aria-pressed', 'true')
    await user.click(tab('Palavra do dia'))
    expect(slot(4)).toHaveTextContent('B')
    expect(slot(3)).toHaveAttribute('aria-pressed', 'true')
  })

  it('não move a seleção com as setas em uma aba focada', async () => {
    const user = setup()
    tab('Palavra do dia').focus()
    await user.keyboard('{ArrowRight}')
    await user.click(tab('Palavra do dia'))
    expect(slot(1)).toHaveAttribute('aria-pressed', 'true')
  })

  it('a ajuda explica a seleção e liga para os créditos', async () => {
    const user = setup()
    await user.click(screen.getByRole('button', { name: 'Ajuda' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Toque em uma casa para escolher onde escrever.')
    expect(within(dialog).getByRole('link', { name: 'Créditos e licenças' })).toHaveAttribute(
      'href',
      '/THIRD_PARTY_NOTICES.txt',
    )
  })

  it('não mostra Próxima palavra na Palavra do dia', async () => {
    const user = setup()
    await guess(user, DAILY)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByRole('button', { name: 'Próxima palavra' })).toBeNull()
  })

  it('Próxima palavra troca a palavra, gasta um reset e fecha a janela', async () => {
    const user = setup()
    await user.click(tab('CHUTE'))
    await guess(user, normalize(FIRST_EXTRA.word))
    const dialog = await screen.findByRole('dialog')
    await user.click(within(dialog).getByRole('button', { name: 'Próxima palavra' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(resetButton()).toHaveTextContent('↻ 2')
    expect(resetButton()).toHaveAttribute('aria-disabled', 'true')
    expect(slots(1)[0]).toHaveTextContent('')
  })

  it('não mostra Próxima palavra com a partida em andamento nem sem resets', async () => {
    const user = setup()
    await user.click(tab('CHUTE'))
    await user.click(screen.getByRole('button', { name: 'Estatísticas' }))
    expect(screen.queryByRole('button', { name: 'Próxima palavra' })).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Fechar' }))

    let state = FIRST_EXTRA
    await guess(user, normalize(state.word))
    for (let round = 0; round < 3; round += 1) {
      const dialog = await screen.findByRole('dialog')
      await user.click(within(dialog).getByRole('button', { name: 'Próxima palavra' }))
      const next = applyReset(state.state, TODAY, 'won', () => 0)
      if (next === null) throw new Error('reset recusado')
      state = next
      await guess(user, normalize(state.word))
    }
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toHaveTextContent('Você acertou!')
    expect(within(dialog).queryByRole('button', { name: 'Próxima palavra' })).toBeNull()
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

    expect(resetButton()).toHaveAccessibleName('Novas palavras amanhã, 0 trocas')
    await user.click(resetButton())
    expect(screen.getByRole('status')).toHaveTextContent('Novas palavras amanhã')
  })
})
