import { describe, expect, it } from 'vitest'
import { ANSWER_WORDS } from './answers'
import { VALID_WORDS } from './valid'

const normalize = (word: string): string =>
  word.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase()

describe.each([
  ['VALID_WORDS', VALID_WORDS],
  ['ANSWER_WORDS', ANSWER_WORDS],
])('%s', (_name, list) => {
  it('só tem palavras de 5 letras a-z depois da normalização', () => {
    expect(list.filter((word) => !/^[a-z]{5}$/.test(normalize(word)))).toEqual([])
  })

  it('tem cada forma normalizada uma única vez', () => {
    expect(new Set(list.map(normalize)).size).toBe(list.length)
  })

  it('não tem palavrões', () => {
    expect(list.filter((word) => ['merda', 'porra', 'foder'].includes(word))).toEqual([])
  })
})

describe('ANSWER_WORDS', () => {
  it('fica na faixa combinada de 1.000 a 2.000 palavras', () => {
    expect(ANSWER_WORDS.length).toBeGreaterThanOrEqual(1000)
    expect(ANSWER_WORDS.length).toBeLessThanOrEqual(2000)
  })

  it('está contida em VALID_WORDS com a mesma forma de exibição', () => {
    const valid = new Set(VALID_WORDS)
    expect(ANSWER_WORDS.filter((word) => !valid.has(word))).toEqual([])
  })

  it('preserva os acentos', () => {
    expect(ANSWER_WORDS).toEqual(expect.arrayContaining(['irmão', 'maçãs', 'lápis', 'bebês']))
  })

  it('não inclui radicais de clítico nem conjugações comuns', () => {
    const blocked = ['afogá', 'trazê', 'disse', 'tenho', 'falou', 'estão']
    expect(ANSWER_WORDS.filter((word) => blocked.includes(word))).toEqual([])
  })
})

describe('VALID_WORDS', () => {
  it('aceita plurais e conjugações que faltavam na lista original', () => {
    expect(VALID_WORDS).toEqual(
      expect.arrayContaining(['antes', 'disse', 'tenho', 'vezes', 'certo', 'ajuda']),
    )
  })

  it('resolve SÁBIA, SABIA e SABIÁ para a forma mais frequente', () => {
    expect(VALID_WORDS).toContain('sabia')
    expect(VALID_WORDS).not.toContain('sábia')
    expect(VALID_WORDS).not.toContain('sabiá')
  })
})
