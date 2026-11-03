import { ANSWER_WORDS } from '../data/answers'
import { getDailyWord } from './daily'
import type { GameStatus } from './game'
import type { Rng } from './rules'

export const MAX_RESETS = 3

export interface ResetState {
  date: string
  used: number
  /** Palavras extras já sorteadas nesta data. */
  played: string[]
}

export interface ResetResult {
  state: ResetState
  word: string
}

export const createResetState = (date: string): ResetState => ({ date, used: 0, played: [] })

/** O estado de outro dia vale como zerado: é assim que os resets renovam à meia-noite. */
const stateFor = (state: ResetState, today: string): ResetState =>
  state.date === today ? state : createResetState(today)

export const remainingResets = (state: ResetState, today: string): number =>
  MAX_RESETS - stateFor(state, today).used

/** O reset só libera com a palavra atual terminada e com resets sobrando. */
export const canReset = (state: ResetState, today: string, status: GameStatus): boolean =>
  status !== 'playing' && remainingResets(state, today) > 0

/** Situação do botão de reset. Sem resets, `exhausted` vale até com a partida em andamento. */
export type ResetAvailability = 'ready' | 'locked' | 'exhausted'

export function resetAvailability(
  state: ResetState,
  today: string,
  status: GameStatus,
): ResetAvailability {
  if (remainingResets(state, today) === 0) return 'exhausted'
  return canReset(state, today, status) ? 'ready' : 'locked'
}

/** Sorteia fora a palavra do dia e as já jogadas; `undefined` se não sobrar nenhuma. */
function drawWord(current: ResetState, rng: Rng, words: readonly string[]): string | undefined {
  const excluded = new Set([getDailyWord(current.date, words), ...current.played])
  const pool = words.filter((word) => !excluded.has(word))
  return pool[Math.floor(rng() * pool.length)]
}

/** Primeira palavra da aba CHUTE no dia: registra em `played` sem gastar reset. */
export function drawFirstExtra(
  state: ResetState,
  today: string,
  rng: Rng,
  words: readonly string[] = ANSWER_WORDS,
): ResetResult | null {
  const current = stateFor(state, today)
  const word = drawWord(current, rng, words)
  if (word === undefined) return null
  return { word, state: { ...current, played: [...current.played, word] } }
}

/** Troca a palavra da aba CHUTE. Devolve `null` se `canReset` recusar ou faltar palavra. */
export function applyReset(
  state: ResetState,
  today: string,
  status: GameStatus,
  rng: Rng,
  words: readonly string[] = ANSWER_WORDS,
): ResetResult | null {
  if (!canReset(state, today, status)) return null
  const current = stateFor(state, today)
  const word = drawWord(current, rng, words)
  if (word === undefined) return null
  return {
    word,
    state: { ...current, used: current.used + 1, played: [...current.played, word] },
  }
}
