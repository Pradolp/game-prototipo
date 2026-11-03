import { normalize } from './normalize'
import { MAX_ATTEMPTS, WORD_LENGTH } from './rules'
import { isValidGuess } from './validate'

export type GameType = 'daily' | 'extra'
export type GameStatus = 'playing' | 'won' | 'lost'
/** Motivo de um chute recusado; o texto mostrado fica na interface. */
export type GuessFeedback = 'tooShort' | 'notInList'

export interface GameState {
  date: string
  type: GameType
  /** Forma acentuada, usada para exibir a palavra no fim do jogo. */
  answer: string
  /** Chutes já enviados, na forma normalizada. */
  guesses: string[]
  current: string
  status: GameStatus
  feedback: GuessFeedback | null
}

export type GameAction =
  { type: 'typeLetter'; letter: string } | { type: 'deleteLetter' } | { type: 'submitGuess' }

export const createGame = ({
  date,
  type,
  answer,
}: Pick<GameState, 'date' | 'type' | 'answer'>): GameState => ({
  date,
  type,
  answer,
  guesses: [],
  current: '',
  status: 'playing',
  feedback: null,
})

function typeLetter(state: GameState, letter: string): GameState {
  const key = normalize(letter)
  if (!/^[a-z]$/.test(key) || state.current.length === WORD_LENGTH) return state
  return { ...state, current: state.current + key, feedback: null }
}

function submitGuess(state: GameState): GameState {
  const { current, answer } = state
  if (current.length < WORD_LENGTH) return { ...state, feedback: 'tooShort' }
  if (!isValidGuess(current)) return { ...state, feedback: 'notInList' }

  const guesses = [...state.guesses, current]
  const hit = current === normalize(answer)
  const status = hit ? 'won' : guesses.length === MAX_ATTEMPTS ? 'lost' : 'playing'
  return { ...state, guesses, current: '', status, feedback: null }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.status !== 'playing') return state
  switch (action.type) {
    case 'typeLetter':
      return typeLetter(state, action.letter)
    case 'deleteLetter':
      return { ...state, current: state.current.slice(0, -1), feedback: null }
    case 'submitGuess':
      return submitGuess(state)
  }
}
