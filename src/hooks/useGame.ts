import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { boardRows, letterResults } from '../game/board'
import { todayKey } from '../game/dates'
import type { GameAction, GameType, GuessFeedback } from '../game/game'
import { remainingResets, resetAvailability } from '../game/resets'
import type { Rng } from '../game/rules'
import { activeGame, createSession, playAction, resetGame, switchGame } from '../game/session'
import type { Session } from '../game/session'
import { getCurrentStreak, updateStats, type Stats } from '../game/stats'
import { loadSession, loadStats, saveSession, saveStats } from '../storage/progress'
import { prefersReducedMotion, REVEAL_MS } from '../styles/motion'

export type ModalKind = 'help' | 'stats'
/** Aviso em tela. O texto de cada um fica no componente `Toast`. */
export type NoticeKind = GuessFeedback | 'finishWord' | 'noResets'

export interface Notice {
  /** Muda a cada aviso, para o mesmo texto reiniciar o tempo na tela. */
  id: number
  kind: NoticeKind
}

interface AppState {
  session: Session
  stats: Stats
  /** Linha do tabuleiro virando agora. Só ela anima: trocar de aba não repete a virada. */
  revealRow: number | null
  modal: ModalKind | null
  notice: Notice | null
  noticeCount: number
}

/**
 * `roll` e `today` chegam prontos na ação: o reducer precisa ser puro, e o StrictMode o
 * executa duas vezes. Quem traz `today` confere a virada do dia antes de agir.
 */
type AppAction =
  | { type: 'syncDay'; today: string }
  | { type: 'play'; action: GameAction; today: string }
  | { type: 'switchTab'; target: GameType; roll: number; today: string }
  | { type: 'pressReset'; roll: number; today: string }
  | { type: 'endReveal' }
  | { type: 'openModal'; modal: ModalKind; today: string }
  | { type: 'closeModal' }
  | { type: 'dismissNotice' }

const withNotice = (state: AppState, kind: NoticeKind): AppState => ({
  ...state,
  notice: { id: state.noticeCount + 1, kind },
  noticeCount: state.noticeCount + 1,
})

function play(state: AppState, action: GameAction): AppState {
  if (state.modal !== null) return state
  const { session, result } = playAction(state.session, action)
  const before = activeGame(state.session)
  const game = activeGame(session)
  const next: AppState = {
    ...state,
    session,
    stats: result ? updateStats(state.stats, result) : state.stats,
    notice: null,
    revealRow:
      game.guesses.length > before.guesses.length ? game.guesses.length - 1 : state.revealRow,
  }
  return action.type === 'submitGuess' && game.feedback ? withNotice(next, game.feedback) : next
}

function pressReset(state: AppState, roll: number): AppState {
  const { session } = state
  const availability = resetAvailability(session.resets, session.date, activeGame(session).status)
  if (availability === 'locked') return withNotice(state, 'finishWord')
  if (availability === 'exhausted') return withNotice(state, 'noResets')
  const changed = resetGame(session, () => roll)
  return changed
    ? { ...state, session: changed, revealRow: null, notice: null, modal: null }
    : state
}

function applyAction(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'syncDay':
      return state
    case 'play':
      return play(state, action.action)
    case 'switchTab':
      return {
        ...state,
        session: switchGame(state.session, action.target, () => action.roll),
        revealRow: null,
        notice: null,
      }
    case 'pressReset':
      return pressReset(state, action.roll)
    case 'endReveal': {
      const finished = activeGame(state.session).status !== 'playing'
      return { ...state, revealRow: null, modal: finished ? 'stats' : state.modal }
    }
    case 'openModal':
      return { ...state, modal: action.modal }
    case 'closeModal':
      return { ...state, modal: null }
    case 'dismissNotice':
      return { ...state, notice: null }
  }
}

const startDay = (state: AppState, today: string): AppState => ({
  ...state,
  session: createSession(today),
  revealRow: null,
  modal: null,
  notice: null,
})

function reducer(state: AppState, action: AppAction): AppState {
  if (!('today' in action) || action.today === state.session.date) {
    return applyAction(state, action)
  }
  const newDay = startDay(state, action.today)
  // Jogada e reset miravam a palavra que acabou de sair da tela: valem só para o dia velho.
  return action.type === 'play' || action.type === 'pressReset'
    ? newDay
    : applyAction(newDay, action)
}

const createState = (now: () => Date): AppState => ({
  session: loadSession(todayKey(now())),
  stats: loadStats(),
  revealRow: null,
  modal: null,
  notice: null,
  noticeCount: 0,
})

const NOTICE_MS = 2200

export function useGame(now: () => Date, rng: Rng) {
  const [state, dispatch] = useReducer(reducer, now, createState)
  const { session, stats, revealRow, modal, notice } = state
  const game = activeGame(session)
  const today = useCallback(() => todayKey(now()), [now])

  useEffect(() => saveSession(session), [session])
  useEffect(() => saveStats(stats), [stats])

  useEffect(() => {
    const syncDay = () => {
      if (document.visibilityState === 'visible') dispatch({ type: 'syncDay', today: today() })
    }
    document.addEventListener('visibilitychange', syncDay)
    window.addEventListener('focus', syncDay)
    return () => {
      document.removeEventListener('visibilitychange', syncDay)
      window.removeEventListener('focus', syncDay)
    }
  }, [today])

  useEffect(() => {
    if (revealRow === null) return
    const timer = setTimeout(
      () => dispatch({ type: 'endReveal' }),
      prefersReducedMotion() ? 0 : REVEAL_MS,
    )
    return () => clearTimeout(timer)
  }, [revealRow])

  useEffect(() => {
    if (notice === null) return
    const timer = setTimeout(() => dispatch({ type: 'dismissNotice' }), NOTICE_MS)
    return () => clearTimeout(timer)
  }, [notice])

  const play = useCallback(
    (action: GameAction) => dispatch({ type: 'play', action, today: today() }),
    [today],
  )
  const switchTab = useCallback(
    (target: GameType) => dispatch({ type: 'switchTab', target, roll: rng(), today: today() }),
    [rng, today],
  )
  const pressReset = useCallback(
    () => dispatch({ type: 'pressReset', roll: rng(), today: today() }),
    [rng, today],
  )
  const openModal = useCallback(
    (kind: ModalKind) => dispatch({ type: 'openModal', modal: kind, today: today() }),
    [today],
  )
  const closeModal = useCallback(() => dispatch({ type: 'closeModal' }), [])

  const rows = useMemo(() => boardRows(game), [game])
  // O teclado só ganha as cores do chute depois que a linha termina de virar.
  const settled = revealRow === null ? game.guesses : game.guesses.slice(0, revealRow)
  const letters = useMemo(() => letterResults(settled, game.answer), [settled, game.answer])

  return {
    game,
    rows,
    letters,
    revealRow,
    notice,
    modal,
    stats,
    streak: getCurrentStreak(stats, session.date),
    resetsLeft: remainingResets(session.resets, session.date),
    availability: resetAvailability(session.resets, session.date, game.status),
    play,
    switchTab,
    pressReset,
    openModal,
    closeModal,
  }
}
