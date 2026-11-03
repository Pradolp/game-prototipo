import { useEffect, useLayoutEffect, useState } from 'react'
import { loadPreferences, savePreferences, type Preferences } from '../storage/preferences'

/** Estado que nasce do que estava salvo e grava cada mudança. */
export function usePersistentState<T>(load: () => T, save: (value: T) => void) {
  const [value, setValue] = useState(load)
  useEffect(() => save(value), [value, save])
  return [value, setValue] as const
}

function applyPreferences({ colorBlind, fontSize }: Preferences) {
  const { dataset } = document.documentElement
  dataset.colorBlind = String(colorBlind)
  dataset.fontSize = fontSize
}

/** Preferências salvas, aplicadas ao documento antes da pintura para a tela não piscar. */
export function usePreferences() {
  const state = usePersistentState(loadPreferences, savePreferences)
  const [preferences] = state
  useLayoutEffect(() => applyPreferences(preferences), [preferences])
  return state
}
