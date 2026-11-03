import { evaluateGuess, type LetterResult } from './evaluate'
import type { GameState } from './game'
import { normalize } from './normalize'
import { MAX_ATTEMPTS, WORD_LENGTH } from './rules'

export interface TileView {
  /** Letra pronta para exibir, em maiúscula; vazia em casa sem letra. */
  letter: string
  result: LetterResult | null
  /** Casa da linha em digitação: já preenchida ou a próxima a preencher. */
  active: boolean
}

const LOCALE = 'pt-BR'

export const displayWord = (word: string): string => word.toLocaleUpperCase(LOCALE)

/** O chute certo aparece com os acentos da resposta; os demais, como foram digitados. */
function shownLetters(guess: string, answer: string): string[] {
  return [...displayWord(guess === normalize(answer) ? answer : guess)]
}

function typingRow(current: string, playing: boolean): TileView[] {
  const letters = [...displayWord(current)]
  return Array.from({ length: WORD_LENGTH }, (_, index) => ({
    letter: letters[index] ?? '',
    result: null,
    active: playing && index <= letters.length,
  }))
}

export function boardRows({ guesses, current, answer, status }: GameState): TileView[][] {
  const sent = guesses.map((guess) => {
    const letters = shownLetters(guess, answer)
    return evaluateGuess(guess, answer).map((result, index): TileView => ({
      letter: letters[index] ?? '',
      result,
      active: false,
    }))
  })
  const blank = Array.from({ length: MAX_ATTEMPTS - sent.length }, (_, index) =>
    typingRow(index === 0 ? current : '', index === 0 && status === 'playing'),
  )
  return [...sent, ...blank]
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
