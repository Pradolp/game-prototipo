import { describe, expect, it } from 'vitest'
import { isValidGuess } from './validate'

describe('isValidGuess', () => {
  it('aceita palavra da lista', () => {
    expect(isValidGuess('pedra')).toBe(true)
  })

  it('aceita formas que só estão em valid', () => {
    expect(isValidGuess('tenho')).toBe(true)
  })

  it('aceita sem acento, com acento e em maiúsculas', () => {
    expect(isValidGuess('lapis')).toBe(true)
    expect(isValidGuess('lápis')).toBe(true)
    expect(isValidGuess('LAPIS')).toBe(true)
    expect(isValidGuess('macas')).toBe(true)
  })

  it('aceita as três grafias que colidem em SABIA', () => {
    expect(isValidGuess('sabia')).toBe(true)
    expect(isValidGuess('sábia')).toBe(true)
    expect(isValidGuess('sabiá')).toBe(true)
  })

  it('recusa palavra fora da lista, tamanho errado e vazio', () => {
    expect(isValidGuess('xxxxx')).toBe(false)
    expect(isValidGuess('casa')).toBe(false)
    expect(isValidGuess('')).toBe(false)
  })

  it('recusa palavrão retirado da lista', () => {
    expect(isValidGuess('merda')).toBe(false)
  })
})
