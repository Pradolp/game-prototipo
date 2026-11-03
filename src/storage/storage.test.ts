import { afterEach, describe, expect, it, vi } from 'vitest'
import { readJson, writeJson } from './storage'

afterEach(() => {
  vi.restoreAllMocks()
})

describe('readJson e writeJson', () => {
  it('guardam o valor em uma chave versionada', () => {
    writeJson('stats', { played: 1 })
    expect(localStorage.getItem('chute:v1:stats')).toBe('{"played":1}')
    expect(readJson('stats')).toEqual({ played: 1 })
  })

  it('devolvem null para chave ausente e JSON quebrado', () => {
    expect(readJson('stats')).toBeNull()
    localStorage.setItem('chute:v1:stats', '{quebrado')
    expect(readJson('stats')).toBeNull()
  })

  it('não lançam erro quando o storage falha', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('bloqueado')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('cheio')
    })
    expect(readJson('stats')).toBeNull()
    expect(() => writeJson('stats', {})).not.toThrow()
  })

  it('não lançam erro quando o próprio localStorage é inacessível', () => {
    vi.spyOn(window, 'localStorage', 'get').mockImplementation(() => {
      throw new Error('negado')
    })
    expect(readJson('stats')).toBeNull()
    expect(() => writeJson('stats', {})).not.toThrow()
  })
})
