import { describe, expect, it } from 'vitest'
import { ANSWER_WORDS } from '../data/answers'
import { DAILY_EPOCH, getDailyWord } from './daily'

/** Soma dias a uma chave de data, sem depender do fuso local. */
const addDays = (dateKey: string, days: number): string => {
  const [year = 0, month = 0, day = 0] = dateKey.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10)
}

describe('getDailyWord', () => {
  it('é determinística para a mesma data', () => {
    expect(getDailyWord('2026-11-03')).toBe(getDailyWord('2026-11-03'))
  })

  it('sempre devolve uma palavra de answers', () => {
    expect(ANSWER_WORDS).toContain(getDailyWord('2026-11-03'))
  })

  it('não repete durante um ciclo inteiro da lista', () => {
    const days = ANSWER_WORDS.map((_, index) => getDailyWord(addDays(DAILY_EPOCH, index)))
    expect(new Set(days).size).toBe(ANSWER_WORDS.length)
  })

  it('não segue a ordem alfabética da lista', () => {
    const days = ANSWER_WORDS.slice(0, 10).map((_, index) =>
      getDailyWord(addDays(DAILY_EPOCH, index)),
    )
    expect(days).not.toEqual(ANSWER_WORDS.slice(0, 10))
  })

  it('recomeça o ciclo depois do fim da lista', () => {
    const words = ['a', 'b', 'c', 'd']
    expect(getDailyWord(addDays(DAILY_EPOCH, 4), words)).toBe(getDailyWord(DAILY_EPOCH, words))
  })

  it('funciona para datas anteriores à época', () => {
    expect(ANSWER_WORDS).toContain(getDailyWord(addDays(DAILY_EPOCH, -1)))
    const words = ['a', 'b', 'c', 'd']
    expect(getDailyWord(addDays(DAILY_EPOCH, -1), words)).toBe(
      getDailyWord(addDays(DAILY_EPOCH, 3), words),
    )
  })

  it('funciona em ano bissexto', () => {
    expect(ANSWER_WORDS).toContain(getDailyWord('2028-02-29'))
  })

  it('recusa chave de data inválida', () => {
    expect(() => getDailyWord('ontem')).toThrow(RangeError)
    expect(() => getDailyWord('2026-13-01')).toThrow(RangeError)
    expect(() => getDailyWord('2026-02-30')).toThrow(RangeError)
  })
})
