import { useEffect, useState } from 'react'
import { loadPreferences, savePreferences } from '../storage/preferences'

/** Estado que nasce do que estava salvo e grava cada mudança. */
export function usePersistentState<T>(load: () => T, save: (value: T) => void) {
  const [value, setValue] = useState(load)
  useEffect(() => save(value), [value, save])
  return [value, setValue] as const
}

export const usePreferences = () => usePersistentState(loadPreferences, savePreferences)
