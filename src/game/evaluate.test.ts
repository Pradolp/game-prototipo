import { describe, expect, it } from 'vitest'
import { evaluateGuess } from './evaluate'

const C = 'correct'
const P = 'present'
const A = 'absent'

describe('evaluateGuess', () => {
  it('marca todas como certas quando acerta', () => {
    expect(evaluateGuess('pedra', 'pedra')).toEqual([C, C, C, C, C])
  })

  it('marca todas como ausentes quando nenhuma letra existe', () => {
    expect(evaluateGuess('fuzil', 'campo')).toEqual([A, A, A, A, A])
  })

  it('separa lugar certo, lugar errado e ausente', () => {
    expect(evaluateGuess('porta', 'prato')).toEqual([C, P, P, C, P])
    expect(evaluateGuess('carta', 'carro')).toEqual([C, C, C, A, A])
  })

  describe('letras repetidas', () => {
    it('resposta CASAL, chute AAAAA: só as duas posições reais ficam certas', () => {
      expect(evaluateGuess('aaaaa', 'casal')).toEqual([A, C, A, C, A])
    })

    it('resposta ARARA, chute RAIAR', () => {
      expect(evaluateGuess('raiar', 'arara')).toEqual([P, P, A, P, P])
    })

    it('resposta SOLTO, chute OSSOS: o S só tem uma ocorrência na resposta', () => {
      expect(evaluateGuess('ossos', 'solto')).toEqual([P, P, A, P, A])
    })

    it('resposta OSSOS, chute SOLTO', () => {
      expect(evaluateGuess('solto', 'ossos')).toEqual([P, P, A, A, P])
    })

    it('reserva a letra para o lugar certo antes de marcar lugar errado', () => {
      // A resposta só tem um A, e ele está na posição 1: o A da posição 0 fica ausente.
      expect(evaluateGuess('aabbb', 'cacdd')).toEqual([A, C, A, A, A])
    })
  })

  describe('acentos e ç', () => {
    it('resposta MAÇÃS aceita o chute sem acento', () => {
      expect(evaluateGuess('macas', 'maçãs')).toEqual([C, C, C, C, C])
    })

    it('resposta LÁPIS aceita o chute sem acento', () => {
      expect(evaluateGuess('LAPIS', 'lápis')).toEqual([C, C, C, C, C])
    })

    it('compara a letra normalizada também em lugar errado', () => {
      expect(evaluateGuess('canto', 'maçãs')).toEqual([P, C, A, A, A])
    })
  })
})
