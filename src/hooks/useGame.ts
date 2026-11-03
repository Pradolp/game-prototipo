import { useCallback, useEffect, useMemo, useReducer } from 'react'
import { boardRows, letterResults } from '../game/board'
import { todayKey } from '../game/dates'
import type { GameAction, GameType, GuessFeedback } from '../game/game'
import { remainingResets, resetAvailability } from '../game/resets'
import type { Rng } from '../game/rules'
import { activeGame, createSession, playAction, resetGame, switchGame } from '../game/session'
import type { Session } from '../game/session'
import { createStats, getCurrentStreak, updateStats, type Stats } from '../game/stats'
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

/** `roll` chega pronto na ação: o reducer precisa ser puro, e o StrictMode o executa duas vezes. */
type AppAction =
  | { type: 'play'; action: GameAction }
  | { type: 'switchTab'; target: GameType; roll: number }
  | { type: 'pressReset'; roll: number }
  | { type: 'endReveal' }
  | { type: 'openModal'; modal: ModalKind }
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
  return changed ? { ...state, session: changed, revealRow: null, notice: null } : state
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
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

const createState = (now: () => Date): AppState => ({
  session: createSession(todayKey(now())),
  stats: createStats(),
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

  const play = useCallback((action: GameAction) => dispatch({ type: 'play', action }), [])
  const switchTab = useCallback(
    (target: GameType) => dispatch({ type: 'switchTab', target, roll: rng() }),
    [rng],
  )
  const pressReset = useCallback(() => dispatch({ type: 'pressReset', roll: rng() }), [rng])
  const openModal = useCallback(
    (kind: ModalKind) => dispatch({ type: 'openModal', modal: kind }),
    [],
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
