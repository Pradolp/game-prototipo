import { dayNumber } from '../game/dates'
import type { GameState, GameStatus, GameType } from '../game/game'
import { normalize } from '../game/normalize'
import { createResetState, MAX_RESETS, type ResetState } from '../game/resets'
import { MAX_ATTEMPTS, WORD_LENGTH } from '../game/rules'
import { createSession, type Session } from '../game/session'
import { createStats, type Stats } from '../game/stats'
import { isCount, isRecord, readJson, writeJson } from './storage'

const SESSION_KEY = 'session'
const RESETS_KEY = 'resets'
const STATS_KEY = 'stats'

type SavedGame = Pick<GameState, 'type' | 'answer' | 'guesses' | 'status' | 'slots' | 'cursor'>

interface SavedSession {
  date: string
  daily: SavedGame
  extra: SavedGame | null
}

const STATUSES: readonly GameStatus[] = ['playing', 'won', 'lost']
const GUESS = new RegExp(`^[a-z]{${WORD_LENGTH}}$`)

const isStringList = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string')

function isSavedGame(value: unknown, type: GameType): value is SavedGame {
  if (!isRecord(value)) return false
  const { answer, guesses, status, slots, cursor } = value
  return (
    value.type === type &&
    typeof answer === 'string' &&
    normalize(answer).length === WORD_LENGTH &&
    isStringList(guesses) &&
    guesses.length <= MAX_ATTEMPTS &&
    guesses.every((guess) => GUESS.test(guess)) &&
    STATUSES.includes(status as GameStatus) &&
    isStringList(slots) &&
    slots.length === WORD_LENGTH &&
    slots.every((slot) => /^[a-z]?$/.test(slot)) &&
    isCount(cursor) &&
    cursor < WORD_LENGTH
  )
}

const isSavedSession = (value: unknown): value is SavedSession =>
  isRecord(value) &&
  isSavedGame(value.daily, 'daily') &&
  (value.extra === null || isSavedGame(value.extra, 'extra'))

const isResetState = (value: unknown): value is ResetState =>
  isRecord(value) && isCount(value.used) && value.used <= MAX_RESETS && isStringList(value.played)

function isDateKey(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    dayNumber(value)
    return true
  } catch {
    return false
  }
}

const isStats = (value: unknown): value is Stats =>
  isRecord(value) &&
  isCount(value.played) &&
  isCount(value.won) &&
  isCount(value.currentStreak) &&
  isCount(value.bestStreak) &&
  (value.lastDailyWinDate === null || isDateKey(value.lastDailyWinDate)) &&
  Array.isArray(value.distribution) &&
  value.distribution.length === MAX_ATTEMPTS &&
  value.distribution.every(isCount)

const toSaved = ({ type, answer, guesses, status, slots, cursor }: GameState): SavedGame => ({
  type,
  answer,
  guesses,
  status,
  slots,
  cursor,
})

const toGame = (saved: SavedGame, date: string): GameState => ({ ...saved, date, feedback: null })

function loadResets(today: string): ResetState {
  const saved = readJson(RESETS_KEY)
  return isResetState(saved) && saved.date === today ? saved : createResetState(today)
}

/**
 * Sessão de hoje. Dados de outro dia ou inválidos valem como sessão nova, e a aba volta a
 * ser a Palavra do dia. Os resets ficam em chave própria: perder a sessão não os devolve.
 */
export function loadSession(today: string): Session {
  const session = createSession(today)
  const resets = loadResets(today)
  const saved = readJson(SESSION_KEY)
  if (!isSavedSession(saved) || saved.date !== today) return { ...session, resets }

  const extra = saved.extra && toGame(saved.extra, today)
  const played = extra && !resets.played.includes(extra.answer) ? [extra.answer] : []
  return {
    ...session,
    daily: toGame(saved.daily, today),
    extra,
    resets: { ...resets, played: [...resets.played, ...played] },
  }
}

export function saveSession({ date, daily, extra, resets }: Session): void {
  const saved: SavedSession = {
    date,
    daily: toSaved(daily),
    extra: extra && toSaved(extra),
  }
  writeJson(SESSION_KEY, saved)
  writeJson(RESETS_KEY, resets)
}

export function loadStats(): Stats {
  const saved = readJson(STATS_KEY)
  return isStats(saved) ? saved : createStats()
}

export const saveStats = (stats: Stats): void => writeJson(STATS_KEY, stats)
