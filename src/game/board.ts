import { evaluateGuess, type LetterResult } from './evaluate'
import type { GameState } from './game'
import { normalize } from './normalize'
import { MAX_ATTEMPTS, WORD_LENGTH } from './rules'

export interface TileView {
  /** Letra pronta para exibir, em maiúscula; vazia em casa sem letra. */
  letter: string
  result: LetterResult | null
  /** Casa da linha atual, que a jogadora pode selecionar. */
  active: boolean
  selected: boolean
}

const LOCALE = 'pt-BR'

export const displayWord = (word: string): string => word.toLocaleUpperCase(LOCALE)

/** O chute certo aparece com os acentos da resposta; os demais, como foram digitados. */
function shownLetters(guess: string, answer: string): string[] {
  return [...displayWord(guess === normalize(answer) ? answer : guess)]
}

const blankRow = (): TileView[] =>
  Array.from({ length: WORD_LENGTH }, () => ({
    letter: '',
    result: null,
    active: false,
    selected: false,
  }))

const typingRow = (slots: readonly string[], cursor: number): TileView[] =>
  slots.map((slot, index) => ({
    letter: displayWord(slot),
    result: null,
    active: true,
    selected: index === cursor,
  }))

export function boardRows({ guesses, slots, cursor, answer, status }: GameState): TileView[][] {
  const sent = guesses.map((guess) => {
    const letters = shownLetters(guess, answer)
    return evaluateGuess(guess, answer).map((result, index): TileView => ({
      letter: letters[index] ?? '',
      result,
      active: false,
      selected: false,
    }))
  })
  const rest = Array.from({ length: MAX_ATTEMPTS - sent.length }, (_, index) =>
    index === 0 && status === 'playing' ? typingRow(slots, cursor) : blankRow(),
  )
  return [...sent, ...rest]
}

const RANK: Record<LetterResult, number> = { absent: 0, present: 1, correct: 2 }

/** Melhor resultado de cada letra (normalizada) nos chutes, para colorir o teclado. */
export function letterResults(
  guesses: readonly string[],
  answer: string,
): Map<string, LetterResult> {
  const best = new Map<string, LetterResult>()
  for (const guess of guesses) {
    const results = evaluateGuess(guess, answer)
    results.forEach((result, index) => {
      const letter = guess.charAt(index)
      const known = best.get(letter)
      if (known === undefined || RANK[result] > RANK[known]) best.set(letter, result)
    })
  }
  return best
}
