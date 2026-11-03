import { describe, expect, it } from 'vitest'
import { createGame, gameReducer, type GameAction, type GameState } from './game'

const start = (answer = 'maçãs'): GameState =>
  createGame({ date: '2026-11-03', type: 'daily', answer })

const run = (state: GameState, actions: GameAction[]): GameState =>
  actions.reduce(gameReducer, state)

const typed = (word: string): GameAction[] =>
  [...word].map((letter) => ({ type: 'typeLetter', letter }))

const guess = (word: string): GameAction[] => [...typed(word), { type: 'submitGuess' }]

describe('createGame', () => {
  it('começa vazia e em andamento', () => {
    expect(start()).toEqual({
      date: '2026-11-03',
      type: 'daily',
      answer: 'maçãs',
      guesses: [],
      current: '',
      status: 'playing',
      feedback: null,
    })
  })
})

describe('digitar letra', () => {
  it('acrescenta ao chute atual em minúsculas', () => {
    expect(run(start(), typed('PE')).current).toBe('pe')
  })

  it('tira acento e cedilha', () => {
    expect(run(start(), typed('áç')).current).toBe('ac')
  })

  it('ignora a sexta letra', () => {
    expect(run(start(), typed('pedras')).current).toBe('pedra')
  })

  it('ignora teclas que não são letras', () => {
    const actions: GameAction[] = ['1', ' ', 'Enter', 'Shift', '-', ''].map((letter) => ({
      type: 'typeLetter',
      letter,
    }))
    expect(run(start(), actions).current).toBe('')
  })

  it('limpa o aviso anterior', () => {
    const state = run(start(), [...guess('ped'), ...typed('r')])
    expect(state.feedback).toBeNull()
  })
})

describe('apagar', () => {
  it('remove a última letra', () => {
    expect(run(start(), [...typed('ped'), { type: 'deleteLetter' }]).current).toBe('pe')
  })

  it('não faz nada com o chute vazio', () => {
    expect(gameReducer(start(), { type: 'deleteLetter' }).current).toBe('')
  })

  it('limpa o aviso anterior', () => {
    const state = run(start(), [...guess('ped'), { type: 'deleteLetter' }])
    expect(state.feedback).toBeNull()
  })
})

describe('enviar chute', () => {
  it('guarda o chute válido e limpa a linha', () => {
    const state = run(start(), guess('pedra'))
    expect(state.guesses).toEqual(['pedra'])
    expect(state.current).toBe('')
    expect(state.status).toBe('playing')
  })

  it('com menos de 5 letras avisa e não gasta tentativa', () => {
    const state = run(start(), guess('ped'))
    expect(state.guesses).toEqual([])
    expect(state.current).toBe('ped')
    expect(state.feedback).toBe('tooShort')
  })

  it('fora da lista avisa, não gasta tentativa e mantém as letras', () => {
    const state = run(start(), guess('xxxxx'))
    expect(state.guesses).toEqual([])
    expect(state.current).toBe('xxxxx')
    expect(state.feedback).toBe('notInList')
    expect(state.status).toBe('playing')
  })

  it('limpa o aviso depois de um chute válido', () => {
    const state = run(start(), [
      ...guess('xxxxx'),
      ...Array.from({ length: 5 }, (): GameAction => ({ type: 'deleteLetter' })),
      ...guess('pedra'),
    ])
    expect(state.feedback).toBeNull()
  })
})

describe('fim de jogo', () => {
  const misses = ['pedra', 'praia', 'terra', 'livro', 'mundo']

  it('vence ao acertar sem digitar acento', () => {
    const state = run(start(), guess('macas'))
    expect(state.status).toBe('won')
    expect(state.guesses).toEqual(['macas'])
  })

  it('vence na sexta tentativa', () => {
    const state = run(start(), [...misses.flatMap(guess), ...guess('macas')])
    expect(state.status).toBe('won')
    expect(state.guesses).toHaveLength(6)
  })

  it('perde depois de seis tentativas erradas', () => {
    const state = run(start(), [...misses.flatMap(guess), ...guess('tempo')])
    expect(state.status).toBe('lost')
    expect(state.guesses).toHaveLength(6)
  })

  it('não aceita mais nada depois do fim', () => {
    const won = run(start(), guess('macas'))
    expect(run(won, typed('a'))).toBe(won)
    expect(gameReducer(won, { type: 'deleteLetter' })).toBe(won)
    expect(gameReducer(won, { type: 'submitGuess' })).toBe(won)
  })
})

describe('pureza', () => {
  it('não altera o estado recebido', () => {
    const state = start()
    const snapshot = structuredClone(state)
    run(state, guess('pedra'))
    expect(state).toEqual(snapshot)
  })
})
