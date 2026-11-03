import { describe, expect, it } from 'vitest'
import { createGame, gameReducer, type GameAction, type GameState } from './game'

const start = (answer = 'maçãs'): GameState =>
  createGame({ date: '2026-11-03', type: 'daily', answer })

const run = (state: GameState, actions: GameAction[]): GameState =>
  actions.reduce(gameReducer, state)

const typed = (word: string): GameAction[] =>
  [...word].map((letter) => ({ type: 'typeLetter', letter }))

const word = (state: GameState): string => state.slots.join('')
const del: GameAction = { type: 'deleteLetter' }
const select = (index: number): GameAction => ({ type: 'selectSlot', index })
const left: GameAction = { type: 'moveCursor', delta: -1 }
const right: GameAction = { type: 'moveCursor', delta: 1 }

const guess = (word: string): GameAction[] => [...typed(word), { type: 'submitGuess' }]

describe('createGame', () => {
  it('começa vazia e em andamento', () => {
    expect(start()).toEqual({
      date: '2026-11-03',
      type: 'daily',
      answer: 'maçãs',
      guesses: [],
      slots: ['', '', '', '', ''],
      cursor: 0,
      status: 'playing',
      feedback: null,
    })
  })
})

describe('digitar letra', () => {
  it('escreve em minúsculas e avança para a próxima casa', () => {
    const state = run(start(), typed('PE'))
    expect(state.slots).toEqual(['p', 'e', '', '', ''])
    expect(state.cursor).toBe(2)
  })

  it('tira acento e cedilha', () => {
    expect(word(run(start(), typed('áç')))).toBe('ac')
  })

  it('com a linha cheia, fica na mesma casa e substitui a letra', () => {
    const state = run(start(), typed('pedras'))
    expect(word(state)).toBe('pedrs')
    expect(state.cursor).toBe(4)
  })

  it('substitui a letra da casa selecionada', () => {
    const state = run(start(), [...typed('pedra'), select(1), ...typed('a')])
    expect(word(state)).toBe('padra')
    expect(state.cursor).toBe(1)
  })

  it('pula as casas cheias à direita', () => {
    const state = run(start(), [select(1), ...typed('a'), select(3), ...typed('b'), select(0)])
    expect(run(state, typed('c')).cursor).toBe(2)
  })

  it('sem vazia à direita, volta para a primeira vazia a partir da esquerda', () => {
    const state = run(start(), [select(4), ...typed('a')])
    expect(state.slots).toEqual(['', '', '', '', 'a'])
    expect(state.cursor).toBe(0)
  })

  it('preenche a última casa primeiro e as outras depois', () => {
    expect(word(run(start(), [select(4), ...typed('a'), ...typed('prai')]))).toBe('praia')
  })

  it('ignora teclas que não são letras', () => {
    const actions: GameAction[] = ['1', ' ', 'Enter', 'Shift', '-', ''].map((letter) => ({
      type: 'typeLetter',
      letter,
    }))
    expect(word(run(start(), actions))).toBe('')
  })

  it('limpa o aviso anterior', () => {
    const state = run(start(), [...guess('ped'), ...typed('r')])
    expect(state.feedback).toBeNull()
  })
})

describe('apagar', () => {
  it('na casa com letra, apaga e continua nela', () => {
    const state = run(start(), [...typed('pedra'), select(2), del])
    expect(state.slots).toEqual(['p', 'e', '', 'r', 'a'])
    expect(state.cursor).toBe(2)
  })

  it('na casa vazia, volta uma casa e apaga a letra dela', () => {
    const state = run(start(), [...typed('ped'), del])
    expect(state.slots).toEqual(['p', 'e', '', '', ''])
    expect(state.cursor).toBe(2)
  })

  it('na 1ª casa vazia, não faz nada', () => {
    const state = start()
    expect(gameReducer(state, del)).toBe(state)
  })

  it('limpa o aviso anterior', () => {
    const state = run(start(), [...guess('ped'), { type: 'deleteLetter' }])
    expect(state.feedback).toBeNull()
  })
})

describe('selecionar casa', () => {
  it('seleciona casa vazia ou preenchida sem apagar nada', () => {
    const state = run(start(), typed('ped'))
    expect(gameReducer(state, select(4)).cursor).toBe(4)
    const filled = gameReducer(state, select(1))
    expect(filled.cursor).toBe(1)
    expect(word(filled)).toBe('ped')
  })

  it('limpa o aviso anterior', () => {
    expect(run(start(), [...guess('ped'), select(0)]).feedback).toBeNull()
  })
})

describe('setas', () => {
  it('movem a seleção uma casa', () => {
    expect(run(start(), [right, right, left]).cursor).toBe(1)
  })

  it('não dão a volta nas pontas', () => {
    expect(gameReducer(start(), left).cursor).toBe(0)
    expect(run(start(), [select(4), right]).cursor).toBe(4)
  })
})

describe('enviar chute', () => {
  it('guarda o chute válido e limpa a linha', () => {
    const state = run(start(), guess('pedra'))
    expect(state.guesses).toEqual(['pedra'])
    expect(state.slots).toEqual(['', '', '', '', ''])
    expect(state.cursor).toBe(0)
    expect(state.status).toBe('playing')
  })

  it('com menos de 5 letras avisa e não gasta tentativa', () => {
    const state = run(start(), guess('ped'))
    expect(state.guesses).toEqual([])
    expect(word(state)).toBe('ped')
    expect(state.feedback).toBe('tooShort')
  })

  it('com um buraco na linha avisa e não gasta tentativa', () => {
    const state = run(start(), [...typed('pedra'), select(2), del, { type: 'submitGuess' }])
    expect(state.guesses).toEqual([])
    expect(state.slots).toEqual(['p', 'e', '', 'r', 'a'])
    expect(state.feedback).toBe('tooShort')
  })

  it('fora da lista avisa, não gasta tentativa e mantém as letras', () => {
    const state = run(start(), guess('xxxxx'))
    expect(state.guesses).toEqual([])
    expect(word(state)).toBe('xxxxx')
    expect(state.feedback).toBe('notInList')
    expect(state.status).toBe('playing')
  })

  it('fora da lista mantém a casa selecionada', () => {
    const state = run(start(), [...typed('xxxxx'), select(2), { type: 'submitGuess' }])
    expect(state.cursor).toBe(2)
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
    expect(gameReducer(won, select(2))).toBe(won)
    expect(gameReducer(won, right)).toBe(won)
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
