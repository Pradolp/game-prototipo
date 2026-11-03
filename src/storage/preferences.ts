import { isRecord, readJson, writeJson } from './storage'

const PREFERENCES_KEY = 'preferences'

const FONT_SIZES = ['normal', 'large', 'huge'] as const
export type FontSize = (typeof FONT_SIZES)[number]

export interface Preferences {
  colorBlind: boolean
  fontSize: FontSize
}

export const DEFAULT_PREFERENCES: Preferences = { colorBlind: false, fontSize: 'normal' }

/** Cada preferência é conferida sozinha: uma inválida não apaga as outras. */
export function loadPreferences(): Preferences {
  const saved = readJson(PREFERENCES_KEY)
  if (!isRecord(saved)) return DEFAULT_PREFERENCES
  const { colorBlind, fontSize } = saved
  return {
    colorBlind: typeof colorBlind === 'boolean' ? colorBlind : DEFAULT_PREFERENCES.colorBlind,
    fontSize: FONT_SIZES.includes(fontSize as FontSize)
      ? (fontSize as FontSize)
      : DEFAULT_PREFERENCES.fontSize,
  }
}

export const savePreferences = (preferences: Preferences): void =>
  writeJson(PREFERENCES_KEY, preferences)
