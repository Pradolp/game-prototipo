import { act, renderHook } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { loadPreferences } from '../storage/preferences'
import { usePreferences } from './usePersistentState'

describe('usePreferences', () => {
  it('grava cada mudança e a recupera na próxima montagem', () => {
    const first = renderHook(() => usePreferences())
    act(() => first.result.current[1]({ colorBlind: true, fontSize: 'large' }))
    expect(loadPreferences()).toEqual({ colorBlind: true, fontSize: 'large' })
    first.unmount()

    const second = renderHook(() => usePreferences())
    expect(second.result.current[0]).toEqual({ colorBlind: true, fontSize: 'large' })
  })
})
