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
  /** Casas da linha atual, em posições fixas: `''` marca uma casa vazia. */
  slots: string[]
  /** Casa selecionada na linha atual. */
  cursor: number
  status: GameStatus
  feedback: GuessFeedback | null
}

export type GameAction =
  | { type: 'typeLetter'; letter: string }
  | { type: 'deleteLetter' }
  | { type: 'submitGuess' }
  | { type: 'selectSlot'; index: number }
  | { type: 'moveCursor'; delta: -1 | 1 }

const emptySlots = (): string[] => Array<string>(WORD_LENGTH).fill('')

export const createGame = ({
  date,
  type,
  answer,
}: Pick<GameState, 'date' | 'type' | 'answer'>): GameState => ({
  date,
  type,
  answer,
  guesses: [],
  slots: emptySlots(),
  cursor: 0,
  status: 'playing',
  feedback: null,
})

/** Próxima casa vazia à direita; senão, a primeira vazia; com a linha cheia, fica onde está. */
function nextCursor(slots: readonly string[], cursor: number): number {
  const isEmpty = (slot: string, index: number) => slot === '' && index > cursor
  const right = slots.findIndex(isEmpty)
  if (right !== -1) return right
  const first = slots.indexOf('')
  return first === -1 ? cursor : first
}

const withSlot = (slots: readonly string[], index: number, letter: string): string[] =>
  slots.map((slot, position) => (position === index ? letter : slot))

function typeLetter(state: GameState, letter: string): GameState {
  const key = normalize(letter)
  if (!/^[a-z]$/.test(key)) return state
  const slots = withSlot(state.slots, state.cursor, key)
  return { ...state, slots, cursor: nextCursor(slots, state.cursor), feedback: null }
}

/** Apaga a casa selecionada; se ela estiver vazia, volta uma casa e apaga a letra de lá. */
function deleteLetter(state: GameState): GameState {
  const { slots, cursor } = state
  if (slots[cursor] === '' && cursor === 0) return state
  const target = slots[cursor] === '' ? cursor - 1 : cursor
  return { ...state, slots: withSlot(slots, target, ''), cursor: target, feedback: null }
}

/** Limita à linha: as setas não dão a volta nas pontas. */
const moveTo = (state: GameState, index: number): GameState => ({
  ...state,
  cursor: Math.min(Math.max(index, 0), WORD_LENGTH - 1),
  feedback: null,
})

function submitGuess(state: GameState): GameState {
  const { slots, answer } = state
  if (slots.includes('')) return { ...state, feedback: 'tooShort' }
  const guess = slots.join('')
  if (!isValidGuess(guess)) return { ...state, feedback: 'notInList' }

  const guesses = [...state.guesses, guess]
  const hit = guess === normalize(answer)
  const status = hit ? 'won' : guesses.length === MAX_ATTEMPTS ? 'lost' : 'playing'
  return { ...state, guesses, slots: emptySlots(), cursor: 0, status, feedback: null }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  if (state.status !== 'playing') return state
  switch (action.type) {
    case 'typeLetter':
      return typeLetter(state, action.letter)
    case 'deleteLetter':
      return deleteLetter(state)
    case 'submitGuess':
      return submitGuess(state)
    case 'selectSlot':
      return moveTo(state, action.index)
    case 'moveCursor':
      return moveTo(state, state.cursor + action.delta)
  }
}
