import { describe, expect, it } from 'vitest'
import { boardRows, displayWord, letterResults } from './board'
import { createGame, type GameState } from './game'

const game = (fields: Partial<GameState>): GameState => ({
  ...createGame({ date: '2026-11-03', type: 'daily', answer: 'maçãs' }),
  ...fields,
})

describe('boardRows', () => {
  it('monta 6 linhas de 5 casas vazias no início, com a primeira casa ativa', () => {
    const rows = boardRows(game({}))
    expect(rows).toHaveLength(6)
    expect(rows.every((row) => row.length === 5)).toBe(true)
    expect(rows[0]?.map((tile) => tile.active)).toEqual([true, false, false, false, false])
    expect(rows[1]?.some((tile) => tile.active)).toBe(false)
  })

  it('mostra o chute enviado com resultado e sem acento', () => {
    const [first] = boardRows(game({ guesses: ['salas'] }))
    expect(first?.map((tile) => tile.letter).join('')).toBe('SALAS')
    expect(first?.map((tile) => tile.result)).toEqual([
      'absent',
      'correct',
      'absent',
      'correct',
      'correct',
    ])
  })

  it('marca como ativas as casas digitadas e a próxima', () => {
    const rows = boardRows(game({ guesses: ['salas'], current: 'ca' }))
    expect(rows[1]?.map((tile) => tile.letter).join('')).toBe('CA')
    expect(rows[1]?.map((tile) => tile.active)).toEqual([true, true, true, false, false])
    expect(rows[1]?.every((tile) => tile.result === null)).toBe(true)
  })

  it('mostra a forma acentuada no chute certo', () => {
    const [first] = boardRows(game({ guesses: ['macas'], status: 'won' }))
    expect(first?.map((tile) => tile.letter).join('')).toBe('MAÇÃS')
    expect(first?.every((tile) => tile.result === 'correct')).toBe(true)
  })

  it('não deixa casa ativa com a partida terminada', () => {
    const rows = boardRows(game({ guesses: ['macas'], status: 'won' }))
    expect(rows.flat().some((tile) => tile.active)).toBe(false)
  })
})

describe('letterResults', () => {
  it('guarda o melhor resultado de cada letra', () => {
    const results = letterResults(['aaaaa', 'bolas', 'casal'], 'casal')
    expect(results.get('a')).toBe('correct')
    expect(results.get('b')).toBe('absent')
    expect(results.get('o')).toBe('absent')
    expect(results.get('l')).toBe('correct')
  })

  it('não rebaixa uma letra certa nem presente', () => {
    const results = letterResults(['salas', 'lobos'], 'lapis')
    expect(results.get('l')).toBe('correct')
    const present = letterResults(['aroma', 'xxxxx'], 'canto')
    expect(present.get('a')).toBe('present')
  })

  it('compara sem acento', () => {
    expect(letterResults(['macas'], 'maçãs').get('c')).toBe('correct')
  })
})

describe('displayWord', () => {
  it('mostra a resposta em maiúsculas, com acentos', () => {
    expect(displayWord('maçãs')).toBe('MAÇÃS')
  })
})
