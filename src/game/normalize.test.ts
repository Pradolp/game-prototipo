import { describe, expect, it } from 'vitest'
import { normalize } from './normalize'

describe('normalize', () => {
  it.each([
    ['LÁPIS', 'lapis'],
    ['maçãs', 'macas'],
    ['Ç', 'c'],
    ['ÁÉÍÓÚ', 'aeiou'],
    ['âêô', 'aeo'],
    ['ãõ', 'ao'],
    ['sabiá', 'sabia'],
    ['casal', 'casal'],
    ['', ''],
  ])('%s -> %s', (word, expected) => {
    expect(normalize(word)).toBe(expected)
  })

  it('trata igual a forma composta e a decomposta do Unicode', () => {
    expect(normalize('á')).toBe(normalize('á'))
  })
})
