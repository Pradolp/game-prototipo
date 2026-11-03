import { ANSWER_WORDS } from '../data/answers'
import { getDailyWord } from './daily'
import { createGame, gameReducer, type GameAction, type GameState, type GameType } from './game'
import { applyReset, createResetState, drawFirstExtra, type ResetState } from './resets'
import type { Rng } from './rules'
import type { GameResult } from './stats'

/**
 * Tudo que a jogadora tem em um dia. Em outro dia, comece com `createSession`: a palavra
 * de CHUTE em andamento é descartada. Na interface, o tipo `extra` se chama CHUTE.
 */
export interface Session {
  date: string
  daily: GameState
  extra: GameState | null
  /** Aba aberta. Não faz parte do progresso: o jogo sempre abre em `daily`. */
  active: GameType
  resets: ResetState
}

export const createSession = (date: string, words: readonly string[] = ANSWER_WORDS): Session => ({
  date,
  daily: createGame({ date, type: 'daily', answer: getDailyWord(date, words) }),
  extra: null,
  active: 'daily',
  resets: createResetState(date),
})

export const activeGame = (session: Session): GameState =>
  (session.active === 'extra' && session.extra) || session.daily

const newExtra = (session: Session, answer: string, resets: ResetState): Session => ({
  ...session,
  extra: createGame({ date: session.date, type: 'extra', answer }),
  active: 'extra',
  resets,
})

/** Troca de aba. A primeira abertura de CHUTE no dia sorteia a palavra sem gastar reset. */
export function switchGame(
  session: Session,
  target: GameType,
  rng: Rng,
  words: readonly string[] = ANSWER_WORDS,
): Session {
  if (target === 'daily' || session.extra) return { ...session, active: target }
  const first = drawFirstExtra(session.resets, session.date, rng, words)
  return first ? newExtra(session, first.word, first.state) : session
}

/** Troca a palavra de CHUTE. Recusa com `null` na outra aba ou com a palavra em andamento. */
export function resetGame(
  session: Session,
  rng: Rng,
  words: readonly string[] = ANSWER_WORDS,
): Session | null {
  const game = activeGame(session)
  if (game.type !== 'extra') return null
  const reset = applyReset(session.resets, session.date, game.status, rng, words)
  return reset && newExtra(session, reset.word, reset.state)
}

export interface PlayStep {
  session: Session
  /** Preenchido só na ação que termina a partida: passe para `updateStats`. */
  result: GameResult | null
}

export function playAction(session: Session, action: GameAction): PlayStep {
  const game = activeGame(session)
  const next = gameReducer(game, action)
  const finished = game.status === 'playing' && next.status !== 'playing'
  return {
    session: next.type === 'extra' ? { ...session, extra: next } : { ...session, daily: next },
    result: finished
      ? {
          type: next.type,
          date: next.date,
          won: next.status === 'won',
          attempts: next.guesses.length,
        }
      : null,
  }
}
