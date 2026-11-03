import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, loadPreferences, savePreferences } from './preferences'

const KEY = 'chute:v1:preferences'

describe('preferências salvas', () => {
  it('voltam iguais', () => {
    savePreferences({ colorBlind: true, fontSize: 'huge' })
    expect(loadPreferences()).toEqual({ colorBlind: true, fontSize: 'huge' })
  })

  it('usam o padrão quando não há nada salvo', () => {
    expect(loadPreferences()).toEqual(DEFAULT_PREFERENCES)
  })

  it('mantêm o que é válido e trocam só o que não é', () => {
    localStorage.setItem(KEY, JSON.stringify({ colorBlind: true, fontSize: 'gigante' }))
    expect(loadPreferences()).toEqual({ colorBlind: true, fontSize: 'normal' })
    localStorage.setItem(KEY, JSON.stringify({ colorBlind: 'sim', fontSize: 'large' }))
    expect(loadPreferences()).toEqual({ colorBlind: false, fontSize: 'large' })
  })
})
